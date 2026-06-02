import { Bell, MessageCircle, Search } from "lucide-react";
import "./NavBar.css";
import logo from "../../assets/Images/SGC-logo.png";
import NotificationsPanel from "../NotificationsPanel/NotificationsPanel";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Settings from "../Settings/Settings";

function capitalizeFirstLetter(name) {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

const NavBar = () => {
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const { fetchProfile, profileData } = useAuth();
  const [isSettingOpen, setIsSettingOpen] = useState(false);

  const handleNotificationPopup = () => {
    setIsNotificationVisible(!isNotificationVisible);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <header className="navbar-container">
      <div className="navbar-logo">
        <img src={logo} alt="SGC-logo" />
      </div>
      <div className="navbar-content">
        {/* <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search anything..."
            className="search-input"
          />
        </div> */}
        <div className="user-section">
          {/* <MessageCircle size={20} className="notification-icon" /> */}
          {/* <Bell
            size={20}
            className="notification-icon"
            onClick={handleNotificationPopup}
          /> */}
          <div className="user-info" 
          onClick={()=> setIsSettingOpen(true)}
          >
            <div className="user-details">
              <span className="user-name">
                {capitalizeFirstLetter(profileData?.name)}
              </span>
              <span className="user-role">
                {capitalizeFirstLetter(profileData?.role)}
              </span>
            </div>
            {profileData?.profilePicture?.url ? (
              <img
                src={profileData?.profilePicture?.url}
                alt="User"
                className="user-avatar"
              />
            ) : (
              <img
                src="https://i.imgur.com/6VBx3io.png"
                alt="User"
                className="user-avatar"
              />
            )}
          </div>
        </div>
      </div>
      {isSettingOpen && <Settings setIsSettingOpen={setIsSettingOpen} 
       />}
      {isNotificationVisible && <NotificationsPanel />}
    </header>
  );
};

export default NavBar;
