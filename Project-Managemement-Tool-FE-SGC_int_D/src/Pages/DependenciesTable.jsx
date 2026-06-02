import { useEffect, useState } from "react";
import "./DependenciesTable.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const DependenciesTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openTab = searchParams.get("openTab");
  const [activeTab, setActiveTab] = useState(openTab || "All Dependencies");
  const [tasks, setTasks] = useState([]);
  const [taskCounts, setTaskCounts] = useState({
    all: 0,
    pendingDependencies: 0,
  });

  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");

  const navigate = useNavigate();

  const personId = localStorage.getItem("id") || "67d010fde6b6a27d876f40f3";

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, please login again");
        return;
      }

      const resp = await axios.get(
        `/api/task/dependencies/${personId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (resp.data.tasks && resp.data.tasks.length > 0) {
        setTasks(resp.data.tasks);

        const allDependencies = resp.data.tasks.flatMap((task) =>
          task.dependencies.map((dep) => ({ ...dep, taskInfo: task }))
        );

        const counts = {
          all: allDependencies.length,
          pendingDependencies: allDependencies.filter(
            (dep) => dep.status === "Pending"
          ).length,
        };
        setTaskCounts(counts);
      } else {
        setTasks([]);
        setTaskCounts({ all: 0, pendingDependencies: 0 });
      }
    } catch (err) {
      console.log("error in fetching dependencies:", err);
      console.log("Error details:", err.response?.data);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  // ✅ Update dependency status
  const handleStatusChange = async (taskId, depId, userId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        userId: userId,
        status: newStatus,
        depId: depId,
      };

      console.log("Sending payload:", payload);

      const response = await axios.put(
        `/api/task/${taskId}/dependencies/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Status updated successfully:", response.data);

      // Refresh data after updating
      fetchDependencies();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const tabs = [
    { name: "All Dependencies", count: taskCounts.all },
    { name: "Pending dependencies", count: taskCounts.pendingDependencies },
  ];

  const filteredDependencies = () => {
    const allDependencies = tasks.flatMap((task) =>
      task.dependencies.map((dep) => ({
        ...dep,
        taskInfo: task,
      }))
    );

    if (activeTab === "All Dependencies") return allDependencies;
    if (activeTab === "Pending dependencies")
      return allDependencies.filter((dep) => dep.status === "Pending");
    return allDependencies;
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab.name);
    setSearchParams({ openTab: tab.name });
  };

  const sortDependencies = (dependencies) => {
    if (!dependencies) return [];
    let sortedDependencies = [...dependencies];

    sortedDependencies.sort((a, b) => {
      if (sortBy === "dueDate") {
        const dateA = new Date(a.taskInfo.dueDate);
        const dateB = new Date(b.taskInfo.dueDate);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

    return sortedDependencies;
  };

  const statusOptions = [
    { value: "Pending", label: "Pending" },
    { value: "Completed", label: "Completed" },
  ];

  return (
    <div className="projects-table-container">
      <div className="projects-header">
        <h1>Dependencies</h1>
      </div>

      <div>
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              className={`tab ${activeTab === tab.name ? "active" : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        <div className="table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Description</th>
                <th>Assigner</th>
                <th>Current Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const deps = sortDependencies(filteredDependencies());
                return deps.map((dependency, index) => (
                  <tr className="single-project" key={index}>
                    <td
                      style={{
                        maxWidth: "250px",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {dependency.taskInfo.taskName}
                    </td>

                    <td
                      style={{
                        maxWidth: "300px",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {dependency.description}
                    </td>

                    <td>{dependency.personId.name}</td>
                    <td>
                      <span
                        className={`status-badge ${dependency.status
                          .toLowerCase()
                          .replace(" ", "-")}`}
                      >
                        {dependency.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={dependency.status}
                        className="status-dropdown"
                        onChange={(e) =>
                          handleStatusChange(
                            dependency.taskInfo._id,
                            dependency._id,
                            dependency.personId._id,
                            e.target.value
                          )
                        }
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DependenciesTable;
