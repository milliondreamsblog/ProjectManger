const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const Project = require("../models/Project");
const Task = require('../models/Task1');
const router = express.Router();  
const Subtask = require('../models/SubTask');
const ProjectTemplate = require('../models/ProjectTemplate');
const { logActivity } = require("../middlewares/auditLogMiddleware");
const { sendNotification, sendNotificationsToTeam, sendNotificationsToUsers } = require('../services/notificationService');
const User = require('../models/User');
const { sendTaskEmail } = require("../services/emailServices"); 
const Milestone = require("../models/Milestone");
// router.post("/create", authMiddleware, permissionMiddleware(["create_project"]), (req, res) => {
//     res.json({ message: "Project created successfully" });
// });

router.post("/create", authMiddleware, permissionMiddleware('create_project'), async (req, res) => {
    const { projectName, projectType, projectDescription, startDate, endDate, status, assignedTo, team, expectedDuration, clientName, milestones, totalBudget } = req.body;

    console.log("🚀 Entered create project route");

    try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);

        const latestProject = await Project.findOne({
            projectId: new RegExp(`^PJ${year}${month}${day}-`)
        }).sort({ projectId: -1 });

        let sequenceNumber = '0001';
        if (latestProject) {
            const lastSequence = parseInt(latestProject.projectId.split('-')[1]);
            sequenceNumber = String(lastSequence + 1).padStart(4, '0');
        }

        const projectId = `PJ${year}${month}${day}-${sequenceNumber}`;
        console.log("📁 Generated Project ID:", projectId);

        const template = await ProjectTemplate.findOne({ projectName: projectType });

        const newProject = new Project({
            projectId,
            projectName,
            projectType,
            startDate,
            endDate,
            projectDescription,
            owner: req.user.id,
            status: "In Progress",
            team,
            expectedDuration,
            clientName,
            totalBudget
        });

        if (template) {
            const parsedStartDate = new Date(startDate);

            for (const taskTemplate of template.tasks) {
                const datePart = `${year}${month}${day}`;
                const prefix = `TK${datePart}`;

                const latestTask = await Task.findOne({
                    taskId: new RegExp(`^${prefix}-\\d{4}$`)
                }).sort({ taskId: -1 });

                let taskSeqNum = '0001';
                if (latestTask) {
                    const lastTaskSeq = parseInt(latestTask.taskId.split('-')[1]);
                    taskSeqNum = String(lastTaskSeq + 1).padStart(4, '0');
                }

                const taskId = `${prefix}-${taskSeqNum}`;

                const newTask = new Task({
                    taskName: taskTemplate.taskName,
                    taskId,
                    assigner: req.user.id,
                    teamStatus: "Not Started",
                    progress: 0,
                    dueDate: new Date(parsedStartDate.getTime() + taskTemplate.expectedDuration * 24 * 60 * 60 * 1000),
                    subtasks: []
                });

                await newTask.save();

                if (taskTemplate.subtasks?.length > 0) {
                    for (const subtaskTemplate of taskTemplate.subtasks) {
                        const newSubtask = new Subtask({
                            name: subtaskTemplate.name,
                            task: newTask._id,
                            status: "Not Started",
                            createdBy: req.user.id
                        });

                        await newSubtask.save();
                        newTask.subtasks.push(newSubtask._id);
                    }
                    await newTask.save();
                }

                newProject.tasks.push(newTask._id);
            }
        }

        if (milestones && milestones.length > 0) {
            for (let i = 0; i < milestones.length; i++) {
                const milestoneData = milestones[i];
                const milestoneId = `Milestone${i + 1}`;

                const milestone = new Milestone({
                    milestoneId,
                    milestoneName: milestoneData.milestoneName,
                    budget: milestoneData.budget,
                    dueDate: milestoneData.dueDate,
                    projectId: newProject._id,
                    tasks: milestoneData.tasks || [],
                    status: "Pending"
                });

                await milestone.save();
                newProject.milestones.push(milestone._id);
            }
        }

        await newProject.save();

        try {
            await logActivity(
                req.user.id,
                "Created Project",
                newProject._id,
                "project",
                `Project ID: ${projectName}`,
                req.user.parentId
            );
        } catch (logErr) {
            console.warn("⚠️ logActivity failed:", logErr.message);
        }

        res.status(201).json({
            message: "Project created successfully",
            project: newProject,
            usedTemplate: !!template
        });

        // ✅ Email sending for project creation notification
        const emailBody = `
Hi ${req.user.name || "User"},

A new project "${projectName}" (ID: ${projectId}) has been created successfully.

Project Details:
- Type          : ${projectType}
- Client Name   : ${clientName}
- Start Date    : ${startDate}
- End Date      : ${endDate}
- Total Budget  : ${totalBudget || "N/A"}

Regards,
SGC Team
`.trim();

        const emailSubject = '📬 [Notification] New Project Created';

        try {
            if (req.user.email) {
                await sendTaskEmail(req.user.email, emailSubject, emailBody);
                console.log('✅ Project creation notification email sent.');
            } else {
                console.warn('⚠️ User email not available. Notification email not sent.');
            }
        } catch (emailError) {
            console.error('📨 Failed to send project creation notification email:', emailError.message);
        }

    } catch (error) {
        console.error("❌ Project creation failed:", error.message);
        res.status(500).json({ message: "Error creating project", error: error.message });
    }
});





