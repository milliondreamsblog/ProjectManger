import React, { useEffect, useRef, useState } from "react";
import "./ActionPopUp.css";
import { MdDeleteForever, MdEdit } from "react-icons/md";
import { HiDotsHorizontal } from "react-icons/hi";
import axios from "axios";
import { notify } from "../../../utils/helper";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";

const TaskActionPopUp = ({
  handleEditTask,
  task,
  fetchTasksAndSubtasks,
  handleOpenPopup,
}) => {
  const [isTaskActionPopUpVisible, setIsTaskActionPopUpVisible] =
    useState(false);

  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsTaskActionPopUpVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleActionPopUp = () => {
    setIsTaskActionPopUpVisible((prev) => !prev);
  };

  const handleOpenComment = () => {
    handleOpenPopup(task);
  };

  const handleCopyTask = async () => {
    if (!window.confirm("Are you sure you want to copy this task?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        //console.log("No token found, please login again");
        return;
      }

      const res = await axios.post(
        `/api/task/copy/${task._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchTasksAndSubtasks();
      notify("success", "Task copied successfully");
    } catch (err) {
      //console.log("error", err);
      notify("error", "Failed to copy task");
    }
  };

  const handleEditIcon = () => {
    setIsTaskActionPopUpVisible(false);
    handleEditTask(task);
  };

  const handleDeleteClick = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) {
      //console.log("No token found, please login again");
      return;
    }

    try {
      await axios.delete(
        `/api/task/delete/${task._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      fetchTasksAndSubtasks();
      notify("success", "Task deleted successfully");
    } catch (error) {
      console.error("Error deleting task:", error);
      notify(
        "error",
        error?.response?.data?.message || "Failed to delete task"
      );
    }
  };

  return (
    <>
      <div className="action-popup-container" ref={wrapperRef}>
        {/* <p className="dots" onClick={handleActionPopUp}>
          <HiDotsHorizontal />
        </p>
        {isTaskActionPopUpVisible && (
          <div className="action-popup-wrapper task-action-popup-wrapper">
            <div className="actions-icon" onClick={handleEditIcon}>
              <MdEdit />
              <p>Edit</p>
            </div>
            <hr />
            <div className="actions-icon" onClick={handleDeleteClick}>
              <MdDeleteForever />
              <p>Delete</p>
            </div>
          </div>
        )} */}
        <div className="action-icons-group">
          <div className="icon-with-tooltip">
            <Eye size={18} className="view-icon" onClick={handleOpenComment} />
            <span className="icon-tooltip">View</span>
          </div>
          <div className="icon-with-tooltip">
            <Copy size={18} className="copy-icon" onClick={handleCopyTask} />
            <span className="icon-tooltip">Copy Task</span>
          </div>
          <div className="icon-with-tooltip">
            <Pencil size={18} className="edit-icon" onClick={handleEditIcon} />
            <span className="icon-tooltip">Edit</span>
          </div>

          <div className="icon-with-tooltip">
            <Trash2
              size={18}
              className="delete-icon"
              onClick={handleDeleteClick}
            />
            <span className="icon-tooltip">Delete</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskActionPopUp;
