import { useEffect, useState } from "react";
import { formatToYYYYMMDD, notify } from "../../../utils/helper";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const UpdateTask = ({
  setIsUpdateTaskVisible,
  taskEditData,
  fetchTasksAndSubtasks,
  team,
}) => {
  const [loading, setLoading] = useState(false);
  const [assigneeUser, setAssigneeUser] = useState("");

  const [assigneeList, setAssigneeList] = useState();
  const [formData, setFormData] = useState({
    taskId: taskEditData?.taskId,
    taskName: taskEditData?.taskName,
    teamStatus: taskEditData?.teamStatus,
    progress: taskEditData?.progress,
    assignee: taskEditData?.assignee?._id,
    comments: "",
    teamName: "",
    assigner: taskEditData?.assigner?.name,
    dueDate: formatToYYYYMMDD(taskEditData?.dueDate),
    status: taskEditData?.teamStatus,
  });

  const { opics, managers, user } = useAuth();
  console.log("this is user data", user);

  // console.log('task edit data', taskEditData);

  useEffect(() => {
    const today = new Date();
    console.log("Initial taskEditData.dueDate:", taskEditData?.dueDate);
    console.log("Initial formData.dueDate:", formData.dueDate);
    console.log("today", today);
    const due = new Date(formData.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    console.log("diffTime:", formData.dueDate);
    console.log("diffdays:", today);
    const fetchAssigneeList = async () => {
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
        console.log("Assignee List:", response.data.users);
      } catch (error) {
        console.error("Error fetching assignee list:", error);
      }
    };
    fetchAssigneeList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // If changing assignee and there are subtasks with different assignees
    if (name === "assignee" && taskEditData?.subtasks?.length > 0) {
      const differentAssigneeSubtasks = taskEditData.subtasks.filter(
        (subtask) => subtask.assignee?._id !== value
      );

      if (differentAssigneeSubtasks.length > 0) {
        const confirmChange = window.confirm(
          `This task has ${differentAssigneeSubtasks.length} subtask(s) assigned to different people. Do you want to update all subtasks to be assigned to the same person as the task?`
        );
        if (!confirmChange) {
          return; // Don't update if user cancels
        }
      }
    }

    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));

    if (name === "assignee") {
      const selectedUser = assigneeList?.find((member) => member._id === value);
      setAssigneeUser(selectedUser ? selectedUser.name : "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "Please login again");
      return;
    }

    try {
      formData.dueDate = new Date(formData.dueDate);
      const response = await axios.put(
        `/api/task/update/${taskEditData._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      fetchTasksAndSubtasks();
      setIsUpdateTaskVisible(false);
    } catch (error) {
      notify("error", error.response?.data?.message || "Error updating task");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCreateTaskVisible = () => {
    setIsUpdateTaskVisible(false);
  };

  const isDueDateEditable = () => {
    if (user?.role !== "admin" && user?.role !== "manager") return false;

    if (user?.role === "admin") return true;

    const today = new Date();
    const due = new Date(formData.dueDate);

    // Set both dates to start of day to compare only dates, not times
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // console.log('Today:', today.toDateString());
    // console.log('Due date:', due.toDateString());
    // console.log('Difference in days:', diffDays);

    return diffDays > 1;
  };

  // const statusOptions = ["Pending", "In Progress", "Completed", "On Hold"];
  const statusOptions = ["Assigned", "In Progress", "Completed"];

  return (
    <div className="create-project-container">
      <div className="create-Task-project-wrapper">
        <h1 className="form-title">Update task</h1>
        {taskEditData?.subtasks?.length > 0 && (
          <div
            className="info-message"
            style={{
              color: "#2196f3",
              marginBottom: "1rem",
              padding: "0.5rem",
              backgroundColor: "#e3f2fd",
              borderRadius: "4px",
              fontSize: "0.9rem",
            }}
          >
            ℹ️ Note: This task has {taskEditData.subtasks.length} subtask(s).
            Changing the assignee will affect all subtasks.
          </div>
        )}

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="taskName">
              Task Name<span className="require">*</span>
            </label>
            <input
              type="text"
              id="taskName"
              name="taskName"
              value={formData.taskName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="assignee">
                Assignee<span className="require">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="assignee"
                  name="assignee"
                  value={formData.assignee}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value={formData.assignee}>
                    {assigneeUser ||
                      taskEditData?.assignee?.name ||
                      "Select Assignee"}
                  </option>
                  {user.role !== "opic" ? (
                    assigneeList
                      ?.sort((a, b) => {
                        if (a.name < b.name) {
                          return -1;
                        }
                        if (a.name > b.name) {
                          return 1;
                        }
                        return 0;
                      })
                      .map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))
                  ) : (
                    <option value={user.id}>{user.name}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="assigner">
                Assigner<span className="require">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  id="assigner"
                  name="assigner"
                  value={formData.assigner}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Assigner</option>
                  {[user?.name].map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">
                Due Date<span className="require">*</span>
              </label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={!isDueDateEditable()}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <div className="select-wrapper">
                <select
                  id="temStatus"
                  name="teamStatus"
                  value={formData.teamStatus}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Updating..." : "Update task"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCloseCreateTaskVisible}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTask;
