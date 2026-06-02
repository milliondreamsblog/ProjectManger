import React, { useState, useEffect } from "react";
import "./TaskAlertPanel.css";
import axios from "axios";
import {
  timeAgo,
  getRelativeDay,
  capitalizeFirstLetter,
} from "../../utils/helper";
function TaskAlertPanel() {
  const [notificationAlerts, setNotificationAlerts] = useState();
  const [dueTasks, setDueTasks] = useState();

  const fetchNotifications = async () => {
    try {
      const resp = await axios.get(
        "/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      //console.log("notifications on dashboard: ", resp.data.notifications);
      setNotificationAlerts(resp.data.notifications);
    } catch (err) {
      //console.log("error in fetching notifications: ", err);
    }
  };

  const fetchDueTasks = async () => {
    try {
      const resp = await axios.get(
        "/api/task/due-tasks",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      //console.log("due tasks on dashboard: ", resp.data.dueTasks);
      setDueTasks(resp.data.dueTasks);
    } catch (err) {
      //console.log("error in fetching due task: ", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchDueTasks();
  }, []);

  return (
    <div className="task-alert-panel-container">
      <div className="dashboard-card">
        <div className="card-header">
          <div className="icon-title">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 7h16M4 12h16M4 17h10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <h2>Task List</h2>
          </div>
        </div>
        <div className="card-content">
          {/* , ...dueTasks?.dueToday, ...dueTasks?.dueInWeek, ...dueTasks?.overdue, */}
          {dueTasks &&
            [...dueTasks?.allDueTasks]
              ?.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
              ?.map((task) => (
                <div className="task-item" key={task._id}>
                  <div className="task-info">
                    <h3>
                      {task?.taskName}: {task?.assignee?.name}{" "}
                    </h3>
                    <p>
                      {task.department} Task due:{" "}
                      {getRelativeDay(task?.dueDate)}
                    </p>
                  </div>
                  <div
                    className={`task-status today
                  ${task?.teamStatus?.toLowerCase().replace(" ", "-")}`}
                  >
                    {task?.teamStatus}
                  </div>
                </div>
              ))}
        </div>
      </div>

      <div className="dashboard-card">
        <div className="card-header">
          <div className="icon-title">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2>Project Alerts</h2>
          </div>
        </div>
        <div className="card-content">
          {notificationAlerts &&
            notificationAlerts?.map((alert) => (
              <div className="alert-item" key={alert?._id}>
                <div className="alert-info">
                  <h3>{alert?.message}</h3>
                  <p>{timeAgo(alert?.createdAt)}</p>
                </div>
                <div className={`alert-priority ${alert?.type} `}>
                  {capitalizeFirstLetter(alert?.type)}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default TaskAlertPanel;
