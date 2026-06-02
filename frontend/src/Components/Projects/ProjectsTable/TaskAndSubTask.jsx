import React, { useEffect, useState } from "react";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import "./TaskAndSubTask.css";
import TaskDetails from "../../TaskManagement/TaskDetails";
import { useNavigate, useParams } from "react-router-dom";
import CreateTask from "./CreateTask";
import CreateSubtask from "./CreateSubtask";
import axios from "axios";
import {
  formatCompletionDate,
  formatDate,
  notify,
} from "../../../utils/helper";
import TaskActionPopUp from "./TaskActionPopUp";
import UpdateTask from "./UpdateTask";
import MilestoneView from "./MilestoneView";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { MdDeleteForever, MdEdit } from "react-icons/md";
import { useAuth } from "../../../context/AuthContext";
import { Table, LayoutGrid } from "lucide-react";
import TaskGraphView from "./TaskGraphView";
import { MdModeEdit } from "react-icons/md";
import UpdateSubtask from "./UpdateSubtask";

const TaskAndSubTask = ({ onBack }) => {
  const { user } = useAuth();
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [taskData, setTaskData] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [isTaskDetailPopupOpen, setIsTaskDetailPopupOpen] = useState(false);
  const [isCreateTaskVisible, setIsCreateTaskVisible] = useState(false);
  const [taskEditData, setTaskEditData] = useState();
  const [isUpdateTaskVisible, setIsUpdateTaskVisible] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [isCreateSubTaskVisible, setIsCreateSubTaskVisible] = useState(false);
  const [isEditSubTaskVisible, setIsEditSubTaskVisible] = useState(false);
  const [editSubtaskData, setEditSubTaskData] = useState();
  const [subTaskId, setSubTaskId] = useState(null);
  const [assigneeList, setAssigneeList] = useState([]);
  const [commentsData, setCommentsData] = useState([]);
  const [activeView, setActiveView] = useState("table");
  const [projectData, setProjectData] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [mileStones, setMileStones] = useState([]);
  const [linktaskupdate, setLinkTaskUpdate] = useState(false);
  const [isMilestonePopupOpen, setIsMilestonePopupOpen] = useState(false);
  const [milestoneFormData, setMilestoneFormData] = useState({
    name: "",
    budget: "",
    dueDate: "",
  });

  const handleOpenMilestonePopup = () => {
    setMilestoneFormData({ name: "", budget: "", dueDate: "" });
    setIsMilestonePopupOpen(true);
  };

  const [dependenciesPopup, setDependenciesPopup] = useState({
    isOpen: false,
    taskIndex: null,
    task: null,
  });

  const { id } = useParams();

  const handleAddMilestone = async () => {
    if (
      !milestoneFormData.name ||
      !milestoneFormData.budget ||
      !milestoneFormData.dueDate
    ) {
      notify("error", "All fields are required.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/api/project/createMilestone/${id}`,
        {
          milestoneName: milestoneFormData.name,
          budget: Number(milestoneFormData.budget),
          dueDate: milestoneFormData.dueDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      notify("success", "Milestone created successfully");
      setIsMilestonePopupOpen(false);

      // ✅ Refresh milestone list instantly
      const milestoneRes = await axios.get(
        `/api/project/milestones/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMileStones(milestoneRes.data);
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Failed to create milestone"
      );
    }
  };

  useEffect(() => {
    const fetchMilestoneList = async () => {
      try {
        const response = await axios.get(
          `/api/project/milestones/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setMileStones(response.data);
        console.log("Milestone List:", response.data);
      } catch (error) {
        console.error("Error fetching milestone list:", error);
      }
    };

    fetchMilestoneList();
  }, [linktaskupdate]);

  //link milestone with task

  const linkMilestoneToTask = async (taskId, milestoneId) => {
    console.log("Linking Milestone:", taskId, milestoneId);

    try {
      const token = localStorage.getItem("token");

      const response = await axios.put(
        `/api/task/link-milestone/${taskId}`,
        { milestoneId }, // ✅ Request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      notify("success", "Milestone linked successfully");
      fetchTasksAndSubtasks();
      setLinkTaskUpdate(true);
      console.log("Milestone linked successfully:", response.data);
    } catch (error) {
      console.error("Error linking milestone:", error);
      notify(
        "error",
        error.response?.data?.message || "Failed to link milestone"
      );
    }
  };

  console.log("taskdata with milestone", taskData);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [description, setDescription] = useState("");
  const team = projectData?.team;
  console.log("selectedid :", selectedTaskId);
  console.log("team", team);
  useEffect(() => {
    const fetchAssigneeList = async () => {
      if (!team) return; // ⬅️ Prevent API call until team is available

      try {
        const response = await axios.get(
          `/api/auth/users/by-team/${team}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setAssigneeList(response.data.users);
      } catch (error) {
        console.error("Error fetching assignee list:", error);
      }
    };

    fetchAssigneeList();
  }, [team]);

  //handle add dependency
  const handleAddDependency = async () => {
    if (!selectedMemberId || !description) {
      notify("error", "Please select a member and enter a description.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `/api/task/${selectedTaskId}/dependencies`,
        {
          personId: selectedMemberId,
          description: description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      notify("success", "Dependency added successfully");

      // Refresh tasks list after adding dependency
      fetchTasksAndSubtasks();

      // Clear input fields
      setSelectedMemberId("");
      setDescription("");
      setDependenciesPopup({ isOpen: false, taskIndex: null, task: null });

      console.log("Dependency Response:", response.data);
    } catch (error) {
      console.error("Error adding dependency:", error);
      notify(
        "error",
        error.response?.data?.message || "Failed to add dependency"
      );
    }
  };

  const navigate = useNavigate();

  const toggleTaskExpand = (index) => {
    if (expandedTasks.includes(index)) {
      setExpandedTasks(
        expandedTasks.filter((taskIndex) => taskIndex !== index)
      );
    } else {
      setExpandedTasks([...expandedTasks, index]);
    }
  };

  const handleOpenPopup = (comments) => {
    setIsTaskDetailPopupOpen(!isTaskDetailPopupOpen);
    setCommentsData(comments);
  };

  const fetchTasksAndSubtasks = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      //console.log("No token found, please login again");
      return;
    }
    console.log("id", id);
    try {
      const response = await axios.get(
        `/api/task/view/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //console.log("tasks", response.data?.project);
      setProjectData(response.data?.project);
      setProjectName(response.data?.project?.projectName);
      setTaskData(response.data?.project?.tasks);
      console.log("taskData", response.data?.project?.tasks);
    } catch (error) {
      console.log(
        error.response?.data?.message || "Error fetching tasks and subtasks"
      );
    }
  };

  console.log("taskdataID", taskData);

  useEffect(() => {
    fetchTasksAndSubtasks();
  }, [id]);

  //fetch team members

  const handleOpenTaskPopup = () => {
    setIsCreateTaskVisible(!isCreateTaskVisible);
  };

  const handleOpenSubTaskPopup = (id) => {
    //console.log("id:", id);
    setSubTaskId(id);
    setIsCreateSubTaskVisible(!isCreateSubTaskVisible);
  };

  const handleBack = () => {
    navigate("/project");
  };

  const handleEditTask = (task) => {
    setTaskEditData(task);
    setIsUpdateTaskVisible(true);
  };

  const handleDeleteSubTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subtask?")) {
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, please login again");
      return;
    }

    try {
      const response = await axios.delete(
        `/api/task/delete/subtask/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", "subtask deleted successfully");
      fetchTasksAndSubtasks();
    } catch (error) {
      notify("error", error.response.data.message);
      console.log(
        error.response?.data?.message || "Error fetching tasks and subtasks"
      );
    }
  };

  const handleEditSubTask = async (subtask) => {
    //console.log("edit subtask", subtask);
    setEditSubTaskData(subtask);
    setIsEditSubTaskVisible(true);
  };

  const handleUpdateSubTask = async (subtask) => {
    if (subtask.status === "In Progress") {
      subtask.status = "Completed";
    } else if (subtask.status === "Pending") {
      subtask.status = "Completed";
    } else {
      subtask.status = "In Progress";
    }
    //console.log("subtask update", subtask);

    const token = localStorage.getItem("token");

    if (!token) {
      console.log("No token found, please login again");
      return;
    }

    try {
      const response = await axios.put(
        `/api/task/update/subtask/${subtask._id}`,
        subtask,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", "subtask updated successfully");
      fetchTasksAndSubtasks();
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error updating subtasks"
      );
      //console.log(error.response?.data?.message || "Error updating subtasks");
    }
  };

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
  };

  const sortTasks = (tasks) => {
    if (!sortBy) return tasks;

    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "dueDate":
          comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case "completionDate":
          comparison =
            new Date(a.completionDate || 0) - new Date(b.completionDate || 0);
          break;
        case "progress":
          comparison = a.progress - b.progress;
          break;
        default:
          return 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  return (
    <div className="taskandsubtask-container">
      <div className="task-flow-container"></div>

      <div className="task-wrapper">
        <div className="task-header">
          <h1>
            {" "}
            <span onClick={handleBack} className="task-header-back">
              Projects
            </span>{" "}
            / {projectName}{" "}
          </h1>
          {activeView === "milestone" ? (
            <button
              className="new-milstone-button"
              onClick={() => handleOpenMilestonePopup()}
            >
              + Add Milestone
            </button>
          ) : (
            <button
              className="new-project-button"
              onClick={() => handleOpenTaskPopup()}
            >
              New Task +
            </button>
          )}
        </div>

        <div className="view-toggles">
          <div className="toggles-wrapper">
            <button
              className={`view-toggle ${
                activeView === "table" ? "active" : ""
              }`}
              onClick={() => setActiveView("table")}
            >
              <Table size={20} />
              Table
            </button>
            <button
              className={`view-toggle ${
                activeView === "timeline" ? "active" : ""
              }`}
              onClick={() => setActiveView("timeline")}
            >
              <LayoutGrid size={20} />
              Timeline
            </button>
            <button
              className={`view-toggle ${
                activeView === "milestone" ? "active" : ""
              }`}
              onClick={() => setActiveView("milestone")}
            >
              <LayoutGrid size={20} />
              Milestone
            </button>
          </div>
          {(activeView === "table" || activeView === "timeline") && (
            <div className="tab-actions">
              <div className="filter-dropdown">
                <button
                  className={`filter-button ${isFilterOpen ? "active" : ""}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <span className="filter-icon">⚙</span>
                  Filter
                  <span className="dropdown-arrow">
                    <FaAngleDown />
                  </span>
                </button>
                {isFilterOpen && (
                  <div className="dropdown-menu">
                    <div
                      className={`dropdown-item ${
                        sortBy === "dueDate" ? "active" : ""
                      }`}
                      onClick={() => handleSort("dueDate")}
                    >
                      Due Date{" "}
                      {sortBy === "dueDate" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                    <div
                      className={`dropdown-item ${
                        sortBy === "completionDate" ? "active" : ""
                      }`}
                      onClick={() => handleSort("completionDate")}
                    >
                      Completion Date{" "}
                      {sortBy === "completionDate" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                    <div
                      className={`dropdown-item ${
                        sortBy === "progress" ? "active" : ""
                      }`}
                      onClick={() => handleSort("progress")}
                    >
                      Progress{" "}
                      {sortBy === "progress" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {activeView === "table" && (
          <>
            <div className="task-table-wrapper">
              <div className="task-table">
                <div className="table-header">
                  <div className="header-cell expand-cell"></div>
                  {/* <div className="header-cell header-cell-2 ">Task ID</div> */}
                  <div className="header-cell">Task Name</div>
                  <div className="header-cell">Milestone</div>
                  <div className="header-cell">Assignee</div>

                  <div className="header-cell">Status</div>
                  <div className="header-cell">Progress</div>
                  <div className="header-cell">Dependencies</div>
                  <div className="header-cell">Due Date</div>

                  <div className="header-cell header-cell-2">
                    Completion Date
                  </div>
                  <div className="header-cell">Details</div>
                  {/* <div className="header-cell">Action</div> */}
                </div>

                {sortTasks(taskData).map((task, index) => (
                  <React.Fragment key={index}>
                    <div className="table-row">
                      <div
                        className="cell expand-cell"
                        onClick={() => toggleTaskExpand(index)}
                      >
                        <span
                          className={`expand-icon ${
                            expandedTasks.includes(index) ? "expanded" : ""
                          }`}
                        >
                          {expandedTasks.includes(index) ? (
                            <FaAngleDown className="icon" />
                          ) : (
                            <FaAngleRight className="icon" />
                          )}
                        </span>
                      </div>
                      {/* <div className="cell cell-1 header-cell-2">
                        {task?.taskId}
                      </div> */}
                      <div className="cell cell-1">{task?.taskName}</div>

                      <div className="cell cell-1">
                        <select
                          value={
                            typeof task.milestone === "object"
                              ? task.milestone?.id // ✅ Use "id" from response
                              : task.milestone || ""
                          }
                          onChange={(e) => {
                            const selectedMilestoneId = e.target.value;

                            console.log(
                              "Selected Milestone ID:",
                              selectedMilestoneId
                            );
                            // ✅ Will now log something like: 688f47fd29cd02d4ed0eb5df

                            linkMilestoneToTask(task._id, selectedMilestoneId);
                          }}
                          className="milestone-select"
                        >
                          <option value="" disabled>
                            Select Milestone
                          </option>

                          {mileStones?.milestones?.map((milestone) => (
                            <option key={milestone.id} value={milestone.id}>
                              {milestone.label} - {milestone.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="cell cell-1 cell-assignee">
                        {task?.assignee ? (
                          <div className="assignee">
                            <div className="avatar">
                              {task?.assignee?.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>{" "}
                            {task?.assignee?.name}
                          </div>
                        ) : (
                          ""
                        )}
                      </div>

                      <div className="cell cell-1">
                        <span
                          className={`status-badge ${task?.teamStatus
                            .replace(/\s+/g, "-")
                            .toLowerCase()}`}
                        >
                          {task?.teamStatus}
                        </span>
                      </div>
                      <div className="cell cell-1">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${task?.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{task?.progress}%</span>
                      </div>
                      <div className="dependencies-cell">
                        <div className="dependencies-actions">
                          <button
                            className="dependenciesclick-button"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: "fit-content",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setSelectedTaskId(task?._id);
                              setDependenciesPopup({
                                isOpen: true,
                                taskIndex: index,
                                task: task,
                              });
                            }}
                          >
                            + Dependencies ({task?.dependencies?.length || 0})
                            <IoMdInformationCircleOutline
                              size={15}
                              style={{
                                color:
                                  task?.dependencies?.length > 0
                                    ? task?.dependencies?.every(
                                        (dep) => dep.status === "Completed"
                                      )
                                      ? "green" // ✅ All dependencies completed
                                      : "red" // ❌ At least one dependency pending
                                    : "#888", // No dependencies
                                marginLeft: "5px",
                                marginTop: "1px",
                              }}
                            />
                          </button>
                        </div>
                      </div>

                      <div className="cell cell-1">
                        {formatDate(task?.dueDate)}
                      </div>

                      <div className="cell cell-1">
                        {formatCompletionDate(task?.completionDate)}
                      </div>
                      {/* <div className="cell cell-1">
                      <button
                        className="action-button"
                        onClick={() => handleOpenPopup(task)}
                      >
                        view
                      </button>
                    </div> */}

                      <div className="cell cell-1 action-button">
                        <TaskActionPopUp
                          handleOpenPopup={handleOpenPopup}
                          handleEditTask={handleEditTask}
                          task={task}
                          fetchTasksAndSubtasks={fetchTasksAndSubtasks}
                        />
                      </div>
                    </div>

                    {expandedTasks.includes(index) &&
                      task?.subtasks.length >= 0 && (
                        <div className="subtasks-container">
                          <div className="subtasks-header">
                            <h3>Subtasks:</h3>
                          </div>

                          <div className="subtasks-table">
                            <div className="subtasks-header-row">
                              <div className="subtask-header-cell checkbox-cell">
                                ID
                              </div>
                              <div className="subtask-header-cell">Name</div>
                              <div className="subtask-header-cell">
                                Assignee
                              </div>
                              <div className="subtask-header-cell">Comment</div>
                              <div className="subtask-header-cell">Status</div>
                              <div className="subtask-header-cell">Action</div>
                            </div>

                            {task?.subtasks?.map((subtask, subtaskIndex) => (
                              <div className="subtask-row" key={subtaskIndex}>
                                <div className="subtask-cell">
                                  {" "}
                                  {subtaskIndex < 10
                                    ? `0${subtaskIndex}`
                                    : subtaskIndex}{" "}
                                </div>
                                {/* <div
                                className="subtask-cell checkbox-cell"
                                onClick={() => handleUpdateSubTask(subtask)}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    subtask.status === "Completed"
                                      ? true
                                      : false
                                  }
                                />
                              </div> */}
                                <div className="subtask-cell">
                                  {subtask?.name}
                                </div>
                                <div className="subtask-cell">
                                  {" "}
                                  {subtask?.assignee ? (
                                    <div className="assignee">
                                      <div className="avatar">
                                        {subtask?.assignee?.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </div>

                                      <span>{subtask?.assignee?.name}</span>
                                    </div>
                                  ) : (
                                    ""
                                  )}
                                </div>
                                <div className="subtask-cell">
                                  {subtask?.submission}
                                </div>
                                <div className="subtask-cell">
                                  <span
                                    className={`status-badge ${subtask?.status
                                      .replace(/\s+/g, "-")
                                      .toLowerCase()}`}
                                  >
                                    {subtask?.status}
                                  </span>
                                </div>
                                <div className="subtask-cell subtask-cell-icons ">
                                  <div
                                    className="edit-icon"
                                    onClick={() => handleEditSubTask(subtask)}
                                  >
                                    <MdModeEdit />
                                  </div>
                                  <div
                                    className="delete-icon"
                                    onClick={() =>
                                      handleDeleteSubTask(subtask._id)
                                    }
                                  >
                                    <MdDeleteForever />
                                    {/* <MdModeEdit /> */}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="add-subtask-row">
                              <button
                                className="add-subtask-button"
                                onClick={() =>
                                  handleOpenSubTaskPopup(task?._id)
                                }
                              >
                                + Add subtask
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="add-task-container">
              <button
                className="add-task-button"
                onClick={() => handleOpenTaskPopup()}
              >
                + Add Task
              </button>
            </div>
          </>
        )}

        {activeView === "timeline" && (
          <TaskGraphView projectData={projectData} />
          // <div className="timeline-container">
          // </div>
        )}
        {activeView === "milestone" && (
          <MilestoneView projectData={mileStones} taskData={taskData} />
          // <div className="timeline-container">
          // </div>
        )}
      </div>

      {dependenciesPopup.isOpen && (
        <div className="popup-overlay">
          <div className="dependencies-dialog">
            <div className="dialog-header">
              <h3>Manage Dependencies</h3>
              <button
                className="close-button"
                onClick={() =>
                  setDependenciesPopup({
                    isOpen: false,
                    taskIndex: null,
                    task: null,
                  })
                }
              >
                ×
              </button>
            </div>

            <p className="popup-subtitle">
              Collection of information & Documents
            </p>

            {/* Warning message */}
            {dependenciesPopup.task?.dependencies?.some(
              (dep) => dep.status === "Pending"
            ) && (
              <div className="warning-banner">
                <span>⚠ This task is blocked by incomplete dependencies</span>
              </div>
            )}

            {/* Current Dependencies */}
            <div className="current-dependencies">
              <h5>Current Dependencies</h5>
              <div
                className="dependency-list"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "8px",
                }}
              >
                {dependenciesPopup?.task?.dependencies &&
                dependenciesPopup.task.dependencies.length > 0 ? (
                  dependenciesPopup.task.dependencies.map((dep, idx) => {
                    // Find person name using personId
                    const personName =
                      assigneeList?.find(
                        (member) => member._id === dep.personId
                      )?.name || "Unknown Person";

                    return (
                      <div
                        key={idx}
                        className="dependency-item"
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          alignItems: "center",
                          backgroundColor: "#f5f5f5",
                          padding: "8px 12px",
                          borderRadius: "5px",

                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        {/* ✅ Description with Ellipsis and Tooltip */}
                        <span
                          className="stat"
                          style={{
                            fontWeight: "500",
                            color: "#333",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={dep?.description || "No description"} // shows full text on hover
                        >
                          {dep?.description || "No description"}
                        </span>

                        {/* ✅ Person name and status */}
                        <span
                          className="stat-person"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            fontWeight: "500",
                          }}
                        >
                          <span>{personName}</span>
                          <span
                            className="stat-status"
                            style={{
                              fontWeight: "bold",
                              color:
                                dep?.status === "Completed"
                                  ? "green"
                                  : "#ff9800",
                            }}
                          >
                            {dep?.status || "Pending"}
                          </span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="no-deps">No current dependencies</p>
                )}
              </div>
            </div>

            {/* Add Dependency */}
            <div className="add-dependency">
              <h5>Add Dependency</h5>
              <div className="form-row">
                <select
                  className="person-select"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  <option value="">Select Assignee</option>
                  {user.role !== "opic" ? (
                    assigneeList?.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))
                  ) : (
                    <option value={user.id}>{user.name}</option>
                  )}
                </select>
              </div>

              <textarea
                className="description-input"
                placeholder="Write short description about dependency..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>

              <div className="add-dependency-actions">
                <button
                  className="dependency-add-button"
                  onClick={handleAddDependency}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isMilestonePopupOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div className="milestone-add-container milestone-add-popup-container">
            <div className="milestone-add-header">
              <span className="milestone-add-badge">Add Milestone</span>
              <button
                type="button"
                onClick={() => setIsMilestonePopupOpen(false)}
                className="milestone-add-delete-btn"
              >
                ✕
              </button>
            </div>

            <div className="milestone-add-form-row">
              <div className="milestone-add-form-group">
                <label>Milestone Name</label>
                <input
                  type="text"
                  name="name"
                  className="milestone-add-form-input"
                  value={milestoneFormData.name}
                  onChange={(e) =>
                    setMilestoneFormData({
                      ...milestoneFormData,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="milestone-add-form-group">
                <label>Budget Allocation</label>
                <input
                  type="number"
                  name="budget"
                  className="milestone-add-form-input"
                  value={milestoneFormData.budget}
                  onChange={(e) =>
                    setMilestoneFormData({
                      ...milestoneFormData,
                      budget: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="milestone-add-form-group milestone-add-due-date">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="milestone-add-form-input"
                value={milestoneFormData.dueDate}
                onChange={(e) =>
                  setMilestoneFormData({
                    ...milestoneFormData,
                    dueDate: e.target.value,
                  })
                }
              />
            </div>

            <div className="milestone-add-button">
              <button
                type="button"
                onClick={handleAddMilestone}
                className="milestone-add-btn-link"
              >
                Create Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* popup from sidebar */}
      {isTaskDetailPopupOpen && (
        <TaskDetails
          comments={commentsData}
          isTaskDetailPopupOpen={isTaskDetailPopupOpen}
          setIsTaskDetailPopupOpen={setIsTaskDetailPopupOpen}
          fetchTasksAndSubtasks={fetchTasksAndSubtasks}
        />
      )}

      {/* open create task popup  */}
      {isCreateTaskVisible && (
        <CreateTask
          team={projectData?.team}
          fetchTasksAndSubtasks={fetchTasksAndSubtasks}
          setIsCreateTaskVisible={setIsCreateTaskVisible}
        />
      )}

      {isUpdateTaskVisible && (
        <UpdateTask
          team={projectData?.team}
          handleEditTask={handleEditTask}
          taskEditData={taskEditData}
          fetchTasksAndSubtasks={fetchTasksAndSubtasks}
          setIsUpdateTaskVisible={setIsUpdateTaskVisible}
        />
      )}

      {/* open create subtask  popup */}
      {isCreateSubTaskVisible && (
        <CreateSubtask
          team={projectData?.team}
          subTaskId={subTaskId}
          fetchTasksAndSubtasks={fetchTasksAndSubtasks}
          setIsCreateSubTaskVisible={setIsCreateSubTaskVisible}
        />
      )}

      {isEditSubTaskVisible && (
        <UpdateSubtask
          team={projectData?.team}
          setIsEditSubTaskVisible={setIsEditSubTaskVisible}
          editSubtaskData={editSubtaskData}
          fetchTasksAndSubtasks={fetchTasksAndSubtasks}
        />
      )}
    </div>
  );
};

export default TaskAndSubTask;
