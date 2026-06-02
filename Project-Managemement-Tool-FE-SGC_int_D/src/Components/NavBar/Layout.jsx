import { Outlet } from "react-router-dom";
import SideBar from "../SideBar/SideBar";
import NavBar from "./NavBar";
import { useEffect, useState } from "react";
import Pusher from "pusher-js";

import { useAuth } from "../../context/AuthContext";

const Layout = () => {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    // Initialize Pusher
    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER || "ap2", // Use the cluster from your Pusher app
    });

    // Subscribe to the user's channel
    const channel = pusher.subscribe(`user-${user.id}`); // Replace with the actual user ID

    // Listen for the 'new-notification' event
    channel.bind("new-notification", (data) => {
      //console.log("New notification received: ", data);
      // //console.log("New notification received:", data.message);

      // Update the state with the new notification
      setNotifications((prevNotifications) => [...prevNotifications, data]);
    });

    return () => {
      // Cleanup when the component unmounts
      pusher.unsubscribe("user-67e3a0295a7adcd1fa91011c");
    };
  }, []);

  //console.log('notifications', notifications);

  return (
    <>
      <NavBar />
      <div style={{ display: "flex" }}>
        <SideBar />
        <Outlet />
      </div>
    </>
  );
};

export default Layout;
