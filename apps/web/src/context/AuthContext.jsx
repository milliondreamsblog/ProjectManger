import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { notify } from "../utils/helper";

// Create Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opics, setOpics] = useState([]);
  const [managers, setManagers] = useState([]);
  const [projectsStats, setProjectStats] = useState();
  const [profileData, setProfileData] = useState();

  const fetchOpics = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }

    try {
      const resp = await axios.get(
        "/api/auth/my-opics",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setOpics(resp.data);
      //console.log("list of opic in auth context", resp.data);
    } catch (error) {
      //console.log("erro in fetching opics", error);
    }
  };

  const fetchManager = async () => {
    if (user.role !== "admin") {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      notify("error", "You need to log in first.");
      return;
    }

    try {
      const resp = await axios.get(
        "/api/auth/my-managers",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      setManagers(resp.data);
      //console.log("list of managers in auth context", resp.data);
    } catch (error) {
      //console.log("erro in fetching managers", error);
    }
  };

  const fetchStatsOfProject = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        //console.log("No token found, please login again");
        return;
      }
      const resp = await axios.get(
        "/api/project/stats",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setProjectStats(resp.data.stats);
      //  //console.log('projects stats: ', resp.data.stats);
    } catch (err) {
      //console.log("error in fetching all stats projects:", err);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // notify("error", "You need to log in first.");
        return;
      }

      const response = await fetch(
        "/api/auth/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      //console.log("user profile data", data.user);
      setProfileData(data.user);
    } catch (err) {
      notify("error", "Error Fetching profile");
      console.error("Error Fetching profile:", err);
    }
  };

  // Load user data from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("name");
    fetchProfile();
    // if(role ==='manager'){
    //     fetchOpics();
    // }
    // else if(role=== 'admin'){
    //     fetchOpics();
    //     fetchManager();
    // }
    const id = localStorage.getItem("id");
    if (token && role && name && id) {
      setUser({ token, role, name, id });
    }
    setLoading(false);
  }, []);

  const login = (token, role, permissions, name, id) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("name", name);
    localStorage.setItem("id", id);
    setUser({ token, role, name, id });
  };

  // Function to log out user
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("id");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
        fetchOpics,
        fetchManager,
        opics,
        managers,
        fetchStatsOfProject,
        projectsStats,
        fetchProfile,
        profileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
