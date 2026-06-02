import React, { useState } from "react";
import "./Managers.css";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { notify } from "../utils/helper";
import { locations } from "../utils/constant.js";
import { MdDeleteForever, MdModeEdit } from "react-icons/md";

function Managers() {
  const [loading, setLoading] = useState(false);
  const { managers, fetchManager } = useAuth();
  const [editingManager, setEditingManager] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    team: "Business Advisory",
    location: "Japan",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDelete = async (managerId) => {
    if (!window.confirm("Are you sure you want to delete this manager?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }

    try {
      await axios.delete(
        `/api/auth/delete/manager/${managerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", "Manager deleted successfully");
      fetchManager();
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error deleting manager"
      );
    }
  };

  const handleEdit = (manager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email,
      team: manager.team,
      location: manager.location,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }

    try {
      await axios.put(
        `/api/auth/edit/manager/${editingManager._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      notify("success", "Manager updated successfully");
      setFormData({
        name: "",
        email: "",
        team: "Business Advisory",
        location: "Japan",
      });
      setEditingManager(null);
      fetchManager();
      setLoading(false);
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error updating manager"
      );
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingManager) {
      handleUpdate(e);
      return;
    }

    //console.log(formData);
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }
    try {
      const response = await axios.post(
        "/api/auth/create/manager",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", response.data.message);
      setFormData({
        name: "",
        email: "",
        team: "Business Advisory",
        location: "Japan",
      });
      fetchManager();
      setLoading(false);
      //console.log("resp after create manager", response.data.message);
    } catch (error) {
      notify(
        "error",
        error.response?.data?.message || "Error creating manager"
      );
      setLoading(false);
      console.error("Error creating manager:", error.response?.data?.message);
    }
  };

  return (
    <div className="manager-page-container">
      <div className="add-manager-section">
        <h2>{editingManager ? "Edit Manager" : "Add New"}</h2>
        <form onSubmit={handleSubmit} className="add-manager-form">
          <div className="form-group">
            <label htmlFor="name">
              Full Name<span className="require">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">
              Email<span className="require">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="team">Team</label>
            <select
              id="team"
              name="team"
              value={formData.team}
              onChange={handleInputChange}
            >
              <option value="Business Advisory">Business Advisory</option>
              <option value="Japandesk">Japandesk</option>
              <option value="Tax Advisory">Tax Advisory</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
          <div className="button-group">
            <button type="submit" className="add-button" disabled={loading}>
              {loading
                ? "Loading..."
                : editingManager
                ? "Update Manager"
                : "Add Manager"}
            </button>
            {editingManager && (
              <button
                type="button"
                onClick={() => {
                  setEditingManager(null);
                  setFormData({
                    name: "",
                    email: "",
                    team: "Business Advisory",
                    location: "Japan",
                  });
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="managers-list-section">
        <h2>
          List of Managers{" "}
          <span className="manager-count">({managers.length})</span>
        </h2>
        <div className="managers-table">
          <div className="table-header">
            <div className="header-cell">Name</div>
            <div className="header-cell">Email</div>
            <div className="header-cell">Team</div>
            <div className="header-cell table-cell-2">Location</div>
            <div className="header-cell table-cell-2">Actions</div>
          </div>
          {managers
            ?.sort((a, b) => {
              if (a.name < b.name) {
                return -1;
              } else if (a.name > b.name) {
                return 1;
              }
              return 0;
            })
            ?.map((manager) => (
              <div className="table-row" key={manager._id}>
                <div className="table-cell">{manager.name}</div>
                <div className="table-cell">{manager.email}</div>
                <div className="table-cell">{manager.team}</div>
                <div className="table-cell table-cell-2">
                  {manager.location}
                </div>
                <div className="table-cell table-cell-2">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(manager)}
                      className="edit-button"
                      title="Edit"
                    >
                      <MdModeEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(manager._id)}
                      className="delete-button"
                      title="Delete"
                    >
                      <MdDeleteForever />
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Managers;
