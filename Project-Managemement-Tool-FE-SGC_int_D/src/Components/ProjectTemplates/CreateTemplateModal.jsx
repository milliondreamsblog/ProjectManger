import { useEffect, useState } from "react";
import "./CreateTemplateModal.css";
import axios from "axios";
import { notify } from "../../utils/helper";

const CreateTemplateModal = ({ onClose, fetchTemplate }) => {
  const [projectName, setProjectName] = useState("");
  const [expectedDuration, setExpectedDuration] = useState(null);
  const [tasks, setTasks] = useState([
    { id: 1, taskName: "", expectedDuration: "", subtasks: [] },
  ]);

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
      tasks.map((task) => {
        if (task.id === taskId) {
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
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const removeSubtask = (taskId, subtaskId) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.filter(
              (subtask) => subtask.id !== subtaskId
            ),
          };
        }
        return task;
      })
    );
  };

  const updateTask = (taskId, field, value) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          return { ...task, [field]: value };
        }
        return task;
      })
    );
  };

  const updateSubtask = (taskId, subtaskId, field, value) => {
    setTasks(
      tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            subtasks: task.subtasks.map((subtask) => {
              if (subtask.id === subtaskId) {
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
      const response = await axios.post(
        "/api/templates/create",
        { projectName, expectedDuration, tasks },
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
  };

  /* 
const handleSubmit = async(e) => {
    e.preventDefault();
    setLoading(true);

    //console.log("Form submitted:", formData);
    const token = localStorage.getItem("token"); 
    if(!token){
      //console.log("No token found, please login again");
      return;
    }

    try {

     formData.startDate = new Date(formData.startDate);
     formData.endDate = new Date(formData.endDate);

      const response = await axios.post(
          "/api/project/create",  
          formData,
          {
              headers: {
                  Authorization: `Bearer ${token}`, 
              },
          }
      );
      notify("success", response.data.message);
      fetchProject();
      setIsCreateProjectVisible(false);
      setLoading(false);
      //console.log(response.data.message); 
  } catch (error) {
      notify("error", error.response?.data?.message || "Error creating project");
      setLoading(false);
      //console.log(error.response?.data?.message || "Error creating project");
  }

  }
*/

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create new Template</h2>
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

            {tasks.map((task) => (
              <div key={task.id} className="task-group">
                <div className="task-header">
                  <input
                    type="text"
                    placeholder={`Task Name`}
                    value={task.taskName}
                    onChange={(e) =>
                      updateTask(task.id, "taskName", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Duration (in days)"
                    value={task.expectedDuration}
                    min={0}
                    onChange={(e) =>
                      updateTask(task.id, "expectedDuration", e.target.value)
                    }
                    required
                  />
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeTask(task.id)}
                  >
                    ×
                  </button>
                </div>

                <div className="subtasks-section">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="subtask-item">
                      <input
                        type="text"
                        placeholder="Subtask Name"
                        value={subtask.name}
                        onChange={(e) =>
                          updateSubtask(
                            task.id,
                            subtask.id,
                            "name",
                            e.target.value
                          )
                        }
                        required
                      />
                      {/* <input
                        type="number"
                        placeholder="Duration (in days)"
                        value={subtask.expectedDuration}
                        min={0}
                        onChange={(e) => updateSubtask(task.id, subtask.id, 'expectedDuration', e.target.value)}
                        required
                      /> */}
                      <button
                        type="button"
                        className="remove-button"
                        onClick={() => removeSubtask(task.id, subtask.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-subtask-button"
                    onClick={() => addSubtask(task.id)}
                  >
                    + Add Subtask
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="submit" className="create-button">
              Create Template
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
