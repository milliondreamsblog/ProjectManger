import { useState } from "react";
import "./ActionMenu.css";
import axios from "axios";
import { notify } from "../../utils/helper";
import UpdateTemplateModal from "./UpdateTemplateModal";

const ActionMenu = ({ onClose, project, fetchTemplate, toggleMenu }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdateTemplateVisible, setIsUpdateTemplateVisible] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify("error", "No token found, please login again");
        return;
      }

      // TODO: Replace with your update API endpoint
      const response = await axios.put(
        `/api/templates/update/${project._id}`,
        project,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      fetchTemplate();
      onClose();
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error updating project"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  //console.log("project", project);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        notify("error", "No token found, please login again");
        return;
      }

      // TODO: Replace with your delete API endpoint
      const response = await axios.delete(
        `/api/templates/delete/${project?.projectName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      fetchTemplate();
      onClose();
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error deleting project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenUpdateTemplate = () => {
    setIsUpdateTemplateVisible((prev) => !prev);
  };

  return (
    <div className="templates-action-menu">
      {isUpdateTemplateVisible && (
        <UpdateTemplateModal
          onClose={handleOpenUpdateTemplate}
          fetchTemplate={fetchTemplate}
          toggleMenu={toggleMenu}
          project={project}
        />
      )}

      <div className="action-menu-overlay" onClick={onClose}></div>
      <ul className="action-menu-list">
        <li className="action-menu-item">
          <button className="action-button" onClick={handleOpenUpdateTemplate}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Edit</span>
          </button>
        </li>
        <li className="action-menu-item">
          <button className="action-button delete" onClick={handleDelete}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span>Delete</span>
          </button>
        </li>
      </ul>
    </div>

    /* 
    <div className="action-menu">
      <button 
        className="action-button update"
        onClick={handleUpdate}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Update'}
      </button>
      <button 
        className="action-button delete"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
    */
  );
};

export default ActionMenu;
