import React, { useEffect, useState } from "react";
import "./TaskManagement.css";
import Task from "../Components/TaskManagement/Task";
import axios from "axios";
import StatsTaskCard from "../Components/StatsCards/StatsTaskCard";

const TaskManagement = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [taskStats, setTaskStats] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  // //console.log("all tasks", allTasks);
  // //console.log("task stats", taskStats);

  useEffect(() => {
    const fetchAllTasks = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        //console.log("No token found, please login again");
        return;
      }

      try {
        const response = await axios.get(
          "/api/task/user-tasks",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // //console.log(response.data);
        setAllTasks(response.data.tasks);
        setTaskStats({
          taskStatus: response.data.stats,
          taskCount: response.data.totalTasks,
        });
      } catch (error) {
        //console.log("error in fetching all tasks", error);
      }
    };

    fetchAllTasks();
  }, []);

  const tabs = [
    { name: "All", count: taskStats?.taskCount, value: "all" },
    {
      name: "Due Today",
      count: taskStats?.taskStatus?.dueToday,
      value: "dueToday",
    },
    {
      name: "Due This Week",
      count: taskStats?.taskStatus?.dueInWeek,
      value: "dueInWeek",
    },
    {
      name: "Overdue",
      count: taskStats?.taskStatus?.overdue,
      value: "overdue",
    },
    {
      name: "Completed",
      count: taskStats?.taskStatus?.completed,
      value: "completed",
    },
  ];

  const handleChangeTab = (tab) => {
    setActiveTab(tab);
    //console.log("active tabsss", tab);
  };

  return (
    <div className="task-mgmt-page-container">
      <StatsTaskCard
        handleChangeTab={handleChangeTab}
        allTasks={allTasks}
        taskStats={taskStats}
      />
      <Task
        allTasks={allTasks}
        taskStats={taskStats}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default TaskManagement;
