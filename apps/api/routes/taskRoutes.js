const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const Task = require('../models/Task1');
const Project = require('../models/Project');
const Subtask = require('../models/SubTask');
const Comment = require('../models/Comment');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { logActivity } = require("../middlewares/auditLogMiddleware");
const {sendTaskEmail}=require('../services/emailServices');
const { sendNotification, sendNotificationsToTeam, sendNotificationToManager } = require('../services/notificationService');
const User = require('../models/User');
const Milestone = require("../models/Milestone");

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage });

// create task
router.post("/create/:projectId", authMiddleware, permissionMiddleware('create_task'), upload.array('attachments', 5), async (req, res) => {
  const { taskName, assignee, assigner, teamStatus, progress, dueDate, subtasks, comment, milestone } = req.body;
  const files = req.files;

  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });

  // Generate task ID in format TKYYMMDD-0001
  const today = new Date();
  const yy = String(today.getFullYear()).slice(-2);
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const datePart = `${yy}${mm}${dd}`;
  const prefix = `TK${datePart}`;

  const latestTask = await Task.findOne({
    taskId: new RegExp(`^${prefix}-\\d{4}$`)
  }).sort({ taskId: -1 });

  let sequenceNumber = '0001';
  if (latestTask) {
    const lastSequence = parseInt(latestTask.taskId.split('-')[1]);
    sequenceNumber = String(lastSequence + 1).padStart(4, '0');
  }

  const taskId = `${prefix}-${sequenceNumber}`;

  const newTask = new Task({
    taskName,
    taskId,
    assignee,
    assigner: req.user.id,
    teamStatus,
    progress,
    dueDate,
    subtasks,
    comments: [] // Initialize empty comments array
  });

  console.log('newTask', newTask);

  try {
    await newTask.save();
    project.tasks.push(newTask._id);

    // Update project status based on tasks
    if (project.tasks.length > 0) {
      project.status = "In Progress";
    }

    await project.save();

    // ✅ ✅ NEW CODE: Add milestone if provided
    if (milestone && milestone.milestoneName) {
      const milestoneCount = await Milestone.countDocuments({ projectId: project._id });
      const milestoneId = `M${milestoneCount + 1}`;

      const newMilestone = new Milestone({
        milestoneId,
        milestoneName: milestone.milestoneName,
        budget: milestone.budget || 0,
        dueDate: milestone.dueDate,
        projectId: project._id,
        tasks: [newTask._id],
        status: "In Progress"
      });

      await newMilestone.save();

      // Link milestone to task
      newTask.milestone = newMilestone._id;
      await newTask.save();

      // Push milestone to project
      project.milestones.push(newMilestone._id);
      await project.save();
    }

    // ✅ Your existing comment logic
    if (comment) {
      const attachments = files ? files.map(file => ({
        fileName: file.originalname,
        fileUrl: file.path,
        fileType: file.mimetype,
        fileSize: file.size
      })) : [];

      const newComment = new Comment({
        content: comment,
        user: req.user.id,
        task: newTask._id,
        attachments
      });

      await newComment.save();
      newTask.comments.push(newComment._id);
      await newTask.save();
    }

    // ✅ Your existing logActivity code
    await logActivity(req.user.id, "Created Task", newTask._id, "task", `Task ID: ${newTask.taskName}`, req.user.parentId);

    // Populate the task with all related data
    const populatedTask = await Task.findById(newTask._id)
      .populate('assignee', 'name email location')
      .populate({
        path: 'subtasks',
        populate: {
          path: 'assignee',
          select: 'name email location'
        },
        select: 'name assignee status submission'
      })
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    // ✅ Your existing notifications
    if (assignee) {
      await sendNotification(
        assignee,
        'New Task Assigned',
        `New task has been assigned: "${taskName}" in project "${project.projectName}".`,
        'task',
        newTask._id
      );
    }

    if (teamStatus) {
      await sendNotificationsToTeam(
        teamStatus,
        'New Task Created',
        `A new task "${taskName}" has been created in project "${project.projectName}".`,
        'task',
        newTask._id
      );
    }

    // ✅ Your existing test email
    const assignerUser = await User.findById(req.user.id).select("name email");

// ✅ Send email only to assignee
if (assignee) {
  const assigneeUser = await User.findById(assignee).select("name email");
  const message =
    `Hi ${assigneeUser?.name || "User"},\n\n` +
    `You have been assigned a new task:\n` +
    `Task Name: ${taskName}\n` +
    `Project: ${project.projectName}\n` +
    `Due Date: ${dueDate || "Not specified"}\n` +
    `Assigned by: ${assignerUser?.name || "System"}\n\n` +
    `Regards,\nSGC Team`;

  await sendTaskEmail(
    assigneeUser.email,        // ✅ mail goes to actual assignee
    "📌 New Task Assigned",
    message
  );
}

    res.status(201).json({
      message: "Task created successfully (Milestone added if provided)",
      task: populatedTask
    });

  } catch (error) {
    console.log("Error creating task", error);
    res.status(500).json({ message: "Error creating task", error });
  }
});



// get tasks and subtasks
router.get("/view/:projectId", authMiddleware, async (req, res) => {
    const projectId = req.params.projectId;
    
    try {
        const project = await Project.findById(projectId)
            .populate({
                path: "tasks",
                populate: [
                    {
                        path: "assignee",
                        select: "name email ",
                    },
                    {
                        path: "assigner",
                        select: "name email ",
                    },
                    
                    {
                        path: "subtasks",
                        populate: {
                            path: "assignee",
                            select: "name email ",
                        },
                        select: "name assignee status submission"
                    },
                    {  
                        path: "comments",
                        populate: {
                            path: "user",
                            select: "name email"
                        }
                    }
                ],
            });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json({ 
            message: "Tasks and subtasks fetched successfully", 
            project
        });
    } catch (error) {
        console.error("Error fetching tasks and subtasks:", error);
        res.status(500).json({ message: "Error fetching tasks and subtasks", error });
    }
});

