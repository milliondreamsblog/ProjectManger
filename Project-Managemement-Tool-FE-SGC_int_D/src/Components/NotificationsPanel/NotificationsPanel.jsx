import { useEffect, useState } from "react";
import "./NotificationsPanel.css";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const NotificationsPanel = () => {
  const [userNotifications, setUserNotifications] = useState([]);

  useEffect(() => {
    const fetchNotification = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        //console.log("No token found, please login again");
        return;
      }
      try {
        const resp = await axios.get(
          "/api/notifications/view",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        //console.log("notifactions data: ", resp.data?.notifications);
        setUserNotifications(resp.data?.notifications);
      } catch (error) {
        //console.log("error in fetching notifications", error);
      }
    };

    fetchNotification();
  }, []);

  return (
    <div className="notifications-panel-container">
      <div className="notifications-header">
        <span>Notifications</span>
        <button className="mark-read-button">
          Mark all as read <span className="checkmark">✓</span>
        </button>
      </div>

      <div className="notification-list">
        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">Lex Murphy</span> requested access to{" "}
              <span className="bold-text">UNIX directory tree hierarchy</span>
            </div>
            <div className="notification-actions">
              <button className="action-button approve">Approve</button>
              <button className="action-button decline">Decline</button>
            </div>
            <div className="notification-time">Today at 9:42 AM</div>
          </div>
        </div>

        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">John Hammond</span> attached a file to{" "}
              <span className="bold-text">
                Isla Nublar SOC2 compliance report
              </span>
            </div>
            <div className="file-attachment">
              <span className="file-icon">📄</span>
              <span className="file-name">EY_review.pdf</span>
              <span className="file-size">2mb</span>
            </div>
            <div className="notification-time">Last Wednesday at 9:42 AM</div>
          </div>
        </div>

        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">Denise Nedry</span> commented on{" "}
              <span className="bold-text">
                Isla Nublar SOC2 compliance report
              </span>
            </div>
            <div className="comment-preview">
              <div className="comment-line"></div>
              <div className="comment-text">"Showing error"</div>
            </div>
            <div className="notification-time">Last Wednesday at 9:42 AM</div>
          </div>
        </div>

        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">Ray Arnold</span> left 6 comments on{" "}
              <span className="bold-text">
                Isla Nublar SOC2 compliance report
              </span>
            </div>
            <div className="notification-time">Last Wednesday at 9:42 AM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;

/* 
 <div className="notification-list">
        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">Lex Murphy</span> requested access to{" "}
              <span className="bold-text">UNIX directory tree hierarchy</span>
            </div>
            <div className="notification-actions">
              <button className="action-button approve">Approve</button>
              <button className="action-button decline">Decline</button>
            </div>
            <div className="notification-time">Today at 9:42 AM</div>
          </div>
        </div>

        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">John Hammond</span> attached a file to{" "}
              <span className="bold-text">Isla Nublar SOC2 compliance report</span>
            </div>
            <div className="file-attachment">
              <span className="file-icon">📄</span>
              <span className="file-name">EY_review.pdf</span>
              <span className="file-size">2mb</span>
            </div>
            <div className="notification-time">Last Wednesday at 9:42 AM</div>
          </div>
        </div>

        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">Denise Nedry</span> commented on{" "}
              <span className="bold-text">Isla Nublar SOC2 compliance report</span>
            </div>
            <div className="comment-preview">
              <div className="comment-line"></div>
              <div className="comment-text">"Showing error"</div>
            </div>
            <div className="notification-time">Last Wednesday at 9:42 AM</div>
          </div>
        </div>

        <div className="notification-item">
          <div className="avatar"></div>
          <div className="notification-content">
            <div className="notification-text">
              <span className="user-name">Ray Arnold</span> left 6 comments on{" "}
              <span className="bold-text">Isla Nublar SOC2 compliance report</span>
            </div>
            <div className="notification-time">Last Wednesday at 9:42 AM</div>
          </div>
        </div>
      </div>
*/
