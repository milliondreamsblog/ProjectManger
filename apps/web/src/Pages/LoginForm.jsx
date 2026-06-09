import { useEffect, useState } from "react";
import "./LoginForm.css";
import axios from "axios";
import { API_BASE_URL } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    password: "",
    email: "",
  });

  const [token, setToken] = useState();
  const [message, setMessage] = useState("");
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" />;
  }

  const handleLoginWithGoogle = async () => {
    // try {
    //   const response = await axios.get("/api/auth/google"
    //   );
    //   //console.log(response.data);
    //   // window.location.href  = response.data.url;
    // } catch (error) {
    //   console.error("Error during Google login:", error);
    // }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "/api/auth/login",
        formData
      );

      const { token, role, permissions, name, id } = response.data;
      //console.log("token", token, role, name, id);
      login(token, role, permissions, name, id);
      // localStorage.setItem("token", token);
      // localStorage.setItem("role", role);
      // localStorage.setItem("permissions", JSON.stringify(permissions));
      setToken(token);
      setMessage("Login successful!");
      navigate("/");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        <p className="subtitle">
          Enter your credentials to access your account
        </p>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="text"
            id="email"
            name="email"
            placeholder="Enter your Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <a href="/forgot-password" className="forgot-password">
          Forgot Password?
        </a>

        <button type="submit" className="login-button">
          Login
        </button>
        {message && <p>{message}</p>}
        <div className="login-with-google">
          <FcGoogle className="icon" />
          <a href={`${API_BASE_URL}/api/auth/google`}>
            Continue with Google
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
