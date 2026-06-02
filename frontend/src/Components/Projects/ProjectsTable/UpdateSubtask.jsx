import axios from "axios";
import { useEffect, useState } from "react";
import { notify } from "../../../utils/helper";
import { useAuth } from "../../../context/AuthContext";

const UpdateSubtask = ({
  editSubtaskData,
  fetchTasksAndSubtasks,
  setIsEditSubTaskVisible,
  team,
}) => {
  const { opics, managers, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [assigneeList, setAssigneeList] = useState();
  const [formData, setFormData] = useState({
    name: editSubtaskData.name || "",
    assignee: editSubtaskData.assignee?._id || "",
    submission: editSubtaskData.submission || "",
    status: editSubtaskData.status || "In Progress",
  });

  // //console.log('edit subtask data', editSubtaskData);
  // //console.log('data in updated subtask', opics, managers);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    //console.log("Form submitted:", formData);
    const token = localStorage.getItem("token");

    if (!token) {
      //console.log("No token found, please login again");
      return;
    }
    try {
      const response = await axios.put(
        `/api/task/update/subtask/${editSubtaskData._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", "subtask updated successfully");
      setIsEditSubTaskVisible(false);
      setLoading(false);
      fetchTasksAndSubtasks();
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error updating subtasks"
      );
      setLoading(false);
      //console.log(error.response?.data?.message || "Error updating subtasks");
    }
  };

  const handleCloseCreateSubtaskVisible = () => {
    setIsEditSubTaskVisible(false);
  };

  const statusOptions = ["Not Started", "In Progress", "Completed"];

  return (
    <div className="create-project-container">
      <div className="create-project-wrapper">
        <h1 className="form-title">Update subtask</h1>

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
                <option value="">
                  {" "}
                  {editSubtaskData?.assignee?.name || "Select Assignee"}{" "}
                </option>
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
              {loading ? "Updating..." : "Update subtask"}
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

export default UpdateSubtask;