// Get all tasks and subtasks for a user
router.get("/user-tasks", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        let tasks;
        if (userRole === "admin") {
            // Admin can see all tasks
            tasks = await Task.find()
                .populate('assignee', 'name email ')
                .populate('assigner', 'name email ')
                .populate({
                    path: 'subtasks',
                    populate: {
                        path: 'assignee',
                        select: 'name email '
                    },
                    select: 'name assignee status submission'
                })
                .populate({
                    path: 'comments',
                    populate: {
                        path: 'user',
                        select: 'name email'
                    }
                });
        } else if (userRole === "manager") {
            // Manager should see all tasks in projects that match their team
            // First, get the manager's team
            const manager = await User.findById(userId).select('team');
            
            if (!manager || !manager.team) {
                return res.status(400).json({ 
                    message: "Manager does not have a team assigned" 
                });
            }
            
            
            // Find all projects that match the manager's team
            const managerProjects = await Project.find({
                team: manager.team
            }).select('_id tasks');
            
           
            
            // Get all task IDs from these projects
            const taskIds = managerProjects.reduce((acc, project) => {
                if (project.tasks && project.tasks.length > 0) {
                    acc.push(...project.tasks);
                }
                return acc;
            }, []);
            
          
            // Then, find all tasks that belong to these projects
            tasks = await Task.find({
                _id: { $in: taskIds }
            })
            .populate('assignee', 'name email ')
            .populate('assigner', 'name email ')
            .populate({
                path: 'subtasks',
                populate: {
                    path: 'assignee',
                    select: 'name email'
                },
                select: 'name assignee status submission'
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            });
        } else if (userRole === "opic") {
            // OPIC users can see tasks assigned to them or their subtasks
            tasks = await Task.find({
                $or: [
                    { assignee: userId },
                    { assigner: userId }
                ]
            })
            .populate('assignee', 'name email location')
            .populate({
                path: 'subtasks',
                populate: {
                    path: 'assignee',
                    select: 'name email location'
                },
                select: 'name assignee status submission'
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            });
        }


        // Get project details for each task
        const tasksWithProjects = await Promise.all(tasks.map(async (task) => {
            const project = await Project.findOne({ tasks: task._id })
                .select('projectName projectId status');
            
            return {
                ...task.toObject(),
                project: project || null
            };
        }));

        // Get current date and calculate date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);  
        
        // Calculate end of current week (Sunday)
        const endOfWeek = new Date(today);
        const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
        const daysUntilSunday = 7 - currentDay;
        endOfWeek.setDate(today.getDate() + daysUntilSunday);
        endOfWeek.setHours(23, 59, 59, 999); // Set to end of Sunday

        // Group tasks by status
        const groupedTasks = {
            all: tasksWithProjects,
            pending: tasksWithProjects.filter(task => task.teamStatus === "Not Started"),
            inProgress: tasksWithProjects.filter(task => task.teamStatus === "In Progress"),
            completed: tasksWithProjects.filter(task => task.teamStatus === "Completed"),
            active: tasksWithProjects.filter(task => task.teamStatus === "Active"),
            dueToday: tasksWithProjects.filter(task => {
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate.getTime() === today.getTime() && task.teamStatus !== "Completed";
            }),
            dueInWeek: tasksWithProjects.filter(task => {
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate > today && 
                       taskDueDate <= endOfWeek && 
                       task.teamStatus !== "Completed";
            }),
            overdue: tasksWithProjects.filter(task => {
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate < today && task.teamStatus !== "Completed";
            })
        };

        console.log('user tasks');

        res.status(200).json({
            message: "Tasks fetched successfully",
            tasks: groupedTasks,
            totalTasks: tasksWithProjects.length,
            stats: {
                pending: groupedTasks.pending.length,
                inProgress: groupedTasks.inProgress.length,
                completed: groupedTasks.completed.length,
                active: groupedTasks.active.length,
                dueToday: groupedTasks.dueToday.length,
                dueInWeek: groupedTasks.dueInWeek.length,
                overdue: groupedTasks.overdue.length
            }
        });
    } catch (error) {
        console.error("Error fetching user tasks:", error);
        res.status(500).json({ message: "Error fetching tasks", error: error.message });
    }
});
   
// add subtask
router.post("/add/subtask/:taskId", authMiddleware, permissionMiddleware('create_subtask'), async (req, res) => {
    try {
        const { taskId } = req.params;
    const { name, assignee, submission, status } = req.body;

        // Find the task
        const task = await Task.findById(taskId).populate('subtasks', 'name assignee status submission');
        
    if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
    }

        // Create the subtask
        const subtask = new Subtask({
        name,
        assignee,
            task: taskId,
        status,     
            createdBy: req.user.id,
            submission
        });
        
        await subtask.save();
        
        // Add the subtask to the task
        task.subtasks.push(subtask._id);
        
        // Calculate the task progress
        // Get all subtasks with their status
        const subtasks = await Subtask.find({ _id: { $in: task.subtasks } });
        
        const totalSubtasks = subtasks.length;
        const completedSubtasks = subtasks.filter(st => st.status === "Completed").length;
        const inProgressSubtasks = subtasks.filter(st => st.status === "In Progress").length;

        console.log('completed subtask', completedSubtasks);
        console.log('in progress subtask', inProgressSubtasks);
        
        // Calculate progress: (completed + 0.5 * inProgress) / total * 100
        // const progress = totalSubtasks > 0 ? Math.round(((completedSubtasks + (0.5 * inProgressSubtasks)) / totalSubtasks) * 100) : 0;
        
       const progress = Math.round((completedSubtasks/totalSubtasks)*100);

        // Update task progress and status
        task.progress = progress;
        
        if (completedSubtasks === totalSubtasks) {
            // If all subtasks are completed, mark the task as completed
            task.teamStatus = "Completed";
            task.progress = 100; // Ensure progress is 100%
        } else if (progress > 0) {
            task.teamStatus = "In Progress";
        } else {
            task.teamStatus = "Not Started";
        }
        
        await task.save();

        // Find and update the parent project
        const project = await Project.findOne({ tasks: task._id });
        if (project) {
            // Get all tasks for this project
            const projectTasks = await Task.find({ _id: { $in: project.tasks } });
            
            if (projectTasks.length > 0) {
                // Calculate project progress based on task progress
                const totalProgress = projectTasks.reduce((sum, task) => sum + task.progress, 0);
                const projectProgress = Math.round(totalProgress / projectTasks.length);
                
                // Update project status based on all tasks
                const allTasksCompleted = projectTasks.every(task => task.teamStatus === "Completed");
                const anyTaskInProgress = projectTasks.some(task => task.teamStatus === "In Progress");
                
                // if (allTasksCompleted) {
                //     project.status = "Completed";
                // } else if (anyTaskInProgress) {
                //     project.status = "In Progress";
                // } else {
                //     project.status = "Pending";
                // }

                if (allTasksCompleted) {
                    project.status = "Completed";
                } else{
                    project.status = "In Progress";
                } 
                
                // Log the status update for debugging
                console.log('Project status update from subtask creation:', {
                    projectId: project._id,
                    oldStatus: project.status,
                    newStatus: project.status,
                    allTasksCompleted,
                    anyTaskInProgress,
                    totalTasks: projectTasks.length,
                    completedTasks: projectTasks.filter(t => t.teamStatus === "Completed").length,
                    inProgressTasks: projectTasks.filter(t => t.teamStatus === "In Progress").length
                });
                
                await project.save();
            }
        }
        
        // Send notification to the assignee
        if (assignee) {
            await sendNotification(
                assignee,
                'New Subtask Assigned',
                `Subtask "${name}" has been assigned for task "${task.taskName}".`,
                'subtask',
                subtask._id
            );
        }

         if (assignee) {
        const assigneeUser = await User.findById(assignee);
        if (assigneeUser && assigneeUser.email) {
          try {
            await sendTaskEmail(
              assigneeUser.email,
              "🆕 Subtask Assigned",
              `Hi ${assigneeUser.name || ""},\n\nYou have been assigned a new subtask:\n\n📌 Subtask: ${name}\n Task: ${task.taskName}\n Status: ${task.teamStatus}\n Due Date: ${submission || "Not specified"}\n\nProject: ${project?.projectName || "N/A"}\n\nRegards,\nSGC Team`
            );
          } catch (mailErr) {
            console.error("📨 Error sending subtask email to assignee:", mailErr.message);
          }
        }
      }
        
        
        // Log the activity
        await logActivity(req.user.id, "Created Subtask", subtask._id, "subtask", `Subtask ID: Subtask: ${name} form Task: ${task.taskName}`, req.user.parentId);
        
        res.status(201).json({
            success: true,
            message: "Subtask added successfully",
            subtask,
            task
        });
    } catch (error) {
        console.error("Error adding subtask:", error);
        res.status(500).json({
            success: false,
            message: "Error adding subtask",
            error: error.message
        });
    }
});

// Update task by ID


