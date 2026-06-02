import React, { useEffect, useState } from "react";
import "./Managers.css";
import axios from "axios";
import { notify } from "../utils/helper";
import { FaEdit, FaTrash } from "react-icons/fa";
import { MdDeleteForever, MdModeEdit } from "react-icons/md";

function Admin() {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState();
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    team: "Business Advisory",
    location: "Japan",
  });

  const locations = ["Japan", "Gurgaon", "Bangalore", "Mumbai", "Ahmedabad"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const getListOfAdmin = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }

    try {
      const response = await axios.get(
        "/api/auth/get-admin",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAdmins(response.data);
      //console.log("all admins", response.data);
    } catch (error) {
      //console.log("error in fetching admins", error);
    }
  };

  useEffect(() => {
    getListOfAdmin();
  }, []);

  const handleDelete = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }

    try {
      const response = await axios.delete(
        `/api/auth/delete/admin/${adminId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      notify("success", "Admin deleted successfully");
      getListOfAdmin();
    } catch (error) {
      notify("error", error.response?.data?.message || "Error deleting admin");
    }
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      team: admin.team,
      location: admin.location,
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
      const response = await axios.put(
        `/api/auth/edit/admin/${editingAdmin._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      notify("success", "Admin updated successfully");
      setFormData({
        name: "",
        email: "",
        team: "Business Advisory",
        location: "Japan",
      });
      setEditingAdmin(null);
      getListOfAdmin();
      setLoading(false);
    } catch (error) {
      notify("error", error.response?.data?.message || "Error updating admin");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingAdmin) {
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
        "/api/auth/register/admin",
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
        location: "",
      });
      getListOfAdmin();
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
        <h2>{editingAdmin ? "Edit Admin" : "Add New"}</h2>
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
            {/* <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
            /> */}
          </div>
          <button type="submit" disabled={loading} className="add-button">
            {loading
              ? "Loading..."
              : editingAdmin
              ? "Update Admin"
              : "Add Admin"}
          </button>
          {editingAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingAdmin(null);
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
        </form>
      </div>

      <div className="managers-list-section">
        <h2>
          List of Admins{" "}
          <span className="manager-count">({admins?.length})</span>
        </h2>
        <div className="managers-table">
          <div className="table-header">
            <div className="header-cell">Name</div>
            <div className="header-cell">Email</div>
            <div className="header-cell">Team</div>
            <div className="header-cell table-cell-2">Location</div>
            <div className="header-cell table-cell-2">Actions</div>
          </div>
          {admins
            ?.sort((a, b) => {
              if (a.name < b.name) {
                return -1;
              } else if (a.name > b.name) {
                return 1;
              }
              return 0;
            })
            ?.map((admin) => (
              <div className="table-row" key={admin._id}>
                <div className="table-cell">{admin.name}</div>
                <div className="table-cell">{admin.email}</div>
                <div className="table-cell">{admin.team}</div>
                <div className="table-cell table-cell-2">{admin.location}</div>
                <div className="table-cell table-cell-2">
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(admin)}
                      className="edit-button"
                      title="Edit"
                    >
                      <MdModeEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(admin._id)}
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

export default Admin;
