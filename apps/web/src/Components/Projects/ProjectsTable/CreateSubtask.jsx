import axios from "axios";
import { useEffect, useState } from "react";
import { notify } from "../../../utils/helper";
import { useAuth } from "../../../context/AuthContext";

const CreateSubtask = ({
  setIsCreateSubTaskVisible,
  subTaskId,
  fetchTasksAndSubtasks,
  team,
}) => {
  const { opics, managers, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assigneeList, setAssigneeList] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    assignee: "",
    submission: "",
    status: "Not started",
  });

  //console.log("opics and managers", opics, managers);

  useEffect(() => {
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
        //console.log("Assignee List:", response.data.users);
      } catch (error) {
        console.error("Error fetching assignee list:", error);
      }
    };
    fetchAssigneeList();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const addSubtask = async (taskId, subtaskData) => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("You need to log in first.");
      return;
    }

    try {
      const response = await axios.post(
        `/api/task/add/subtask/${taskId}`,
        subtaskData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      setIsCreateSubTaskVisible(false);
      fetchTasksAndSubtasks();
      setLoading(false);
      //console.log("Subtask added:", response.data);
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error creating project"
      );
      setLoading(false);
      console.error(
        "Error adding subtask:",
        error.response?.data?.message || error.message
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    //console.log("Form submitted:", formData);
    addSubtask(subTaskId, formData);
  };

  const handleCloseCreateSubtaskVisible = () => {
    setIsCreateSubTaskVisible(false);
  };

  const statusOptions = ["Not started", "In Progress", "Completed"];

  return (
    <div className="create-project-container">
      <div className="create-project-wrapper">
        <h1 className="form-title">Create new subtask</h1>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">
              Subtask Name<span className="require">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

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
                  assigneeList
                    ?.sort((a, b) => {
                      if (a.name > b.name) {
                        return 1;
                      } else if (a.name < b.name) {
                        return -1;
                      } else {
                        return 0;
                      }
                    })
                    ?.map((member) => (
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
            <label htmlFor="submission">Comment</label>
            <textarea
              id="submission"
              name="submission"
              value={formData.submission}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter comment"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status">
              Status<span className="require">*</span>
            </label>
            <div className="select-wrapper">
              <select
                id="status"
                name="status"
                value={formData.status}
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

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Creating..." : "Create subtask"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCloseCreateSubtaskVisible}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubtask;
