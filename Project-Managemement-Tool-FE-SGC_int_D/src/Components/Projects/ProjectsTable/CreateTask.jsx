import { useEffect, useState } from "react";
import { notify } from "../../../utils/helper";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { MdDeleteOutline } from "react-icons/md";
// import "./CreateTask.css";

const CreateTask = ({
  setIsCreateTaskVisible,
  fetchTasksAndSubtasks,
  team,
}) => {
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const { opics, managers, user } = useAuth();
  const [assigneeList, setAssigneeList] = useState([]);

  useEffect(() => {
    const fetchAssigneeList = async () => {
      try {
        const response = await axios.get(
          ` /api/auth/users/by-team/${team}`,
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
  }, []);

  const [formData, setFormData] = useState({
    taskId: "",
    taskName: "",
    teamStatus: "Assigned",
    progress: "0",
    assignee: "",
    comment: "",
    attachments: [],
    assigner: "",
    dueDate: "",
  });

  // ✅ New state for single milestone
  const [milestone, setMilestone] = useState({
    milestoneName: "",
    budget: "",
    dueDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      attachments: e.target.files,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    try {
      formData.dueDate = new Date(formData.dueDate);

      const formDataToSend = new FormData();

      formDataToSend.append("taskId", formData.taskId);
      formDataToSend.append("assignee", formData.assignee);
      formDataToSend.append("assigner", formData.assigner);
      formDataToSend.append("taskName", formData.taskName);
      formDataToSend.append("teamStatus", formData.teamStatus);
      formDataToSend.append("progress", formData.progress);
      formDataToSend.append("dueDate", formData.dueDate);
      formDataToSend.append("comment", formData.comment);

      // ✅ Attach milestone data
      if (milestone.milestoneName) {
        formDataToSend.append(
          "milestone[milestoneName]",
          milestone.milestoneName
        );
        formDataToSend.append("milestone[budget]", milestone.budget);
        formDataToSend.append("milestone[dueDate]", milestone.dueDate);
      }

      if (formData.attachments && formData.attachments.length > 0) {
        Array.from(formData.attachments).forEach((file) => {
          formDataToSend.append("attachments", file);
        });
      }

      const response = await axios.post(
        ` /api/task/create/${id}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      setIsCreateTaskVisible(false);
      fetchTasksAndSubtasks();
      setLoading(false);
    } catch (error) {
      notify("error", error.response?.data?.message || "Error creating Task");
      setLoading(false);
    }
  };

  const handleCloseCreateTaskVisible = () => {
    setIsCreateTaskVisible(false);
  };

  const teamMembers = [user?.name];
  const statusOptions = ["Assigned", "In Progress", "Completed"];

  return (
    <div className="create-project-container">
      <div className="create-Task-project-wrapper">
        <h1 className="form-title">Create new task</h1>

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
                  {teamMembers.map((member) => (
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
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="teamStatus">Status</label>
              <div className="select-wrapper">
                <select
                  id="teamStatus"
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

          {/* ✅ New Milestone Section */}
          <div className="milestone-section">
            <div className="form-row">
              <div className="form-group">
                <label>Milestone Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={milestone.milestoneName}
                  onChange={(e) =>
                    setMilestone({
                      ...milestone,
                      milestoneName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Budget Allocation</label>
                <input
                  type="number"
                  className="form-input"
                  value={milestone.budget}
                  onChange={(e) =>
                    setMilestone({ ...milestone, budget: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group due-date">
              <label>Due Date</label>
              <input
                type="date"
                className="form-input"
                value={milestone.dueDate}
                onChange={(e) =>
                  setMilestone({ ...milestone, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Create task"}
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

export default CreateTask;
