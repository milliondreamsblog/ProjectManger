import React, { useState } from "react";
import PropTypes from "prop-types";
import { Calendar, BarChart3 } from "lucide-react";
import { CiEdit } from "react-icons/ci";
import axios from "axios";
import { notify } from "../../../utils/helper";
import "../ProjectsTable/MilestoneView.css";

const MilestoneView = ({ projectData }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
    dueDate: "",
  });

  const handleEditClick = (milestone) => {
    setSelectedMilestone(milestone);
    setFormData({
      name: milestone.name || "",
      budget: milestone.budget || "",
      dueDate: milestone.dueDate ? milestone.dueDate.split("T")[0] : "",
    });
    setShowPopup(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ API call to update milestone
  const handleSave = async () => {
    if (!selectedMilestone || !selectedMilestone.id) {
      alert("Milestone ID not found");
      return;
    }

    try {
      await axios.put(
        `/api/project/updateMilestone/${selectedMilestone.id}`,
        {
          milestoneName: formData.name,
          budget: Number(formData.budget),
          dueDate: formData.dueDate,
        }
      );

      notify("success", "Milestone updated successfully!");

      // ✅ Update UI immediately
      selectedMilestone.name = formData.name;
      selectedMilestone.budget = Number(formData.budget);
      selectedMilestone.dueDate = formData.dueDate;

      setShowPopup(false);
    } catch (error) {
      console.error("Error updating milestone:", error);
      alert("Failed to update milestone. Please try again.");
    }
  };
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "invoice generated":
      case "completed":
        return "status-completed";
      case "invoice pending":
      case "pending":
        return "status-pending";
      case "in progress":
        return "status-in-progress";
      default:
        return "status-default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "$0";
    return `$${amount.toLocaleString()}`;
  };

  if (
    !projectData ||
    !projectData.milestones ||
    projectData.milestones.length === 0
  ) {
    return (
      <div className="milestone-view__no-data">
        <BarChart3 className="milestone-view__no-data-icon" />
        <p>No milestone data available</p>
      </div>
    );
  }

  return (
    <div className="milestone-view">
      <div className="milestone-view__container">
        {projectData.milestones.map((milestone, index) => (
          <div key={milestone.id || index} className="milestone-view__card">
            {/* Milestone Header */}
            <div className="milestone-view__header">
              <div className="milestone-view__header-top">
                <div className="milestone-view__header-left">
                  <span className="milestone-view__milestone-number">
                    {milestone.label}
                  </span>
                </div>
                {/* ✅ Edit Button */}
                <div className="_header-right">
                  <button onClick={() => handleEditClick(milestone)}>
                    <CiEdit size={27} />
                  </button>
                  <div className="milestone-view__amount">
                    Amount: {formatAmount(milestone.budget)}
                  </div>
                  <span
                    className={`milestone-view__status ${getStatusClass(
                      milestone.status
                    )}`}
                  >
                    {milestone.status || "Not set"}
                  </span>
                </div>
              </div>

              <h2 className="milestone-view__title">
                {milestone.name || "Milestone name"}
              </h2>

              <div className="milestone-view__details">
                <div className="milestone-view__detail-item">
                  <Calendar className="milestone-view__icon" />
                  <span>Due Date: {formatDate(milestone.dueDate)}</span>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div className="milestone-view__tasks">
              <h3 className="milestone-view__tasks-title">Tasks</h3>
              {milestone.tasks && milestone.tasks.length > 0 ? (
                <ul className="milestone-view__task-list">
                  {milestone.tasks.map((task) => (
                    <li key={task._id} className="milestone-view__task-item">
                      <span className="milestone-view__task-bullet"></span>
                      <span className="milestone-view__task-text">
                        {task?.taskName || "Unnamed Task"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-task-text">No tasks available</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Edit Popup Modal */}
      {showPopup && (
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
          <div className="milestone-container popup-container">
            <div className="milestone-header">
              <span className="milestone-badge">Edit Milestone</span>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="delete-btn"
              >
                ✕
              </button>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Milestone Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Budget Allocation</label>
                <input
                  type="number"
                  name="budget"
                  className="form-input"
                  value={formData.budget}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-group due-date">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="form-input"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="add-milestone-button">
              <button type="button" onClick={handleSave} className="btn-link">
                Update Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MilestoneView.propTypes = {
  projectData: PropTypes.shape({
    milestones: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        name: PropTypes.string,
        budget: PropTypes.number,
        status: PropTypes.string,
        dueDate: PropTypes.string,
        tasks: PropTypes.arrayOf(
          PropTypes.shape({
            _id: PropTypes.string,
            taskName: PropTypes.string,
          })
        ),
      })
    ),
  }),
};

MilestoneView.defaultProps = {
  projectData: { milestones: [] },
};

export default MilestoneView;