router.put(
  "/update/:taskId",
  authMiddleware,
  permissionMiddleware("edit_task"),
  async (req, res) => {
    try {
      const taskId = req.params.taskId;
      const {
        assignee,
        teamStatus,
        progress,
        dueDate,
        taskName,
        assigner,
        closeReason,
        closeDate,
      } = req.body;

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // ❌ Prevent updates if task is already CLOSED
      if (task.teamStatus === "Closed") {
        return res
          .status(400)
          .json({ message: "Cannot modify a closed task" });
      }

      // ✅ Allow “Completed” → “Closed” only for Japan Desk or Project Owner
      if (task.teamStatus === "Completed") {
        const isClosing = teamStatus === "Closed";
        const userRole = req.user?.role;
        const userTeam = req.user?.team;

        const isAuthorized =
          userRole === "projectOwner" || userTeam?.toLowerCase() === "japandesk";

        if (isClosing && isAuthorized) {
          if (!closeReason || !closeDate) {
            return res.status(400).json({
              message: "Reason and close date are required to close a task",
            });
          }

          // Set closure details
          task.closeReason = closeReason;
          task.closeDate = new Date(closeDate);
          task.teamStatus = "Closed";
          await task.save();

          return res.status(200).json({
            message: "Task closed successfully",
            task,
          });
        } else {
          return res.status(400).json({
            message:
              "Cannot modify a completed task unless closing it (Japan Desk or Project Owner only)",
          });
        }
      }

      // ✅ Continue only for editable tasks (Assigned / In Progress)
      const oldValues = {
        taskName: task.taskName,
        assignee: task.assignee,
        teamStatus: task.teamStatus,
        progress: task.progress,
        dueDate: task.dueDate,
      };

      const assigneeChanged =
        assignee &&
        task.assignee &&
        assignee.toString() !== task.assignee.toString();

      if (assigneeChanged || assignee) {
        await Subtask.updateMany(
          { _id: { $in: task.subtasks } },
          { $set: { assignee: assignee } }
        );
      }

      const statusChanged = teamStatus && task.teamStatus !== teamStatus;
      const isCompleted = teamStatus === "Completed";

      // Handle dueDate update with role-based restrictions
      if (typeof dueDate !== "undefined") {
        const userRole = req.user.role;
        const newDueDate = new Date(dueDate);
        const currentDueDate = new Date(task.dueDate);
        currentDueDate.setHours(0, 0, 0, 0);

        if (userRole !== "admin") {
          if (!(newDueDate < currentDueDate)) {
            return res.status(400).json({
              message:
                "You can only set the due date to a day before the current due date.",
            });
          }
        }
        task.dueDate = newDueDate;
      }

      // ✅ Update provided fields
      if (assignee) task.assignee = assignee;
      if (taskName) task.taskName = taskName;
      if (assigner) task.assigner = req.user.id;
      if (teamStatus) task.teamStatus = teamStatus;
      if (progress) task.progress = progress;
      if (dueDate) task.dueDate = dueDate;

      if (isCompleted && statusChanged) {
        task.completionDate = new Date();
        if (task.subtasks && task.subtasks.length > 0) {
          await Subtask.updateMany(
            { _id: { $in: task.subtasks } },
            { $set: { status: "Completed" } }
          );
        }
        task.progress = 100;
      }

      await task.save();

      // ✅ Auto-complete milestone if all tasks done
      if (isCompleted && task.milestone) {
        const milestone = await Milestone.findById(task.milestone);
        if (milestone) {
          const milestoneTasks = await Task.find({ milestone: milestone._id });
          const allTasksCompleted = milestoneTasks.every(
            (t) => t.teamStatus === "Completed"
          );

          milestone.status = allTasksCompleted
            ? "Completed"
            : "In Progress";
          await milestone.save();
        }
      }

      // ✅ Update project status
      const project = await Project.findOne({ tasks: taskId });
      if (project) {
        const projectTasks = await Task.find({ _id: { $in: project.tasks } });
        if (projectTasks.length > 0) {
          const totalProgress = projectTasks.reduce(
            (sum, task) => sum + task.progress,
            0
          );
          const projectProgress = Math.round(
            totalProgress / projectTasks.length
          );

          const allTasksCompleted = projectTasks.every(
            (task) => task.teamStatus === "Completed"
          );
          const anyTaskInProgress = projectTasks.some(
            (task) => task.teamStatus === "In Progress"
          );

          if (allTasksCompleted) {
            project.status = "Completed";
          } else if (anyTaskInProgress) {
            project.status = "In Progress";
          } else {
            project.status = "Pending";
          }

          await project.save();
        }
      }

      // ✅ Notify admin and assignee if relevant
      const admin = await User.findOne({ role: "admin" });

      if (admin) {
        let changes = [];
        if (taskName && taskName !== oldValues.taskName)
          changes.push(`Task name changed from "${oldValues.taskName}" to "${taskName}"`);
        if (assigneeChanged) changes.push(`Task assigned to new user`);
        if (teamStatus && teamStatus !== oldValues.teamStatus)
          changes.push(`Task status changed to ${teamStatus}`);
        if (progress && progress !== oldValues.progress)
          changes.push(`Task progress updated to ${progress}%`);
        if (dueDate && dueDate !== oldValues.dueDate)
          changes.push(`Task due date updated`);

        if (changes.length > 0) {
          await sendNotification(
            admin._id,
            "Task Updated",
            `Task "${taskName || task.taskName}" has been updated: ${changes.join(", ")}`,
            "task",
            task._id
          );
        }
      }

      if (task.assignee && assigneeChanged) {
        await sendNotification(
          task.assignee,
          "Task Assigned",
          `Task "${taskName || task.taskName}" has been assigned.`,
          "task",
          task._id
        );
      }

      if (isCompleted && statusChanged && task.assignee) {
        await sendNotificationToManager(
          task.assignee,
          "Task Completed",
          `The task "${task.taskName}" has been completed.`,
          "task",
          task._id
        );
      }

      // ✅ Send email to assignee
      const assignerUser = await User.findById(req.user.id).select("name email");
      if (assignee) {
        const assigneeUser = await User.findById(assignee).select("name email");
        const message =
          `Hi ${assigneeUser?.name || "User"},\n\n` +
          `The task assigned to you has been updated:\n\n` +
          `Task Name: ${taskName}\n` +
          `Project: ${project.projectName}\n` +
          `Status: ${teamStatus || "Not specified"}\n` +
          `Due Date: ${dueDate || "Not specified"}\n` +
          `Updated by: ${assignerUser?.name || "System"}\n\n` +
          `Regards,\nSGC Team`;

        await sendTaskEmail(assigneeUser.email, "✏️ Task Updated", message);
      }

      // ✅ Fetch updated task
      const updatedTask = await Task.findById(taskId)
        .populate("assignee", "name email location")
        .populate("assigner", "name email")
        .populate({
          path: "subtasks",
          populate: {
            path: "assignee",
            select: "name email location",
          },
          select: "name assignee status submission",
        });

      await logActivity(
        req.user.id,
        "Updated Task",
        updatedTask._id,
        "task",
        `Task ID: ${updatedTask.taskName}`,
        req.user.parentId
      );

      res.status(200).json({
        message: "Task updated successfully",
        task: updatedTask,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({
        message: "Error updating task",
        error: error.message,
      });
    }
  }
);






// Delete task and its subtasks by ID
// make sure this is imported

router.delete("/delete/:taskId", authMiddleware, permissionMiddleware('delete_task'), async (req, res) => {
  try {
    const taskId = req.params.taskId;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Find the project containing the task
    const project = await Project.findOne({ tasks: taskId });
    if (project) {
      project.tasks = project.tasks.filter(t => t.toString() !== taskId);

      // ✅ FIX: Prevent clientName array casting issue
    //   if (Array.isArray(project.clientName)) {
    //     project.clientName = project.clientName.length > 0 ? project.clientName[0] : null;
    //   }

      // Update project status
      if (project.tasks.length === 0) {
        project.status = "In Progress";
      } else {
        const remainingTasks = await Task.find({ _id: { $in: project.tasks } });
        const allTasksCompleted = remainingTasks.every(task => task.teamStatus === "Completed");
        const anyTaskInProgress = remainingTasks.some(task => task.teamStatus === "In Progress");

        project.status = allTasksCompleted ? "Completed" : "In Progress";
      }

      await project.save();
    }

    // Delete subtasks
    if (task.subtasks && task.subtasks.length > 0) {
      await Subtask.deleteMany({ _id: { $in: task.subtasks } });
    }

    // Notify assignee
    if (task.assignee) {
      await sendNotification(
        task.assignee,
        'Task Deleted',
        `Task "${task.taskName}" has been deleted from project "${project.projectName}".`,
        'task',
        taskId
      );

      //✅ Email the assignee too
      
    }
   const assigneeUser = await User.findById(task.assignee);
if (assigneeUser && assigneeUser.email) {
  const message =
    `Hi ${assigneeUser.name || "User"},\n\n` +
    `The following task assigned to you has been deleted:\n\n` +
    `Task Name: ${task.taskName}\n` +
    `Project: ${project.projectName}\n` +
    `Deleted by: ${req.user?.name || "User"}\n\n` +
    `Regards,\nSGC Team`;

  await sendTaskEmail(
    assigneeUser.email,
    "🗑️ Task Deleted",
    message
  );
}
    
    await Task.findByIdAndDelete(taskId);

    await logActivity(req.user.id, "Deleted Task", taskId, "task", `Task ID: ${task.taskName}`, req.user.parentId);

    res.status(200).json({
      message: "Task and associated subtasks deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});




// Delete subtask and remove its reference from parent task
router.delete(
  "/delete/subtask/:subtaskId",
  authMiddleware,
  permissionMiddleware("delete_subtask"),
  async (req, res) => {
    const subtaskId = req.params.subtaskId;

    try {
      // 1. Find subtask before deleting
      const subtask = await Subtask.findById(subtaskId).populate(
        "assignee",
        "name email"
      );

      if (!subtask) {
        return res.status(404).json({ message: "Subtask not found" });
      }

      // 2. Find parent task containing this subtask
      const task = await Task.findOne({ subtasks: subtaskId }).populate({
        path: "subtasks",
        populate: {
          path: "assignee",
          select: "name email location",
        },
        select: "name assignee status submission",
      });

      if (task) {
        // Save deleted subtask status before removal
        const deletedSubtaskStatus = subtask.status;

        // Remove subtask from task
        task.subtasks = task.subtasks.filter(
          (s) => s._id.toString() !== subtaskId
        );

        // Recalculate progress
        const totalSubtasks = task.subtasks.length;
        if (totalSubtasks > 0) {
          const subtasks = await Subtask.find({
            _id: { $in: task.subtasks.map((s) => s._id) },
          });

          const completed = subtasks.filter((s) => s.status === "Completed")
            .length;
          const inProgress = subtasks.filter(
            (s) => s.status === "In Progress"
          ).length;

          task.progress = Math.round((completed / totalSubtasks) * 100);

          if (completed === totalSubtasks) {
            task.teamStatus = "Completed";
            task.progress = 100;
          } else if (completed > 0 || inProgress > 0) {
            task.teamStatus = "In Progress";
          } else {
            task.teamStatus = "Not Started";
          }

          // Special case: deleted in-progress subtask & all remaining are completed
          if (
            deletedSubtaskStatus === "In Progress" &&
            completed === totalSubtasks
          ) {
            task.teamStatus = "Completed";
            task.progress = 100;
          }
        } else {
          task.progress = 0;
          task.teamStatus = "Not Started";
        }

        await task.save();

        // Update project progress/status
        const project = await Project.findOne({ tasks: task._id });
        if (project) {
          const projectTasks = await Task.find({ _id: { $in: project.tasks } });

          if (projectTasks.length > 0) {
            const totalProgress = projectTasks.reduce(
              (sum, t) => sum + t.progress,
              0
            );
            const projectProgress = Math.round(
              totalProgress / projectTasks.length
            );

            const allTasksCompleted = projectTasks.every(
              (t) => t.teamStatus === "Completed"
            );

            project.status = allTasksCompleted ? "Completed" : "In Progress";
            project.progress = projectProgress;

            await project.save();
          }
        }

        // Notify subtask assignee (if exists)
        if (subtask.assignee?.email) {
          const assignerUser = await User.findById(req.user.id).select(
            "name email"
          );
          const projectDetails = await Project.findOne({
            tasks: task._id,
          }).select("projectName");

          const assigneeMessage =
            `Hi ${subtask.assignee.name || "User"},\n\n` +
            `The subtask assigned to you has been deleted:\n\n` +
            `Subtask Name: ${subtask.name}\n` +
            `Parent Task: ${task.taskName}\n` +
            `Project: ${projectDetails?.projectName || "Not specified"}\n` +
            `Status (before deletion): ${subtask.status || "Not specified"}\n` +
            `Deleted by: ${assignerUser?.name || "System"}\n\n` +
            `Regards,\nSGC Team`;

          await sendTaskEmail(
            subtask.assignee.email,
            "🗑️ Subtask Deletion Notification",
            assigneeMessage
          );
        }

        // Delete subtask finally
        await Subtask.findByIdAndDelete(subtaskId);

        await logActivity(
          req.user.id,
          "Deleted Subtask",
          subtaskId,
          "subtask",
          `Subtask: ${subtask.name}`,
          req.user.parentId
        );
      }

      res
        .status(200)
        .json({ message: "Subtask deleted successfully", task });
    } catch (error) {
      console.error("Error deleting subtask:", error);
      res
        .status(500)
        .json({ message: "Error deleting subtask", error: error.message });
    }
  }
);


// Update subtask by ID
router.put("/update/subtask/:subtaskId", authMiddleware, permissionMiddleware('edit_subtask') ,async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { name, description, dueDate, assignee, status, submission } = req.body;

        console.log('enter in subtask');
        
        // Find the subtask
        const subtask = await Subtask.findById(subtaskId);
        
        if (!subtask) {
            return res.status(404).json({
                success: false,
                message: "Subtask not found"
            });
        }

        // Find the parent task
        const task = await Task.findOne({ subtasks: subtaskId });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Parent task not found"
            });
        }

        // Check if parent task is completed
        if (task.teamStatus === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify subtasks of a completed task"
            });
        }
        
        // Check if the assignee has changed
        const assigneeChanged = assignee && subtask.assignee && assignee.toString() !== subtask.assignee.toString();
        
        // Check if the status has changed
        const statusChanged = status && subtask.status !== status;
        const isCompleted = status === "Completed";
        
        // Update the subtask
        subtask.name = name || subtask.name;
        subtask.description = description || subtask.description;
        subtask.dueDate = dueDate || subtask.dueDate;
        subtask.assignee = assignee || subtask.assignee;
        subtask.status = status || subtask.status;
        subtask.submission = submission || subtask.submission;

        await subtask.save();

        // Send notification if the assignee has changed
        if (assigneeChanged && assignee) {
            await sendNotification(
                assignee,
                'Subtask Assigned',
                `Subtask "${name || subtask.name}" has been assigned.`,
                'subtask',
                subtask._id
            );
        }
        
        // Send notification if the status has changed to Completed
        if (statusChanged && isCompleted) {
            if (task.assignee && task.assignee.toString() !== req.user.id) {
                await sendNotification(
                    task.assignee,
                    'Subtask Completed',
                    `Subtask "${name || subtask.name}" for task "${task.taskName}" has been completed.`,
                    'subtask',
                    subtask._id
                );

                // Send notification to manager
                await sendNotificationToManager(
                    task.assignee,
                    'Subtask Completed',
                    `Subtask "${name || subtask.name}" for task "${task.taskName}" has been completed.`,
                    'subtask',
                    subtask._id
                );
            }
        }
         //email

         const assignerUser = await User.findById(req.user.id).select("name email");

// If assignee exists, send them update mail
if (subtask.assignee) {
  const assigneeUser = await User.findById(subtask.assignee).select("name email");

  if (assigneeUser?.email) {
    const assigneeMessage =
      `Hi ${assigneeUser?.name || "User"},\n\n` +
      `The subtask assigned to you has been updated:\n\n` +
      `Subtask Name: ${subtask.name}\n` +
      `Parent Task: ${task.taskName}\n` +
      `Status: ${subtask.status || "Not specified"}\n` +
      `Due Date: ${subtask.dueDate || "Not specified"}\n` +
      `Updated by: ${assignerUser?.name || "System"}\n\n` +
      `Regards,\nSGC Team`;

    await sendTaskEmail(
      assigneeUser.email,
      "✏️ Subtask Updated",
      assigneeMessage
    );
  }
}

        
        // Update the parent task progress
        const subtasks = await Subtask.find({ _id: { $in: task.subtasks } });
        
        const totalSubtasks = subtasks.length;
        const completedSubtasks = subtasks.filter(st => st.status === "Completed").length;
        const inProgressSubtasks = subtasks.filter(st => st.status === "In Progress").length;
        
        const progress = Math.round((completedSubtasks/totalSubtasks)*100);

        console.log('completed subtask', completedSubtasks);
        console.log('in progress subtask', inProgressSubtasks);

        // Update task progress and status
        task.progress = progress;
        
        if (completedSubtasks === totalSubtasks) {
            // If all subtasks are completed, mark the task as completed
            task.teamStatus = "Completed";
            task.progress = 100; // Ensure progress is 100%
            task.completionDate = new Date(); // Set completion date
        } else if (progress > 0) {
            task.teamStatus = "In Progress";
        } else {
            task.teamStatus = "Not Started";
        }
        
        await task.save(); 
        
        // Find and update the parent project
        const project = await Project.findOne({ tasks: task._id });
        if (project) {
            // Get all tasks for this project
            const projectTasks = await Task.find({ _id: { $in: project.tasks } });
            
            if (projectTasks.length > 0) {
                // Calculate project progress based on task progress
                const totalProgress = projectTasks.reduce((sum, task) => sum + task.progress, 0);
                const projectProgress = Math.round(totalProgress / projectTasks.length);
                
                // Update project status based on all tasks
                const allTasksCompleted = projectTasks.every(task => task.teamStatus === "Completed");
                const anyTaskInProgress = projectTasks.some(task => task.teamStatus === "In Progress");

                 if (allTasksCompleted) {
                    project.status = "Completed";
                } else{
                    project.status = "In Progress";
                } 
                
                // if (allTasksCompleted) {
                //     project.status = "Completed";
                // } else if (anyTaskInProgress) {
                //     project.status = "In Progress";
                // } else {
                //     project.status = "Pending";
                // }
                
                // Log the status update for debugging
                console.log('Project status update from subtask update:', {
                    projectId: project._id,
                    oldStatus: project.status,
                    newStatus: project.status,
                    allTasksCompleted,
                    anyTaskInProgress,
                    totalTasks: projectTasks.length,
                    completedTasks: projectTasks.filter(t => t.teamStatus === "Completed").length,
                    inProgressTasks: projectTasks.filter(t => t.teamStatus === "In Progress").length
                });
                
                await project.save();
            }
        }
        
        // Log the activity
        await logActivity(req.user.id, "Updated Subtask", subtask._id, "subtask", `Subtask ID: ${subtask.name} form Task: ${task ? task.taskName : 'Unknown Task'}`, req.user.parentId);

        res.status(200).json({ 
            success: true,
            message: "Subtask updated successfully",
            subtask
        });
    } catch (error) {
        console.error("Error updating subtask:", error);
        res.status(500).json({
            success: false,
            message: "Error updating subtask",
            error: error.message
        });
    }
});