// Get projects based on user's role and team
router.get("/view", authMiddleware, async (req, res) => {
    try {
        let projects;
        const user = await User.findById(req.user.id);

        if (req.user.role === "admin") {
            // Admin can see all projects
            projects = await Project.find()
                .populate('owner', 'name email')
                .populate('assignedTo', 'name email')
                .populate('teamMembers', 'name email');
        } else if (req.user.role === "manager") {
            // Manager can see projects they own or projects in their team
            projects = await Project.find({
                $or: [
                    { owner: req.user.id },
                    { team: user.team }
                ]
            })
            .populate('owner', 'name email')
            .populate('assignedTo', 'name email')
            .populate('teamMembers', 'name email');
        } else if (req.user.role === "opic") {
            // OPIC users can see projects in their team or projects assigned to them
            projects = await Project.find({
                $or: [
                    { team: user.team},
                    { assignedTo: req.user.id }
                ]
            })
            .populate('owner', 'name email')
            .populate('assignedTo', 'name email')
            .populate('teamMembers', 'name email');
        } else {
            return res.status(403).json({ message: "Access Denied" });
        }

        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: "Error fetching projects", error });
    }
});


// Route to update a project
// permissionMiddleware(["edit_project"])
router.put("/update/:projectId", authMiddleware, permissionMiddleware('edit_project'), async (req, res) => {
    try {
        const { projectId } = req.params;
        const { projectName, projectDescription, startDate, endDate, team, expectedDuration, projectType, status } = req.body;
        
        // Find the project
        const project = await Project.findById(projectId);
        
        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found"
            });
        }

        // Check if project is completed
        if (project.status === "Completed") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify a completed project"
            });
        }
        
        // Check if the team has changed
        const teamChanged = team && project.team && team.toString() !== project.team.toString();
        
        // Store old values for audit log
        const oldValues = {
            projectName: project.projectName,
            projectDescription: project.projectDescription,
            startDate: project.startDate,
            endDate: project.endDate,
            team: project.team,
            expectedDuration: project.expectedDuration,
            projectType: project.projectType,
            status: project.status
        };
        
        // Update the project
        project.projectName = projectName || project.projectName;
        project.projectDescription = projectDescription || project.projectDescription;
        project.startDate = startDate || project.startDate;
        project.endDate = endDate || project.endDate;
        project.team = team || project.team;
        project.expectedDuration = expectedDuration || project.expectedDuration;
        project.projectType = projectType || project.projectType;
        
        // Handle status change
        if (status && status !== project.status) {
            if (status === "Completed") {
                // Check if all tasks are completed
                const tasks = await Task.find({ _id: { $in: project.tasks } });
                const allTasksCompleted = tasks.every(task => task.teamStatus === "Completed");
                
                if (!allTasksCompleted) {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot mark project as completed until all tasks are completed"
                    });
                }
                
                project.status = status;
                project.completionDate = new Date();
            } else {
                project.status = status;
            }
        }
        
        await project.save();

        console.log('updated projects', project);
        
        // Create audit log entry for project update
        const changes = [];
        if (projectName && projectName !== oldValues.projectName) {
            changes.push(`Project name changed from "${oldValues.projectName}" to "${projectName}"`);
        }
        if (projectDescription && projectDescription !== oldValues.projectDescription) {
            changes.push(`Description updated`);
        }
        if (expectedDuration && expectedDuration !== oldValues.expectedDuration) {
            changes.push(`Expected Duration updated`);
        }
        if (status && status !== oldValues.status) {
            changes.push(`Status changed to ${status}`);
        }
        else{
            changes.push(`Project updated`);
        } 
        if (team && team.toString() !== oldValues.team?.toString()) {
            changes.push(`Team assignment changed`);
        }

        // Log the activity with all changes
        if (changes.length > 0) {
            await logActivity(
                req.user.id,
                "Updated Project",
                project._id,
                "project",
                `Changes made Project ID: ${changes.join(", ")}`,
                req.user.parentId
            );
        }
        
        // Send notifications if the team has changed
        if (teamChanged && team) {
            await sendNotificationsToTeam(
                team,
                'Project Assigned to Your Team',
                `The project "${projectName || project.projectName}" has been assigned to your team.`,
                'project',
                project._id
            );
        }

        // Send notification if project is completed
        if (status === "Completed" && status !== oldValues.status) {
            await sendNotificationsToTeam(
                project.team,
                'Project Completed',
                `The project "${project.projectName}" has been completed.`,
                'project',
                project._id
            );
        }
        
        res.status(200).json({
            success: true,
            message: "Project updated successfully",
            project
        });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Error updating project",
            error: error.message
        });
    }
});

