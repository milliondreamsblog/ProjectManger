import { useEffect, useState } from "react";
import "./AuditLogs.css";
import { convertToIST, notify } from "../utils/helper";
import axios from "axios";
/*  
{
      id: 1,
      member: 'Aman Singh',
      action: 'Created a new project',
      projectCode: 'RTN00001',
      timestamp: '2025-01-03 10:30:00'
    },
    {
      id: 2,
      member: 'Aman Singh',
      action: 'Generated report',
      projectCode: 'RTN00001',
      timestamp: '2025-01-03 10:30:00'
    }
*/

// function extractId(text) {
//   const match = text.match(/ID:\s*(\d+)/i); // Matches "ID:" followed by numbers
//   return match ? match[1] : null; // Returns the number or null if not found
// }

function extractTextAfterId(text) {
  const match = text.match(/ID:\s*(.+)/i); // Matches "ID:" followed by any text
  return match ? match[1].trim() : null; // Returns the extracted text, trimming extra spaces
}

function AuditLogs() {
  const [activities, setActivities] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [dropdown, setDropdown] = useState("");
  const [filteredActivitie, setFilteredActivities] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        notify("error", "You need to log in first.");
        return;
      }
      try {
        const response = await axios.get(
          "/api/audit/view-logs",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setActivities(response.data.auditLogs);
        setFilteredActivities(response.data.auditLogs);
        //console.log(response.data.auditLogs);
      } catch (err) {
        //console.log("Error fetching audit logs", err);
      }
    };

    fetchLogs();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredActivities = filteredActivitie.filter((activity) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (activity?.userId?.name || "").toLowerCase().includes(searchLower) ||
      activity.action.toLowerCase().includes(searchLower) ||
      (extractTextAfterId(activity?.additionalInfo) || "")
        .toLowerCase()
        .includes(searchLower) ||
      convertToIST(activity.timestamp).toLowerCase().includes(searchLower)
    );
  });

  const handleRefresh = () => {
    //console.log("Refreshing activities...");
    setSearchTerm("");
  };
  const handleSelectionChange = (event) => {
    setDropdown(event.target.value);
    const filteredActivities = filterTasks(event.target.value); // Filter the activities
    setFilteredActivities(filteredActivities);
  };
  const filterTasks = (selectedFilter) => {
    const now = new Date();
    const tomorrow = new Date();

    return activities.filter((task) => {
      const taskDate = new Date(task.createdAt);
      switch (selectedFilter) {
        case "Today":
          return taskDate.toDateString() === now.toDateString();
        case "Yesterday":
          tomorrow.setDate(now.getDate() - 1);
          return taskDate.toDateString() === tomorrow.toDateString();
        case "Month":
          return (
            taskDate.getMonth() === now.getMonth() &&
            taskDate.getFullYear() === now.getFullYear()
          );
        default:
          return true;
      }
    });
  };

  return (
    <div className="activities-container">
      <div className="activities-header">
        <div className="date-selector">
          <button className="date-button">
            {/* <span>Today</span> */}
            <select
              style={{ border: "none", background: "none" }}
              value={dropdown}
              onChange={handleSelectionChange}
            >
              <option value="" selected>
                Select a Time
              </option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="Month">This Month</option>
            </select>
            <svg
              style={{ display: "none" }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="activities-content">
        <h2>Activities</h2>

        <div className="search-bar">
          <div className="search-input-container">
            <svg
              className="search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search logs"
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
          </div>
          <button className="refresh-button" onClick={handleRefresh}>
            Refresh
          </button>
        </div>

        <div className="activities-table">
          <div className="table-header">
            <div className="header-cell member-cell">Member</div>
            <div className="header-cell action-cell">Action</div>
            <div className="header-cell project-cell">Project Code</div>
            <div className="header-cell timestamp-cell">Timestamp</div>
          </div>

          <div className="table-body">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <div className="table-row" key={activity._id}>
                  <div className="table-cell member-cell">
                    {activity?.userId?.name}
                  </div>
                  <div className="table-cell action-cell">
                    {activity.action}
                  </div>
                  <div className="table-cell project-cell">
                    {extractTextAfterId(activity?.additionalInfo)}
                  </div>
                  <div className="table-cell timestamp-cell">
                    {convertToIST(activity.timestamp)}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                {activities.length === 0
                  ? "No audit logs available"
                  : "No matching results found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