// Add comment to task
router.post("/add/comment/:taskId", authMiddleware, upload.array('attachments', 5), async (req, res) => {
    const taskId = req.params.taskId;
    const { content } = req.body;
    const files = req.files;

    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const attachments = files ? files.map(file => ({
            fileName: file.originalname,
            fileUrl: file.path,
            fileType: file.mimetype,
            fileSize: file.size
        })) : [];

        const newComment = new Comment({
            content,
            user: req.user.id,
            task: taskId,
            attachments
        });

        await newComment.save();
        task.comments.push(newComment._id);
        await task.save();

        await logActivity(req.user.id, "Added Comment", newComment._id, "comment", `Comment on Task: ${task.taskId}`, req.user.parentId);

        // Populate the comment with user details
        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'name email');

        res.status(201).json({ 
            message: "Comment added successfully", 
            comment: populatedComment 
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Error adding comment", error: error.message });
    }
});

// Get all due tasks
router.get("/due-tasks", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Get current date and set time to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get date for one week from now
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(today.getDate() + 7);
        
        // Build query based on user role
        let query = {};
        
        if (userRole === "admin") {
            // Admin can see all tasks
            query = {
                dueDate: { $exists: true, $ne: null }
            };
        } else if (userRole === "manager") {
            // Manager can see tasks they created or are assigned to
            query = {
                dueDate: { $exists: true, $ne: null },
                $or: [
                    { assignee: userId },
                    { 'subtasks.assignee': userId },
                    { assigner: userId }
                ]
            };
        } else if (userRole === "opic") {
            // OPIC users can see tasks assigned to them or their subtasks
            query = {
                dueDate: { $exists: true, $ne: null },
                $or: [
                    { assignee: userId },
                    { assigner: userId }
                ]
            };
        }
        
        // Find all tasks with due dates
        const tasks = await Task.find(query)
            .populate('assignee', 'name email location')
            .populate('assigner', 'name email')
            .populate({
                path: 'subtasks',
                populate: {
                    path: 'assignee',
                    select: 'name email location'
                },
                select: 'name assignee status submission'
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            });
        
        // Get project details for each task
        const tasksWithProjects = await Promise.all(tasks.map(async (task) => {
            const project = await Project.findOne({ tasks: task._id })
                .select('projectName projectId status');
            
            return {
                ...task.toObject(),
                project: project || null
            };
        }));
        
        // Categorize tasks by due status
        const dueTasks = {
            dueToday: tasksWithProjects.filter(task => {
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate.getTime() === today.getTime() && task.teamStatus !== "Completed";
            }),
            dueInWeek: tasksWithProjects.filter(task => {
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate > today && 
                       taskDueDate <= oneWeekFromNow && 
                       task.teamStatus !== "Completed";
            }),
            overdue: tasksWithProjects.filter(task => {
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate < today && task.teamStatus !== "Completed";
            }),
            allDueTasks: tasksWithProjects.filter(task => {
                return task.teamStatus !== "Completed";
            })
        };
        
        // Limit results to 10 for admin users
        if (userRole === "admin") {
            dueTasks.dueToday = dueTasks.dueToday.slice(0, 10);
            dueTasks.dueInWeek = dueTasks.dueInWeek.slice(0, 10);
            dueTasks.overdue = dueTasks.overdue.slice(0, 10);
            dueTasks.allDueTasks = dueTasks.allDueTasks.slice(0, 10);
        }
        
        res.status(200).json({
            success: true,
            message: "Due tasks fetched successfully",
            dueTasks,
            stats: {
                dueToday: dueTasks.dueToday.length,
                dueInWeek: dueTasks.dueInWeek.length,
                overdue: dueTasks.overdue.length,
                total: dueTasks.allDueTasks.length
            }
        });
    } catch (error) {
        console.error("Error fetching due tasks:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching due tasks",
            error: error.message
        });
    }
});