// Route to delete a project
// permissionMiddleware(["delete_project"])

// router.delete("/delete/:projectId", authMiddleware, async (req, res) => {
//     const { projectId } = req.params;

//     try {
//         const deletedProject = await Project.findByIdAndDelete(projectId);

//         if (!deletedProject) {
//             return res.status(404).json({ message: "Project not found" });
//         }

//         res.status(200).json({ message: "Project deleted successfully" });
//     } catch (error) {
//         console.error("Error deleting project:", error);
//         res.status(500).json({ message: "Error deleting project", error });
//     }
// });

router.delete("/delete/:id", authMiddleware, permissionMiddleware('delete_project'), async (req, res) => {
    try {

        const { id } = req.params;
        
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Step 2: Delete all comments related to the project's tasks
        const tasks = await Task.find({ _id: { $in: project.tasks } });
        console.log("Tasks related to the project:", tasks);

        if (tasks.length > 0) {
            tasks.forEach(async (task) => {
                const subtasks = task.subtasks;  // Extract subtask IDs directly from task.subtasks
                console.log(`Subtasks for task ${task._id}:`, subtasks);

                // Step 5: Delete subtasks by their IDs
                await Subtask.deleteMany({ _id: { $in: subtasks } });
                console.log(`Subtasks with IDs ${subtasks} deleted successfully`);
            });
        }

        
        await Task.deleteMany({ _id: { $in: project.tasks } });

        await Project.findByIdAndDelete(id);

        await logActivity(req.user.id, "Deleted Project", id, "project", `Project ID: ${project.projectName}`, req.user.parentId);

        res.status(200).json({ message: "Project and all related tasks, subtasks, and comments deleted successfully" });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({ message: "Error deleting project and its related tasks, subtasks, and comments", error });
    }
});

