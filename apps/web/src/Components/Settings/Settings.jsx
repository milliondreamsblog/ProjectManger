import { useState, useEffect, useRef } from "react";
import "./Settings.css";
import { notify } from "../../utils/helper";
import { useAuth } from "../../context/AuthContext";
import PropTypes from "prop-types";
import axios from "axios";

const Settings = ({ setIsSettingOpen, onOutsideClick }) => {
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const nestedBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const { fetchProfile, profileData } = useAuth();
  const [roleConfigs, setRoleConfigs] = useState([]);
  const [selectedRoleConfig, setSelectedRoleConfig] = useState(null);

  const [formData, setFormData] = useState({
    fullName: profileData?.name,
    designation: profileData?.role,
    team: profileData?.team,
    email: profileData?.email,
    role: "manager",
    location: profileData?.location,
    roleDescription:
      "Responsible for overseeing project planning and execution",
    permissions: [],
    notifications: {
      activityUpdates: true,
      mentions: true,
    },
    photo: profileData?.profilePicture?.url,
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        nestedBoxRef.current &&
        !nestedBoxRef.current.contains(event.target)
      ) {
        onOutsideClick();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onOutsideClick]);

  const fetchRoles = async () => {
    try {
      const resp = await axios.get(
        "/api/role-config/all",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      //console.log("roles data", resp.data.configurations);
      setRoleConfigs(resp.data.configurations);

      // Set initial selected role config
      if (resp.data.configurations && resp.data.configurations.length > 0) {
        const initialRole = resp.data.configurations.find(
          (config) => config.roleName === formData.role
        );
        if (initialRole) {
          setSelectedRoleConfig(initialRole);
          setFormData((prev) => ({
            ...prev,
            permissions: initialRole.permissions || [],
          }));
        }
      }
    } catch (error) {
      //console.log("error", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchRoles();
  }, []);

  // Update selected role config when role changes
  useEffect(() => {
    if (roleConfigs.length > 0) {
      const config = roleConfigs.find(
        (config) => config.roleName === formData.role
      );
      if (config) {
        setSelectedRoleConfig(config);
        setFormData((prev) => ({
          ...prev,
          permissions: config.permissions || [],
        }));
      }
    }
  }, [formData.role, roleConfigs]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (file) {
      const maxSizeInBytes = 1 * 1024 * 1024;

      if (file.size > maxSizeInBytes) {
        notify("", "image size should be less than 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          photo: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePermissionToggle = (permission) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleNotificationToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  const handleSettingClose = () => {
    setIsSettingOpen(false);
    //console.log("clicked...");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      //console.log("No token found, please login again");
      notify("error", "No token found, please login again");
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Append text fields
      formDataToSend.append("name", formData.fullName);
      // formDataToSend.append('email', formData.email);
      formDataToSend.append("team", formData.team);
      formDataToSend.append("designation", formData.designation);
      formDataToSend.append("location", formData.location);

      // Append profile picture if it's a file
      if (fileInputRef.current?.files?.[0]) {
        formDataToSend.append("profilePicture", fileInputRef.current.files[0]);
      }

      const response = await fetch(
        "/api/auth/update-profile",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Update local state with the response data
      setFormData((prev) => ({
        ...prev,
        fullName: data.user.name,
        email: data.user.email,
        team: data.user.team,
        designation: data.user.designation,
        photo: data.user.profilePicture?.url || prev.photo,
      }));
      fetchProfile();
      notify("success", "Profile updated successfully!");
    } catch (err) {
      console.log(
        err.message || "An error occurred while updating the profile"
      );
      notify("error", "Failed to update profile");
      console.error("Error updating profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/role-config/configure",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            roleName: formData.role,
            permissions: formData.permissions,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update role");
      }

      notify("success", "Role and permissions updated successfully!");
      fetchRoles(); // Refresh role configurations
    } catch (err) {
      console.error("Error updating role:", err);
      notify("error", "Failed to update role and permissions");
      setError(err.message || "An error occurred while updating the role");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="settings-content">
            <h2>Account</h2>
            <div className="close-button" onClick={handleSettingClose}>
              ×
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="form-section">
              <label>Photo</label>
              <div className="photo-section">
                <div className="profile-photo" onClick={handlePhotoClick}>
                  <img src={formData.photo} alt="Profile" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                </div>
                <button
                  className="change-photo-button"
                  onClick={handlePhotoClick}
                >
                  Change photo
                </button>
              </div>

              <div className="form-group">
                <label>Full name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Team</label>
                <input
                  type="text"
                  name="team"
                  style={{ cursor: "no-drop" }}
                  value={formData.team}
                />
                {/* <select name="team" value={formData.team} onChange={handleInputChange}>
                  <option value="R1">R1</option>
                  <option value="R2">R2</option>
                  <option value="Sales">Sales</option>
                </select> */}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  style={{ cursor: "no-drop" }}
                  value={formData.email}
                  // onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="button-group">
              <button
                className="save-button"
                onClick={handleProfileUpdate}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button className="cancel-button" onClick={handleSettingClose}>
                Cancel
              </button>
            </div>
          </div>
        );

      case "role":
        return (
          <div className="settings-content">
            <h2>Role Configuration</h2>
            <div className="close-button" onClick={handleSettingClose}>
              ×
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Role Name</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  {roleConfigs.map((config) => (
                    <option key={config.roleName} value={config.roleName}>
                      {config.roleName.charAt(0).toUpperCase() +
                        config.roleName.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group ">
                <label>Permissions</label>
                <div className="permissions-lists">
                  <div className="permissions-list">
                    {[
                      "create_project",
                      "edit_project",
                      "delete_project",
                      "create_task",
                    ].map((permission) => (
                      <label key={permission} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                        />{" "}
                        &nbsp;
                        <span className="permission-text">{permission}</span>
                      </label>
                    ))}
                  </div>
                  <div className="permissions-list">
                    {[
                      "edit_task",
                      "delete_task",
                      "create_subtask",
                      "delete_subtask",
                    ].map((permission) => (
                      <label key={permission} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => handlePermissionToggle(permission)}
                        />{" "}
                        &nbsp;
                        <span className="permission-text">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="button-group">
              <button
                className="save-button"
                onClick={handleRoleUpdate}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save"}
              </button>
              <button className="cancel-button" onClick={handleSettingClose}>
                Cancel
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-content">
            <h2>Notifications</h2>
            <div className="close-button" onClick={handleSettingClose}>
              ×
            </div>

            <div className="form-section">
              <div className="notification-item">
                <div>
                  <h3>Activity Updates</h3>
                  <p>
                    New tasks assigned to you, @mentions, and completion
                    notifications for tasks and projects.
                  </p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={formData.notifications.activityUpdates}
                    onChange={() => handleNotificationToggle("activityUpdates")}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div>
                  <h3>Mentions</h3>
                  <p>
                    New tasks assigned to you, direct messages, and @mentions.
                  </p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={formData.notifications.mentions}
                    onChange={() => handleNotificationToggle("mentions")}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="button-group">
              <button className="save-button">Save</button>
              <button className="cancel-button" onClick={handleSettingClose}>
                Cancel
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-wrapper" ref={nestedBoxRef}>
        <div className="settings-sidebar">
          <h3>Settings</h3>
          <nav>
            <button
              className={activeSection === "profile" ? "active" : ""}
              onClick={() => setActiveSection("profile")}
            >
              Profile
            </button>
            {profileData?.role === "admin" && (
              <button
                className={activeSection === "role" ? "active" : ""}
                onClick={() => setActiveSection("role")}
              >
                Role Configuration
              </button>
            )}
            <button
              className={activeSection === "notifications" ? "active" : ""}
              onClick={() => setActiveSection("notifications")}
            >
              Notifications
            </button>
          </nav>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

Settings.propTypes = {
  setIsSettingOpen: PropTypes.func.isRequired,
  onOutsideClick: PropTypes.func.isRequired,
};

export default Settings;