// Get task workload by team and due date
router.get("/workload", authMiddleware, async (req, res) => {
    try {
        // Get the team filter from query params (optional)
        const { team } = req.query;
        
        // Get current date and set time to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get dates for the next 7 days
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        
        // Build query based on user role
        let query = {
            dueDate: { $exists: true, $ne: null }
        };

        // Filter tasks based on user role
        if (req.user.role === "manager") {
            // Managers can see their team's tasks
            const teamMembers = await User.find({ 
                managerId: req.user.id,
                role: "opic"
            }).select('_id team');
            const teamMemberIds = teamMembers.map(member => member._id);
            query.assignee = { $in: teamMemberIds };
        } else if (req.user.role === "opic") {
            // OPICs can only see their own tasks
            query.assignee = req.user.id;
        }
        // Admin can see all tasks (no additional query filters needed)
        
        // Find all tasks with due dates and populate the assignee to get team information
        const tasks = await Task.find(query)
            .populate('assignee', 'team')
            .lean();
        
        // Define all teams that should be included in the response
        const allTeams = ["Business Advisory", "Tax Advisory", "Japandesk"];
        
        // Initialize result object
        const result = {};
        
        // For each team in the predefined list, calculate workload for each day
        for (const teamName of allTeams) {
            // Skip if team filter is provided and doesn't match
            if (team && team !== teamName) continue;
            
            // Filter tasks for this team
            const teamTasks = tasks.filter(task => task.assignee?.team === teamName);
            
            // Initialize workload data for this team
            const workloadData = [];
            
            // For each date, count tasks due on that day
            for (let i = 0; i < dates.length; i++) {
                const date = dates[i];
                const dateStr = date.toISOString().split('T')[0];
                
                // Count tasks due on this date
                const tasksDueOnDate = teamTasks.filter(task => {
                    const taskDueDate = new Date(task.dueDate);
                    taskDueDate.setHours(0, 0, 0, 0);
                    return taskDueDate.getTime() === date.getTime();
                }).length;
                
                // Format day label
                let dayLabel;
                if (i === 0) {
                    dayLabel = "Today";
                } else if (i === 1) {
                    dayLabel = "Tomorrow";
                } else {
                    // Format as "DD MMM"
                    const day = date.getDate();
                    const month = date.toLocaleString('default', { month: 'short' });
                    dayLabel = `${day} ${month}`;
                }
                
                // Add to workload data
                workloadData.push({
                    day: dayLabel,
                    tasks: tasksDueOnDate,
                    active: tasksDueOnDate > 0,
                    highlight: tasksDueOnDate > 15 // Highlight if more than 15 tasks
                });
            }
            
            // Add to result
            result[teamName] = workloadData;
        }
        
        // Calculate the 'all' field - sum of tasks across all teams for each day
        const allWorkloadData = [];
        for (let i = 0; i < dates.length; i++) {
            const date = dates[i];
            
            // Format day label
            let dayLabel;
            if (i === 0) {
                dayLabel = "Today";
            } else if (i === 1) {
                dayLabel = "Tomorrow";
            } else {
                // Format as "DD MMM"
                const day = date.getDate();
                const month = date.toLocaleString('default', { month: 'short' });
                dayLabel = `${day} ${month}`;
            }
            
            // Sum tasks from all teams for this day
            let totalTasks = 0;
            for (const teamName of allTeams) {
                if (result[teamName] && result[teamName][i]) {
                    totalTasks += result[teamName][i].tasks;
                }
            }
            
            // Add to all workload data
            allWorkloadData.push({
                day: dayLabel,
                tasks: totalTasks,
                active: totalTasks > 0,
                highlight: totalTasks > 15 // Highlight if more than 15 tasks
            });
        }
        
        // Add the 'all' field to the result
        result.all = allWorkloadData;
        
        res.status(200).json({
            success: true,
            message: "Task workload fetched successfully",
            workload: result
        });
    } catch (error) {
        console.log("Error fetching task workload:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching task workload",
            error: error.message
        });
    }
});