// Get project statistics
router.get("/stats", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let query = {};

        // Set query based on user role
        if (req.user.role === "admin") {
            // Admin can see all projects
            query = {};
        } else if (req.user.role === "manager") {
            // Manager can see projects they own or projects in their team
            query = {
                $or: [
                    { owner: req.user.id },
                    { team: user.team }
                ]
            };
        } else if (req.user.role === "opic") {
            // OPIC users can see projects in their team or projects assigned to them
            query = {
                $or: [
                    { team: user.team },
                    { assignedTo: req.user.id }
                ]
            };
        }

        // Get current date and set time to start of day
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate start of current week (Monday)
        const startOfWeek = new Date(today);
        const currentDay = today.getDay(); // 0 is Sunday, 6 is Saturday
        // Adjust for Monday start (if Sunday, go back 6 days; otherwise go back currentDay-1 days)
        const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
        startOfWeek.setDate(today.getDate() - daysToSubtract);
        startOfWeek.setHours(0, 0, 0, 0);

        // Calculate end of current week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        // Get all projects based on query
        const projects = await Project.find(query);

        // Calculate statistics
        const stats = {
            totalProjects: projects.length,
            completedProjects: projects.filter(project => project.status === "Completed").length,
            dueToday: projects.filter(project => {
                const projectEndDate = new Date(project.endDate);
                projectEndDate.setHours(0, 0, 0, 0);
                return projectEndDate.getTime() === today.getTime() && project.status !== "Completed";
            }).length,
            dueThisWeek: projects.filter(project => {
                const projectEndDate = new Date(project.endDate);
                projectEndDate.setHours(0, 0, 0, 0);
                // Project is due this week if end date is today or in the future within the current week
                return projectEndDate >= today && // Must be today or future
                       projectEndDate <= endOfWeek &&
                       project.status !== "Completed";
            }).length,
            overdue: projects.filter(project => {
                const projectEndDate = new Date(project.endDate);
                projectEndDate.setHours(0, 0, 0, 0);
                return projectEndDate < today && project.status !== "Completed";
            }).length,
            statusBreakdown: {
                pending: projects.filter(project => project.status === "Pending").length,
                inProgress: projects.filter(project => project.status === "In Progress").length,
                completed: projects.filter(project => project.status === "Completed").length
            }
        };

        res.status(200).json({
            message: "Project statistics fetched successfully",
            stats
        });
    } catch (error) {
        console.error("Error fetching project statistics:", error);
        res.status(500).json({ message: "Error fetching project statistics", error: error.message });
    }
});

