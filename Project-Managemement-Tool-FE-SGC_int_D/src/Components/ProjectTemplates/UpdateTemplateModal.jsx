import { useEffect, useState } from "react";
import "./CreateTemplateModal.css";
import axios from "axios";
import { notify } from "../../utils/helper";

const UpdateTemplateModal = ({
  toggleMenu,
  onClose,
  fetchTemplate,
  project,
}) => {
  const [projectName, setProjectName] = useState(project?.projectName);
  const [expectedDuration, setExpectedDuration] = useState(
    project?.expectedDuration
  );
  const [tasks, setTasks] = useState(project?.tasks);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: tasks.length + 1,
        name: "",
        duration: "",
        subtasks: [],
      },
    ]);
  };

  const addSubtask = (taskId) => {
    setTasks(
      tasks.map((task, index) => {
        if (index === taskId) {
          return {
            ...task,
            subtasks: [
              ...task.subtasks,
              {
                id: task.subtasks.length + 1,
                name: "",
                duration: "",
              },
            ],
          };
        }
        return task;
      })
    );
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter((task, index) => index !== taskId));
  };

  const removeSubtask = (taskId, subtaskId) => {
    setTasks(
      tasks.map((task, index1) => {
        if (index1 === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.filter(
              (subtask, index2) => index2 !== subtaskId
            ),
          };
        }
        return task;
      })
    );
  };

  const updateTask = (taskId, field, value) => {
    setTasks(
      tasks.map((task, index) => {
        if (index === taskId) {
          return { ...task, [field]: value };
        }
        return task;
      })
    );
  };

  const updateSubtask = (taskId, subtaskId, field, value) => {
    setTasks(
      tasks.map((task, index) => {
        if (index === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map((subtask, index) => {
              if (index === subtaskId) {
                return { ...subtask, [field]: value };
              }
              return subtask;
            }),
          };
        }
        return task;
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    //console.log({ projectName, tasks });

    const token = localStorage.getItem("token");
    if (!token) {
      //console.log("No token found, please login again");
      notify("error", "No token found, please login again");
      return;
    }

    try {
      const response = await axios.put(
        `/api/templates/update/${project?.projectName}`,
        { projectName, tasks, expectedDuration },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      fetchTemplate();
    } catch (error) {
      //console.log("error", error);
      notify(
        "error",
        error.response?.data?.message || "Error creating project"
      );
    }

    onClose();
    toggleMenu();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update Template</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Project name<span className="require">*</span>
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="form-group">
            <input
              type="text"
              value={expectedDuration}
              onChange={(e) => setExpectedDuration(e.target.value)}
              placeholder="Expected Duration (in days)"
              required
            />
          </div>

          <div className="tasks-section">
            <div className="section-header">
              <h3>
                Tasks<span className="require">*</span>
              </h3>
              <button type="button" onClick={addTask} className="add-button">
                + Add Task
              </button>
            </div>

            {tasks.map((task, index1) => (
              <div key={index1} className="task-group">
                <div className="task-header">
                  <input
                    type="text"
                    placeholder="Task Name"
                    value={task.taskName}
                    onChange={(e) =>
                      updateTask(index1, "taskName", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Duration (in days)"
                    value={task.expectedDuration}
                    min={0}
                    onChange={(e) =>
                      updateTask(index1, "expectedDuration", e.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeTask(index1)}
                  >
                    ×
                  </button>
                </div>

                <div className="subtasks-section">
                  {task.subtasks.map((subtask, index2) => (
                    <div key={index2} className="subtask-item">
                      <input
                        type="text"
                        placeholder="Subtask Name"
                        value={subtask.name}
                        onChange={(e) =>
                          updateSubtask(index1, index2, "name", e.target.value)
                        }
                        required
                      />
                      {/* <input
                        type="number"
                        placeholder="Duration (in days)"
                        value={subtask.expectedDuration}
                        min={0}
                        onChange={(e) => updateSubtask(index1, index2, 'expectedDuration', e.target.value)}
                        required
                      /> */}
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeSubtask(index1, index2)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-subtask-button"
                    onClick={() => addSubtask(index1)}
                  >
                    + Add Subtask
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="submit" className="create-button">
              Update Template
            </button>
            <button
              type="button"
              onClick={() => (onClose(), toggleMenu())}
              className="cancel-button"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTemplateModal;