// Get OPIC workload for managers
router.get("/opic-workload", authMiddleware, async (req, res) => {
    try {
        // Check if user is manager
        if (req.user.role !== "manager") {
            return res.status(403).json({ message: "Access denied. Manager only." });
        }

        const managerId = req.user.id;
        
        // Get current date and set time to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get dates for the next 7 days
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        
        // Find all OPICs assigned to this manager
        const opics = await User.find({ 
            managerId: managerId,
            role: "opic"
        }).select('_id name');
        
        if (!opics || opics.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No OPICs found for this manager",
                workload: {}
            });
        }
        
        // Get all tasks assigned to these OPICs
        const opicIds = opics.map(opic => opic._id);
        const tasks = await Task.find({
            assignee: { $in: opicIds }
        }).lean();
        
        // Initialize result object
        const result = {};
        
        // For each OPIC, calculate workload for each day
        for (const opic of opics) {
            // Filter tasks for this OPIC
            const opicTasks = tasks.filter(task => 
                task.assignee.toString() === opic._id.toString()
            );
            
            // Initialize workload data for this OPIC
            const workloadData = [];
            
            // For each date, count tasks active on that day
            for (let i = 0; i < dates.length; i++) {
                const date = dates[i];
                const dateStr = date.toISOString().split('T')[0];
                
                // Count tasks active on this date
                const tasksActiveOnDate = opicTasks.filter(task => {
                    // Convert task dates to Date objects if they're strings
                    const taskCreatedAt = task.createdAt instanceof Date ? 
                        task.createdAt : new Date(task.createdAt);
                    
                    const taskDueDate = task.dueDate instanceof Date ? 
                        task.dueDate : new Date(task.dueDate);
                    
                    // Set hours to 0 for date comparison
                    const taskCreatedDate = new Date(taskCreatedAt);
                    taskCreatedDate.setHours(0, 0, 0, 0);
                    
                    const taskDueDateOnly = new Date(taskDueDate);
                    taskDueDateOnly.setHours(0, 0, 0, 0);
                    
                    // Task is active if:
                    // 1. It was created on or before this date AND
                    // 2. It's due on or after this date
                    return taskCreatedDate <= date && taskDueDateOnly >= date;
                }).length;
                
                // Format day label
                let dayLabel;
                if (i === 0) {
                    dayLabel = "Today";
                } else if (i === 1) {
                    dayLabel = "Tomorrow";
                } else {
                    // Format as "DD MMM"
                    const day = date.getDate();
                    const month = date.toLocaleString('default', { month: 'short' });
                    dayLabel = `${day} ${month}`;
                }
                
                // Add to workload data
                workloadData.push({
                    day: dayLabel,
                    tasks: tasksActiveOnDate,
                    active: tasksActiveOnDate > 0,
                    highlight: tasksActiveOnDate > 15 // Highlight if more than 15 tasks
                });
            }
            
            // Add to result
            result[opic.name] = workloadData;
        }
        
        res.status(200).json({
            success: true,
            message: "OPIC workload fetched successfully",
            workload: result
        });
    } catch (error) {
        console.log("Error fetching OPIC workload:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching OPIC workload",
            error: error.message
        });
    }
});

