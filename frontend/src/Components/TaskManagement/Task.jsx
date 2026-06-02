import React, { useState } from "react";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import "./Task.css";
import TaskDetails from "./TaskDetails";
import { formatCompletionDate, formatDate } from "../../utils/helper";
import { IoMdInformationCircleOutline } from "react-icons/io";
// import "../CreateProject/CreateProject.css";

const Task = ({ allTasks, taskStats, activeTab, setActiveTab }) => {
  const [expandedTasks, setExpandedTasks] = useState([]);
  const [isTaskDetailPopupOpen, setIsTaskDetailPopupOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [sortBy, setSortBy] = useState("dueDate"); // 'dueDate' or 'progress'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'notStarted', 'inProgress', 'completed'
  const [dependenciesPopup, setDependenciesPopup] = useState({
    isOpen: false,
    taskIndex: null,
    task: null,
  });

  const toggleTaskExpand = (index) => {
    if (expandedTasks.includes(index)) {
      setExpandedTasks(
        expandedTasks.filter((taskIndex) => taskIndex !== index)
      );
    } else {
      setExpandedTasks([...expandedTasks, index]);
    }
  };

  //console.log("all tasks", allTasks);

  const tabs = [
    { name: "All", count: taskStats?.taskCount, value: "all" },
    {
      name: "Due Today",
      count: taskStats?.taskStatus?.dueToday,
      value: "dueToday",
    },
    {
      name: "Due This Week",
      count: taskStats?.taskStatus?.dueInWeek,
      value: "dueInWeek",
    },
    {
      name: "Overdue",
      count: taskStats?.taskStatus?.overdue,
      value: "overdue",
    },
    {
      name: "Completed",
      count: taskStats?.taskStatus?.completed,
      value: "completed",
    },
  ];

  const handleChangeTab = (tab) => {
    setActiveTab(tab.value);
  };

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
    setIsFilterOpen(false);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setIsStatusOpen(false);
  };

  const sortTasks = (tasks) => {
    if (!tasks) return [];

    let sortedTasks = [...tasks];

    // Apply status filter
    if (statusFilter !== "all") {
      sortedTasks = sortedTasks.filter((task) => {
        switch (statusFilter) {
          case "notStarted":
            return task.teamStatus === "Not Started";
          case "inProgress":
            return task.teamStatus === "In Progress";
          case "completed":
            return task.teamStatus === "Completed";
          default:
            return true;
        }
      });
    }

    // Apply sorting
    sortedTasks.sort((a, b) => {
      if (sortBy === "dueDate") {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "progress") {
        return sortOrder === "asc"
          ? a.progress - b.progress
          : b.progress - a.progress;
      }
      return 0;
    });

    return sortedTasks;
  };

  return (
    <div className="task-container">
      <h1>Task Management</h1>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <div
            key={tab.name}
            className={`tab ${activeTab === tab.value ? "active" : ""}`}
            onClick={() => handleChangeTab(tab)}
          >
            {tab.name} ({tab.count})
          </div>
        ))}

        <div className="tab-actions">
          <div className="filter-dropdown">
            <button
              className={`filter-button ${isFilterOpen ? "active" : ""}`}
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsStatusOpen(false);
              }}
            >
              <span className="filter-icon">⚙</span> Filter{" "}
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
                  {sortBy === "dueDate" && (sortOrder === "asc" ? "↑" : "↓")}
                </div>
                <div
                  className={`dropdown-item ${
                    sortBy === "progress" ? "active" : ""
                  }`}
                  onClick={() => handleSort("progress")}
                >
                  Progress{" "}
                  {sortBy === "progress" && (sortOrder === "asc" ? "↑" : "↓")}
                </div>
              </div>
            )}
          </div>

          <div className="status-dropdown">
            <button
              className={`status-button ${isStatusOpen ? "active" : ""}`}
              onClick={() => {
                setIsStatusOpen(!isStatusOpen);
                setIsFilterOpen(false);
              }}
            >
              Status{" "}
              <span className="dropdown-arrow">
                <FaAngleDown />
              </span>
            </button>
            {isStatusOpen && (
              <div className="dropdown-menu">
                <div
                  className={`dropdown-item ${
                    statusFilter === "all" ? "active" : ""
                  }`}
                  onClick={() => handleStatusFilter("all")}
                >
                  All
                </div>
                <div
                  className={`dropdown-item ${
                    statusFilter === "notStarted" ? "active" : ""
                  }`}
                  onClick={() => handleStatusFilter("notStarted")}
                >
                  Not Started
                </div>
                <div
                  className={`dropdown-item ${
                    statusFilter === "inProgress" ? "active" : ""
                  }`}
                  onClick={() => handleStatusFilter("inProgress")}
                >
                  In Progress
                </div>
                <div
                  className={`dropdown-item ${
                    statusFilter === "completed" ? "active" : ""
                  }`}
                  onClick={() => handleStatusFilter("completed")}
                >
                  Completed
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="task-table">
        <div className="table-header">
          <div className="header-cell expand-cell"></div>
          <div className="header-cell">Task Name</div>
          {/* <div className="header-cell">Task ID</div> */}
          <div className="header-cell">Status</div>
          <div className="header-cell">Progress</div>
          <div className="header-cell">Dependencies</div>
          <div className="header-cell">Due Date</div>
          <div className="header-cell">Completion Date</div>
        </div>

        {sortTasks(allTasks[activeTab])?.map((task, index) => (
          <React.Fragment key={index}>
            <div className="table-row">
              <div
                className="cell expand-cell"
                onClick={() => toggleTaskExpand(index)}
              >
                <span
                  className={`expand-icon ${
                    expandedTasks?.includes(index) ? "expanded" : ""
                  }`}
                >
                  {expandedTasks.includes(index) ? (
                    <FaAngleDown className="icon" />
                  ) : (
                    <FaAngleRight className="icon" />
                  )}
                </span>
              </div>
              <div className="cell cell-1">{task?.taskName}</div>
              {/* <div className="cell cell-1">{task?.taskId}</div> */}
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
              <div className="cell cell-1">
                <div className="dependencies-cell">
                  <div className="dependencies-actions">
                    <button
                      className="dependencies-button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                      // onClick={() => {
                      //   //setSelectedTaskId(task?._id);
                      //   setDependenciesPopup({
                      //     isOpen: true,
                      //     taskIndex: index,
                      //     task: task,
                      //   });
                      // }}
                    >
                      Dependencies ({task?.dependencies?.length || 0})
                      <IoMdInformationCircleOutline
                        size={15}
                        style={{
                          color:
                            task?.dependencies?.length > 0 ? "red" : "#888",
                          marginTop: "1px",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
              <div className="cell cell-1">{formatDate(task?.dueDate)}</div>
              <div className="cell cell-1">
                {formatCompletionDate(task?.completionDate)}
              </div>
            </div>

            {expandedTasks.includes(index) && task.subtasks.length > 0 && (
              <div className="subtasks-container">
                <div className="subtasks-header">
                  <h3>Subtasks:</h3>
                </div>

                <div className="subtasks-table">
                  <div className="subtasks-header-row">
                    <div className="subtask-header-cell checkbox-cell"></div>
                    <div className="subtask-header-cell">Name</div>
                    <div className="subtask-header-cell">Assignee</div>
                    <div className="subtask-header-cell">Comment</div>
                    <div className="subtask-header-cell">Status</div>
                  </div>

                  {task.subtasks.map((subtask, subtaskIndex) => (
                    <div className="subtask-row" key={subtaskIndex}>
                      <div className="subtask-cell checkbox-cell"></div>
                      <div className="subtask-cell">{subtask.name}</div>
                      <div className="subtask-cell">
                        {subtask.assignee !== "NA" ? (
                          <div className="assignee">
                            <div className="avatar"></div>
                            <span>{subtask?.assignee?.name}</span>
                          </div>
                        ) : (
                          "NA"
                        )}
                      </div>
                      <div className="subtask-cell">
                        {subtask.submission === "document.pdf" ? (
                          <div className="document-link">
                            <span className="document-icon">📄</span>
                            <span>{subtask?.submission}</span>
                          </div>
                        ) : (
                          subtask.submission
                        )}
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Dependencies Popup Dialog */}
      {/* Dependencies Popup Dialog */}
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
            <div className="warning-banner">
              <span>⚠ This task is blocked by incomplete dependencies</span>
            </div>

            {/* Current Dependencies */}
            <div className="current-dependencies">
              <h5>Current Dependencies</h5>
              <div className="dependency-list">
                {dependenciesPopup.task?.dependencies?.length > 0 ? (
                  dependenciesPopup.task?.dependencies.map((dep, index) => (
                    <div key={index} className="dependency-chip">
                      <span className="dep-task">{dep.name}</span>
                      <span className="dep-person">{dep.person}</span>
                      <span
                        className={`dep-status ${dep.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="no-deps">No current dependencies</p>
                )}
              </div>
            </div>

            {/* Add Dependency */}
            <div className="add-dependency">
              <h5>Add Dependency</h5>
              <div className="form-row">
                <select className="task-select" defaultValue="">
                  <option value="" disabled>
                    Select a task...
                  </option>
                </select>
                <select className="person-select" defaultValue="">
                  <option value="" disabled>
                    Select Person...
                  </option>
                </select>
              </div>

              <textarea
                className="description-input"
                placeholder="Write short description about dependency..."
              ></textarea>

              <div className="add-dependency-actions">
                <button className="add-button">Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTaskDetailPopupOpen && (
        <TaskDetails
          isTaskDetailPopupOpen={isTaskDetailPopupOpen}
          setIsTaskDetailPopupOpen={setIsTaskDetailPopupOpen}
        />
      )}
    </div>
  );
};
export default Task;
