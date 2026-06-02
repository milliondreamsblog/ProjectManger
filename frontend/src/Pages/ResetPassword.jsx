import { useState } from "react";
import "./LoginForm.css";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { notify } from "../utils/helper";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      notify("error", "Passwords do not match");
      return;
    }

    try {
      // Get token from URL
      const token = new URLSearchParams(location.search).get("token");
      if (!token) {
        setMessage("Invalid reset link");
        notify("error", "Invalid reset link");
        return;
      }

      const response = await axios.post(
        "/api/auth/reset-password",
        {
          token,
          newPassword: formData.newPassword,
        }
      );

      setMessage("Password has been reset successfully");
      notify("success", "Password has been reset successfully");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to reset password");
      notify(
        "error",
        error.response?.data?.message || "Failed to reset password"
      );
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Reset Password</h1>
        <p className="subtitle">Enter your new password</p>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm new password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="login-button">
          Reset Password
        </button>
        {message && (
          <p
            style={{
              color: message.includes("successfully") ? "green" : "red",
              marginTop: "10px",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default ResetPassword;