// Get task performance data
router.get("/performance", authMiddleware, async (req, res) => {
    try {
        // Get current date and set time to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Define all teams
        const allTeams = ["Business Advisory", "Tax Advisory", "Japandesk"];
        
        // Initialize result object for all periods
        const result = {
            week: {},
            month: {},
            year: {}
        };
        
        // Determine which teams to include based on user role
        let teamsToInclude = [];
        
        if (req.user.role === "admin") {
            // Admin can see all teams
            teamsToInclude = [...allTeams];
        } else if (req.user.role === "manager") {
            // Manager can only see their team
            const manager = await User.findById(req.user.id);
            if (manager && manager.team) {
                teamsToInclude = [manager.team];
            }
        } else if (req.user.role === "opic") {
            // OPIC can only see their own performance
            const opic = await User.findById(req.user.id);
            if (opic && opic.team) {
                teamsToInclude = [opic.team];
            }
        }

        console.log('teams to be include', teamsToInclude);
        
        // Process each period
        const periods = [
            { name: 'week', days: 7 },
            { name: 'month', days: 30 },
            { name: 'year', months: 12 }
        ];
        
        for (const period of periods) {
            // Calculate date ranges based on period
            let startDate, endDate, dates = [];
            
            if (period.name === 'year') {
                // For year view: Get last 12 months excluding current month
                endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
                startDate = new Date(endDate);
                startDate.setMonth(startDate.getMonth() - 11); // Go back 11 more months
                
                // Generate monthly data points for year view
                for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
                    dates.push(new Date(date));
                }
            } else if (period.name === 'week') {
                // For week view: Get last 7 days excluding current day
                endDate = new Date(today);
                endDate.setDate(today.getDate() - 1); // Yesterday
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 6); // 7 days before yesterday
                
                // Generate daily data points for week view
                for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                    dates.push(new Date(date));
                }
            } else {
                // For month view: Get last 30 days excluding current day
                endDate = new Date(today);
                endDate.setDate(today.getDate() - 1); // Yesterday
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 29); // 30 days before yesterday
                
                // Generate daily data points for month view
                for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                    dates.push(new Date(date));
                }
            }
            
            // For each team to include, calculate performance data
            for (const teamName of teamsToInclude) {
                // First, find all projects for this team
                const teamProjects = await Project.find({ team: teamName });
                
                // Get all task IDs from these projects
                const taskIds = teamProjects.reduce((acc, project) => {
                    if (project.tasks && project.tasks.length > 0) {
                        acc.push(...project.tasks);
                    }
                    return acc;
                }, []);
                
                // Get all tasks for these projects
                const teamTasks = await Task.find({
                    _id: { $in: taskIds }
                }).lean();
                
                // Initialize performance data for this team
                const teamPerformanceData = [];
                
                // For each date, calculate target and achieved tasks
                for (let i = 0; i < dates.length; i++) {
                    const date = dates[i];
                    
                    // Create a UTC date for the start of the day for comparison
                    const compareDateUTC = Date.UTC(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                    );
                    const compareDate = new Date(compareDateUTC);

                    // Format date label based on period
                    let dateLabel;
                    if (period.name === 'year') {
                        dateLabel = compareDate.toLocaleString('default', { month: 'short', year: 'numeric', timeZone: 'UTC' });
                    } else {
                        dateLabel = compareDate.toLocaleString('default', { day: 'numeric', month: 'short', timeZone: 'UTC' });
                    }
                    
                    // Count total tasks for this date (target)
                    const targetTasks = teamTasks.filter(task => {
                        if (!task.dueDate) return false;
                        
                        const taskDueDate = new Date(task.dueDate);
                        
                        // Compare only year, month, and day in UTC
                        return taskDueDate.getUTCFullYear() === compareDate.getUTCFullYear() &&
                               taskDueDate.getUTCMonth() === compareDate.getUTCMonth() &&
                               taskDueDate.getUTCDate() === compareDate.getUTCDate();
                    }).length;
                    
                    // Count completed tasks for this date (achieved)
                    const achievedTasks = teamTasks.filter(task => {
                        if (!task.dueDate || task.teamStatus !== "Completed") return false;
                        
                        const taskDueDate = new Date(task.dueDate);
                        
                        // Compare only year, month, and day in UTC
                        return taskDueDate.getUTCFullYear() === compareDate.getUTCFullYear() &&
                               taskDueDate.getUTCMonth() === compareDate.getUTCMonth() &&
                               taskDueDate.getUTCDate() === compareDate.getUTCDate();
                    }).length;

                    // Log tasks for this date to help debug
                    const tasksForDate = teamTasks.filter(task => {
                        if (!task.dueDate) return false;
                        const taskDueDate = new Date(task.dueDate);
                        return taskDueDate.getUTCFullYear() === compareDate.getUTCFullYear() &&
                               taskDueDate.getUTCMonth() === compareDate.getUTCMonth() &&
                               taskDueDate.getUTCDate() === compareDate.getUTCDate();
                    }).map(task => ({
                        taskId: task.taskId,
                        taskName: task.taskName,
                        dueDate: task.dueDate,
                        status: task.teamStatus
                    }));

                    // console.log(`Performance calculation for ${dateLabel}:`, {
                    //     team: teamName,
                    //     period: period.name,
                    //     targetTasks,
                    //     achievedTasks,
                    //     date: date.toISOString(),
                    //     compareDateUTC: compareDate.toISOString(),
                    //     totalProjects: teamProjects.length,
                    //     totalTasks: teamTasks.length,
                    //     matchingTasksDetails: tasksForDate
                    // });

                   
                    teamPerformanceData.push({
                        date: dateLabel,
                        target: targetTasks,
                        achieved: achievedTasks,
                        highlight: achievedTasks < targetTasks * 0.7 
                    });
                }
                
                // Add to result for this period
                result[period.name][teamName] = teamPerformanceData;
            }
            
            // Calculate the 'all' field for this period
            const allPerformanceData = [];
            for (let i = 0; i < dates.length; i++) {
                const date = dates[i];
                
                // Format date label based on period
                let dateLabel;
                if (period.name === 'year') {
                    dateLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                } else {
                    dateLabel = date.toLocaleString('default', { day: 'numeric', month: 'short' });
                }
                
                // Sum targets and achievements from included teams
                let totalTarget = 0;
                let totalAchieved = 0;
                
                for (const teamName of teamsToInclude) {
                    if (result[period.name][teamName] && result[period.name][teamName][i]) {
                        totalTarget += result[period.name][teamName][i].target;
                        totalAchieved += result[period.name][teamName][i].achieved;
                    }
                }
                
                // Add to all performance data
                allPerformanceData.push({
                    date: dateLabel,
                    target: totalTarget,
                    achieved: totalAchieved,
                    highlight: totalAchieved < totalTarget * 0.7 // Highlight if achieved is less than 70% of target
                });
            }
            
            // Add the 'all' field to the result for this period
            result[period.name].all = allPerformanceData;
        }
        
        res.status(200).json({
            success: true,
            message: "Team performance data fetched successfully",
            performance: result
        });
    } catch (error) {
        console.log("Error fetching team performance data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching team performance data",
            error: error.message
        });
    }
});