// Get overall performance data for all projects
router.get("/overall-performance", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        let query = {};

        // Set query based on user role
        if (req.user.role === "admin") {
            query = {};
        } else if (req.user.role === "manager") {
            query = {
                $or: [
                    { owner: req.user.id },
                    { team: user.team }
                ]
            };
        } else if (req.user.role === "opic") {
            query = {
                $or: [
                    { team: user.team },
                    { assignedTo: req.user.id }
                ]
            };
        }

        // Get all projects with their tasks and subtasks
        const projects = await Project.find(query)
            .populate({
                path: 'tasks',
                populate: {
                    path: 'subtasks',
                    select: 'status updatedAt name'  // Include updatedAt for completion date
                }
            });

        // Get the date range (last 30 days)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        // Initialize the performance data array
        const performanceData = [];

        // Loop through each day in the range
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
            const currentDate = new Date(date);
            currentDate.setHours(23, 59, 59, 999); // End of the day
            
            let targetTasks = 0;
            let achievedTasks = 0;
            let totalSubtasks = 0;
            let completedSubtasks = 0;

            // Calculate targets and achievements for each project
            projects.forEach(project => {
                const projectStartDate = new Date(project.startDate);
                const projectEndDate = new Date(project.endDate);
                
                // Skip if the project hasn't started yet
                if (currentDate < projectStartDate) {
                    return;
                }

                // Calculate target subtasks for this date
                project.tasks.forEach(task => {
                    if (!task.subtasks || !task.subtasks.length) return;

                    const taskSubtasks = task.subtasks.length;
                    totalSubtasks += taskSubtasks;

                    // Calculate how many subtasks should be completed by this date
                    const taskStartDate = projectStartDate; // You might want to add a startDate field to tasks
                    const taskEndDate = new Date(task.dueDate) || projectEndDate;
                    const totalTaskDays = (taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24);
                    const daysElapsed = (currentDate - taskStartDate) / (1000 * 60 * 60 * 24);
                    
                    // Calculate target subtasks for this task by this date
                    if (totalTaskDays > 0) {
                        const expectedSubtasksCompleted = Math.round((daysElapsed / totalTaskDays) * taskSubtasks);
                        targetTasks += expectedSubtasksCompleted;
                    }

                    // Count actually completed subtasks by this date
                    const completedByDate = task.subtasks.filter(subtask => 
                        subtask.status === "Completed" && 
                        new Date(subtask.updatedAt) <= currentDate
                    ).length;

                    completedSubtasks += completedByDate;
                    achievedTasks += completedByDate;
                });
            });

            // Format the date as "DD MMM"
            const formattedDate = currentDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short'
            });

            // Add the data point
            performanceData.push({
                date: formattedDate,
                target: parseFloat((targetTasks).toFixed(1)),
                achieved: parseFloat((achievedTasks).toFixed(1)),
                highlight: currentDate.toDateString() === new Date().toDateString(), // Highlight today's date
                totalSubtasks,
                completedSubtasks
            });
        }

        res.status(200).json({
            message: "Overall project performance data fetched successfully",
            performanceData
        });
    } catch (error) {
        console.error("Error fetching overall project performance:", error);
        res.status(500).json({ message: "Error fetching overall project performance", error: error.message });
    }
});
    
// Copy a project with all its tasks and subtasks
router.post("/copy/:projectId", authMiddleware, permissionMiddleware('create_project'), async (req, res) => {
    try {

        
        const originalProject = await Project.findById(req.params.projectId).populate({
            path: 'tasks',
            populate: { path: 'subtasks' }
        });
        if (!originalProject) return res.status(404).json({ message: "Project not found" });


        // Generate new projectId
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const latestProject = await Project.findOne({
            projectId: new RegExp(`^PJ${year}${month}${day}-`)
        }).sort({ projectId: -1 });
        let sequenceNumber = '0001';
        if (latestProject) {
            const lastSequence = parseInt(latestProject.projectId.split('-')[1]);
            sequenceNumber = String(lastSequence + 1).padStart(4, '0');
        }
        const projectId = `PJ${year}${month}${day}-${sequenceNumber}`;

        // Create the new project
        const newProject = new Project({
            projectId,
            projectName: originalProject.projectName + ' (Copy)',
            projectType: originalProject.projectType,
            projectDescription: originalProject.projectDescription,
            owner: originalProject.owner,
            startDate: originalProject.startDate,
            endDate: originalProject.endDate,
            status: 'In Progress',
            team: originalProject.team,
            expectedDuration: originalProject.expectedDuration,
            assignedTo: (originalProject.assignedTo || []).map(user => user._id ? user._id : user),
            teamMembers: (originalProject.teamMembers || []).map(user => user._id ? user._id : user),
            tasks: []
        });

        // Copy all tasks and their subtasks
        for (const originalTask of originalProject.tasks) {
            // Generate new taskId
            const yy = String(today.getFullYear()).slice(-2);
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const datePart = `${yy}${mm}${dd}`;
            const prefix = `TK${datePart}`;
            const latestTask = await Task.findOne({
                taskId: new RegExp(`^${prefix}-\\d{4}$`)
            }).sort({ taskId: -1 });
            let taskSequenceNumber = '0001';
            if (latestTask) {
                const lastSequence = parseInt(latestTask.taskId.split('-')[1]);
                taskSequenceNumber = String(lastSequence + 1).padStart(4, '0');
            }
            const taskId = `${prefix}-${taskSequenceNumber}`;

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
                taskName: originalTask.taskName,
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
            newProject.tasks.push(newTask._id);
        }

        await newProject.save();

        res.status(201).json({ message: "Project copied successfully", project: newProject });
    } catch (error) {
        console.log('error in coping project', error);
        res.status(500).json({ message: "Error copying project", error: error.message });
    }
});

