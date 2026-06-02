import { useState, useEffect } from "react";
import "./CreateProject.css";
import axios from "axios";
import { formatToYYYYMMDD, notify } from "../../utils/helper";

const UpdateProject = ({
  projectEditData,
  setIsUpdateProjectVisible,
  fetchProject,
}) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);

  const [formData, setFormData] = useState({
    projectId: projectEditData?.projectId,
    projectName: projectEditData?.projectName,
    projectType: projectEditData?.projectType || "",
    startDate: formatToYYYYMMDD(projectEditData?.startDate),
    endDate: formatToYYYYMMDD(projectEditData?.endDate),
    projectDescription: projectEditData?.projectDescription,
    status: projectEditData?.status,
    assignedTo: [],
    expectedDuration: projectEditData?.expectedDuration || "",
  });

  // const fetchTemplate = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) {
  //     //console.log("No token found, please login again");
  //     notify("error", "No token found, please login again");
  //     return;
  //   }
  //   try {
  //     const resp = await axios.get("/api/templates/all", {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });
  //     //console.log("fetch template", resp.data);
  //     setTemplates(resp.data);
  //   } catch (error) {
  //     //console.log("error in fetching template", error);
  //   }
  // };

  // useEffect(() => {
  //   fetchTemplate();
  // }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => {
      const newState = {
        ...prevState,
        [name]: value,
      };

      // Calculate end date when start date or expected duration changes
      if (name === "startDate" || name === "expectedDuration") {
        if (newState.startDate && newState.expectedDuration) {
          const startDate = new Date(newState.startDate);
          const endDate = new Date(startDate);
          endDate.setDate(
            startDate.getDate() + parseInt(newState.expectedDuration)
          );
          newState.endDate = endDate.toISOString().split("T")[0];
        }
      }

      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      //console.log("No token found, please login again");
      return;
    }

    try {
      formData.startDate = new Date(formData.startDate);
      formData.endDate = new Date(formData.endDate);
      const response = await axios.put(
        `/api/project/update/${projectEditData._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      setIsUpdateProjectVisible(false);
      fetchProject();
      //console.log("Project updated:", response.data);
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error updating project"
      );
      console.error(
        "Error updating project:",
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseCreateProjectVisible = () => {
    setIsUpdateProjectVisible(false);
  };

  return (
    <div className="create-project-container">
      <div className="create-Task-project-wrapper">
        <h1 className="form-title">Update project</h1>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="projectName">
              Project name<span className="require">*</span>
            </label>
            <input
              type="text"
              id="projectName"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="projectType">
                Project type<span className="require">*</span>
              </label>
              <div className="select-wrapper">
                <input
                  type="text"
                  id="projectType"
                  name="projectType"
                  value={formData.projectType}
                  readOnly
                  className="form-input not-editable-inputBox "
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="expectedDuration">Expected Duration (days)</label>
              <input
                type="number"
                id="expectedDuration"
                name="expectedDuration"
                value={formData.expectedDuration}
                onChange={handleChange}
                className="form-input not-editable-inputBox"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">
                Start Date<span className="require">*</span>
              </label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  placeholder="DD/MM/YYYY"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <div className="date-input-wrapper">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  placeholder="DD/MM/YYYY"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="form-input not-editable-inputBox"
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="projectDescription">Project Description</label>
            <textarea
              id="projectDescription"
              name="projectDescription"
              placeholder="Please share your main reason..."
              value={formData.projectDescription}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Updating..." : "Update project"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCloseCreateProjectVisible}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateProject;