//Task Dependency
router.post("/:taskId/dependencies", authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { personId, description } = req.body;

    // ✅ Validation
    if (!personId || !description) {
      return res.status(400).json({ message: "Person and description are required." });
    }

    // ✅ Find main task
    const mainTask = await Task.findById(taskId).populate("assigner", "name email");
    if (!mainTask) {
      return res.status(404).json({ message: "Task not found." });
    }

    // ✅ Prevent adding dependency if task is already completed
    if (mainTask.teamStatus === "Completed") {
      return res.status(400).json({
        message: "Cannot add dependency to a completed task.",
      });
    }

    // ✅ Check if dependency already exists for same person & description
    const exists = mainTask.dependencies.some(
      (d) =>
        d.personId.toString() === personId.toString() &&
        d.description.trim().toLowerCase() === description.trim().toLowerCase()
    );

    if (exists) {
      return res.status(400).json({ message: "This dependency already exists for this person." });
    }

    // ✅ Push new dependency (default status = Pending)
    mainTask.dependencies.push({
      personId,
      description,
      status: "Pending",
    });

    await mainTask.save();

    // ✅ Fetch person details for email
    const assignedUser = await User.findById(personId).select("name email");

    // ✅ Prepare email content
    const emailSubject = "📌 New Dependency Assigned";
    const emailBody =
      `Hi ${assignedUser?.name || "User"},\n\n` +
      `You have been assigned a new dependency for task "${mainTask.taskName}".\n\n` +
      `Dependency Details:\n` +
      `- Description: ${description}\n` +
      `- Status: Pending\n` +
      `- Task: ${mainTask.taskName}\n` +
      `- Assigned By: ${mainTask.assigner?.name || "Manager"}\n` +
      `Please check your Dependency list for more details.\n\n` +
      `Regards,\nSGC Team`;

    try {
      // ✅ Send email to assigned person
      if (assignedUser?.email) {
        await sendTaskEmail(assignedUser.email, emailSubject, emailBody);
      }

      // ✅ Send copy to testing email also
    } catch (emailErr) {
      console.error("📨 Error sending dependency email:", emailErr.message);
    }

    return res.status(200).json({
      message: "Dependency added successfully, email sent to assigned person.",
      task: mainTask,
    });
  } catch (error) {
    console.error("Error adding dependency:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


router.put("/:taskId/dependencies/status", authMiddleware, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { depId, status, userId } = req.body;

    // ✅ Validation
    if (!depId || !status || !userId) {
      return res.status(400).json({
        message: "Dependency ID, status, and user ID are required.",
      });
    }

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }

    // ✅ Find task
    const task = await Task.findById(taskId).populate("assigner", "name email");
    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    // ✅ Find dependency
    const dependency = task.dependencies.id(depId);
    if (!dependency) {
      return res.status(404).json({ message: "Dependency not found." });
    }

    // ✅ Ensure only assigned person can update their dependency
    if (dependency.personId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to update this dependency status.",
      });
    }

    // ✅ Update status
    dependency.status = status;
    await task.save();

    // ✅ Fetch assigned user details
    const assignedUser = dependency.personId;

    // ✅ Prepare email body
    const emailSubject = "🔔 Dependency Status Updated";
    const emailBody =
      `Hi ${task.assigner?.name || "User"},\n\n` +
      `The dependency for task "${task.taskName}" has been updated.\n\n` +
      `Dependency Details:\n` +
      `- Description: ${dependency.description || "No description"}\n` +
      `- Updated Status: ${status}\n` +
      `- Updated By: ${assignedUser?.name || "User"}\n\n` +
      `Regards,\nSGC Team`;

    try {
      // ✅ Send email to assigner
      if (task.assigner?.email) {
        await sendTaskEmail(task.assigner.email, emailSubject, emailBody);
      }

      // ✅ Send copy to testing email
    } catch (mailErr) {
      console.error("📨 Error sending dependency status email:", mailErr.message);
    }

    return res.status(200).json({
      message: "Dependency status updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating dependency status:", error);
    return res.status(500).json({
      message: "Failed to update dependency status",
      error: error.message,
    });
  }
});



router.get("/dependencies/:personId",authMiddleware,async (req, res) => {
  try {
    const { personId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(personId)) {
      return res.status(400).json({ message: "Invalid person ID" });
    }

    // ✅ Find all tasks that have at least one dependency for this person
    const tasks = await Task.find({ "dependencies.personId": personId })
      .select("taskName taskId dependencies teamStatus dueDate assigner")
      .populate("dependencies.personId", "name email") // populate user details
      .lean();

    if (!tasks || tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found for this person." });
    }
     console.log("tasks", tasks);
    // ✅ Filter dependencies to return only those matching the personId
    const filteredTasks = tasks.map((task) => ({
      _id: task._id,
      taskId: task.taskId,
      taskName: task.taskName,
      teamStatus: task.teamStatus,
      dueDate: task.dueDate,
      assigner: task.assigner,
      dependencies: task.dependencies.filter(
        (dep) => dep.personId._id.toString() === personId
      ),
    }));

    return res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: filteredTasks,
    });
  } catch (error) {
    console.error("Error fetching tasks by personId:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


// Copy a task with its subtasks and assignees
router.post("/copy/:taskId", authMiddleware, permissionMiddleware('create_task'), async (req, res) => {
    try {
        console.log('enter in tasks');

        const originalTask = await Task.findById(req.params.taskId).populate('subtasks');
        if (!originalTask) return res.status(404).json({ message: "Task not found" });

        // Find the parent project
        const project = await Project.findOne({ tasks: originalTask._id });
        if (!project) return res.status(404).json({ message: "Parent project not found" });

        // Generate new taskId (same logic as create)
        const today = new Date();
        const yy = String(today.getFullYear()).slice(-2);
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const datePart = `${yy}${mm}${dd}`;
        const prefix = `TK${datePart}`;
        const latestTask = await Task.findOne({
            taskId: new RegExp(`^${prefix}-\\d{4}$`)
        }).sort({ taskId: -1 });
        let sequenceNumber = '0001';
        if (latestTask) {
            const lastSequence = parseInt(latestTask.taskId.split('-')[1]);
            sequenceNumber = String(lastSequence + 1).padStart(4, '0');
        }
        const taskId = `${prefix}-${sequenceNumber}`;

        // Copy subtasks
        const newSubtaskIds = [];
        for (const subtask of originalTask.subtasks) {
            const newSubtask = new Subtask({
                name: subtask.name,
                assignee: subtask.assignee,
                status: subtask.status,
                submission: subtask.submission,
                createdBy: subtask.createdBy
            });
            await newSubtask.save();
            newSubtaskIds.push(newSubtask._id);
        }

        // Create new task
        const newTask = new Task({
            taskName: originalTask.taskName + ' (Copy)',
            taskId,
            assignee: originalTask.assignee,
            assigner: originalTask.assigner,
            teamStatus: originalTask.teamStatus,
            progress: originalTask.progress,
            dueDate: originalTask.dueDate,
            subtasks: newSubtaskIds,
            comments: []
        });
        await newTask.save();

        // Add new task to the parent project
        project.tasks.push(newTask._id);
        await project.save();

        console.log('new task', newTask);

        res.status(201).json({ message: "Task copied successfully", task: newTask });
    } catch (error) {
        console.log("error",error);
        res.status(500).json({ message: "Error copying task", error: error.message });
    }
});

// Link milestone to a task
router.put("/link-milestone/:taskId", authMiddleware, async (req, res) => {
  try {
    const { milestoneId } = req.body;
    console.log("Linking milestone:", milestoneId);

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (!milestoneId || milestoneId === "NA") {
      // Unlink milestone
      // Remove task from previous milestone if exists
      if (task.milestone) {
        await Milestone.findByIdAndUpdate(task.milestone, {
          $pull: { tasks: task._id },
        });
      }

      task.milestone = null;
      await task.save();

      return res
        .status(200)
        .json({ message: "Milestone unlinked successfully", task });
    }

    // Validate milestone exists
    const milestone = await Milestone.findById(milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    // Update task with milestone reference
    task.milestone = milestone._id;
    await task.save();

    // Add task reference to milestone
    await Milestone.findByIdAndUpdate(milestoneId, {
      $addToSet: { tasks: task._id },
      status: "In Progress",
    });

    res
      .status(200)
      .json({ message: "Milestone linked to task successfully", task });
  } catch (error) {
    res.status(500).json({ message: "Error linking milestone", error });
  }
});






module.exports = router;