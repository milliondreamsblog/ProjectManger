import { useState } from "react";
import "./TaskAndSubTask2.css";

const TaskAndSubTask2 = ({ project, onBack }) => {
  const [expandedTasks, setExpandedTasks] = useState([0]);

  // Sample tasks data - in a real app, you would fetch this based on the project ID
  const tasks = [
    {
      id: "Task ID",
      comments: "Text goes here",
      assignee: "Assignee Name",
      team: "Text",
      status: "In progress",
      progress: 25,
      dueDate: "21-Mar-2025",
      subtasks: [
        {
          name: "Subtask 1",
          assignee: "Assignee Name",
          submission: "url link",
          status: "Completed",
          checked: true,
        },
        {
          name: "Subtask 2",
          assignee: "Assignee Name",
          submission: "document.pdf",
          status: "Pending",
          checked: false,
        },
        {
          name: "Subtask 3",
          assignee: "Assignee Name",
          submission: "NA",
          status: "In Progress",
          checked: false,
        },
        {
          name: "Subtask 4",
          assignee: "NA",
          submission: "NA",
          status: "Not Assigned",
          checked: false,
        },
      ],
    },
    {
      id: "Task ID",
      comments: "Text goes here",
      assignee: "Assignee Name",
      team: "Text",
      status: "Assigned",
      progress: 25,
      dueDate: "21-Mar-2025",
      subtasks: [],
    },
    {
      id: "Task ID",
      comments: "Text goes here",
      assignee: "NA",
      team: "Text",
      status: "Not Assigned",
      progress: 25,
      dueDate: "21-Mar-2025",
      subtasks: [],
    },
  ];

  const toggleTaskExpand = (index) => {
    if (expandedTasks.includes(index)) {
      setExpandedTasks(
        expandedTasks.filter((taskIndex) => taskIndex !== index)
      );
    } else {
      setExpandedTasks([...expandedTasks, index]);
    }
  };

  const handleAddTask = () => {
    //console.log("Adding new task to project:", project.id)
  };

  const handleAddSubtask = (taskIndex) => {
    //console.log("Adding subtask to task index:", taskIndex)
  };

  return (
    <div className="task-subtask2-container">
      <div className="task-header">
        <div className="back-button" onClick={onBack}>
          <span className="back-icon">←</span>
          <span>Back</span>
        </div>
        <h2>
          Projects / {project.id} - {project.type}
        </h2>
        <button className="add-task-button-header">Add Task +</button>
      </div>

      <div className="task-table">
        <div className="table-header">
          <div className="header-cell expand-cell"></div>
          <div className="header-cell">Task ID</div>
          <div className="header-cell">Comments</div>
          <div className="header-cell">Assignee</div>
          <div className="header-cell">Team</div>
          <div className="header-cell">
            Status <span className="sort-arrow">▼</span>
          </div>
          <div className="header-cell">Progress</div>
          <div className="header-cell">
            Due Date <span className="sort-arrow">▼</span>
          </div>
          <div className="header-cell">Action</div>
        </div>

        {tasks.map((task, index) => (
          <div key={index} className="task-section">
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
                  {expandedTasks.includes(index) ? "▼" : "▶"}
                </span>
              </div>
              <div className="cell">{task.id}</div>
              <div className="cell">{task.comments}</div>
              <div className="cell">
                {task.assignee !== "NA" ? (
                  <div className="assignee">
                    <div className="avatar"></div>
                    <span>{task.assignee}</span>
                  </div>
                ) : (
                  "NA"
                )}
              </div>
              <div className="cell">{task.team}</div>
              <div className="cell">
                <span
                  className={`status-badge ${task.status
                    .replace(/\s+/g, "-")
                    .toLowerCase()}`}
                >
                  {task.status}
                </span>
              </div>
              <div className="cell">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{task.progress}%</span>
              </div>
              <div className="cell">{task.dueDate}</div>
              <div className="cell">
                <button className="action-button">⋯</button>
              </div>
            </div>

            {expandedTasks.includes(index) && (
              <div className="subtasks-container">
                <div className="subtasks-header">
                  <h3>Subtasks:</h3>
                </div>

                {task.subtasks.length > 0 ? (
                  <div className="subtasks-table">
                    <div className="subtasks-header-row">
                      <div className="subtask-header-cell checkbox-cell"></div>
                      <div className="subtask-header-cell">Name</div>
                      <div className="subtask-header-cell">Assignee</div>
                      <div className="subtask-header-cell">Submission</div>
                      <div className="subtask-header-cell">Status</div>
                    </div>

                    {task.subtasks.map((subtask, subtaskIndex) => (
                      <div className="subtask-row" key={subtaskIndex}>
                        <div className="subtask-cell checkbox-cell">
                          <input
                            type="checkbox"
                            checked={subtask.checked}
                            readOnly
                          />
                        </div>
                        <div className="subtask-cell">{subtask.name}</div>
                        <div className="subtask-cell">
                          {subtask.assignee !== "NA" ? (
                            <div className="assignee">
                              <div className="avatar"></div>
                              <span>{subtask.assignee}</span>
                            </div>
                          ) : (
                            "NA"
                          )}
                        </div>
                        <div className="subtask-cell">
                          {subtask.submission === "document.pdf" ? (
                            <div className="document-link">
                              <span className="document-icon">📄</span>
                              <span>{subtask.submission}</span>
                            </div>
                          ) : (
                            subtask.submission
                          )}
                        </div>
                        <div className="subtask-cell">
                          <span
                            className={`status-badge ${subtask.status
                              .replace(/\s+/g, "-")
                              .toLowerCase()}`}
                          >
                            {subtask.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-subtasks">No subtasks available</div>
                )}

                <div className="add-subtask-row">
                  <button
                    className="add-subtask-button"
                    onClick={() => handleAddSubtask(index)}
                  >
                    + Add subtask
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="add-task-container">
        <button className="add-task-button" onClick={handleAddTask}>
          + Add Task
        </button>
      </div>
    </div>
  );
};

export default TaskAndSubTask2;
