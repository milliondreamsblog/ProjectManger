import { useState } from "react";
import "./LoginForm.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { notify } from "../utils/helper";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/auth/forgot-password",
        { email }
      );
      setMessage("Password reset link has been sent to your email");
      notify("success", "Password reset link has been sent to your email");
      setLoading(false);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to send reset link");
      setLoading(false);
      notify(
        "error",
        error.response?.data?.message || "Failed to send reset link"
      );
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Forgot Password</h1>
        <p className="subtitle">
          Enter your email to receive a password reset link
        </p>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {loading ? (
          <button type="submit" className="login-button">
            Sending...
          </button>
        ) : (
          <button type="submit" className="login-button">
            Send Reset Link
          </button>
        )}
        {message && (
          <p
            style={{
              color: message.includes("sent") ? "green" : "red",
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

export default ForgotPassword;