// Get milestones for a project
router.get("/milestones/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate({
        path: "milestones",
        populate: {
          path: "tasks",
          model: "Task",
        },
      })
      .populate("clientName", "clientName") // optional — if you have client reference
      .lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Build milestone list
    const milestoneList = project.milestones.map((m, index) => {
      let updatedStatus = m.status;
      if (m.tasks.length > 0) {
        const allTasksCompleted = m.tasks.every(
          (task) => task.teamStatus === "Completed"
        );
        updatedStatus = allTasksCompleted ? "Completed" : "In Progress";
      }

      return {
        label: `Milestone ${index + 1}`,
        milestoneId: m.milestoneId,
        name: m.milestoneName,
        budget: m.budget,
        dueDate: m.dueDate,
        status: updatedStatus,
        id: m._id,
        tasks: m.tasks,
      };
    });

    // ✅ Add "NA" option
    milestoneList.unshift({
      label: "NA",
      milestoneId: "NA",
      name: "",
      budget: 0,
      dueDate: null,
      status: "NA",
      id: "NA",
      tasks: [],
    });

    // ✅ Totals (excluding NA)
    const validMilestones = milestoneList.filter((m) => m.id !== "NA");
    const total = validMilestones.length;
    const completed = validMilestones.filter(
      (m) => m.status === "Completed"
    ).length;
    const totalBudget = validMilestones.reduce(
      (sum, m) => sum + (m.budget || 0),
      0
    );
    const remainingBudget = validMilestones
      .filter((m) => m.status === "Completed")
      .reduce((sum, m) => sum + (m.budget || 0), 0);

    // ✅ Send project + milestone data
    res.json({
      project: {
        id: project._id,
        projectName: project.projectName,
        clientName: project.clientName?.clientName || "N/A",
        projectManager: project.projectManager,
        startDate: project.startDate,
        endDate: project.endDate,
        totalBudget: project.totalBudget || totalBudget,
        status: project.status,
      },
      total,
      completed,
      totalBudget,
      remainingBudget,
      milestones: milestoneList,
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({ message: "Error fetching milestones", error });
  }
});






//create milestone from project id

router.post("/createMilestone/:projectId", async (req, res) => {
  try {
    const { milestoneName, budget, dueDate } = req.body;

    // Check project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Generate milestone ID (M1, M2, ...)
    const milestoneCount = await Milestone.countDocuments({ projectId: project._id });
    const milestoneId = `M${milestoneCount + 1}`;

    const newMilestone = new Milestone({
      milestoneId,
      milestoneName,
      budget,
      dueDate,
      projectId: project._id,
      status: "Pending",
    });

    await newMilestone.save();

    // Link milestone to project
    project.milestones.push(newMilestone._id);
    await project.save();

    res.status(201).json({
      message: "Milestone created successfully",
      milestone: newMilestone,
    });
  } catch (error) {
    console.error("Error creating milestone:", error);
    res.status(500).json({ message: "Error creating milestone", error: error.message });
  }
});

//update milestone from milestone id
router.put("/updateMilestone/:milestoneId", async (req, res) => {
  try {
    const { milestoneName, budget, dueDate, status } = req.body;

    const updatedMilestone = await Milestone.findByIdAndUpdate(
      req.params.milestoneId,
      {
        ...(milestoneName && { milestoneName }),
        ...(budget && { budget }),
        ...(dueDate && { dueDate }),
        ...(status && { status }),
      },
      { new: true }
    );

    if (!updatedMilestone) {
      return res.status(404).json({ message: "Milestone not found" });
    }

    res.status(200).json({
      message: "Milestone updated successfully",
      milestone: updatedMilestone,
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    res.status(500).json({ message: "Error updating milestone", error: error.message });
  }
});






module.exports = router;
