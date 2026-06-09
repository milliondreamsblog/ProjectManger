import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Calendar, Users } from "lucide-react";
import PropTypes from "prop-types";
import "./ChartCard.css";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

export default function DashboardCharts() {
  const { user } = useAuth();

  const [selectedTeam, setSelectedTeam] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [timeframeWorkload, setTimeframeWorkload] = useState("All");
  const [workloadTeamData, setWorkloadTeamData] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [performanceData, setPerformanceData] = useState({
    week: {},
    month: {},
    year: {},
  });
  const [currentPerformanceData, setCurrentPerformanceData] = useState([]);

  const fetchWorkloadData = async () => {
    try {
      const response = await axios.get(
        "/api/task/workload",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setWorkloadData(response.data.workload);
      setWorkloadTeamData(response.data.workload.all);
    } catch (error) {
      //console.log("error", error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await axios.get(
        "/api/task/performance",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setPerformanceData(response.data.performance);
      //console.log("performance data", response.data);
      // Set initial data
      setCurrentPerformanceData(
        response.data.performance[selectedTimeframe][selectedTeam]
      );
    } catch (error) {
      //console.log("error", error);
    }
  };

  useEffect(() => {
    fetchWorkloadData();
    fetchPerformanceData();
  }, []);

  // Update current performance data when filters change
  useEffect(() => {
    if (
      performanceData[selectedTimeframe] &&
      performanceData[selectedTimeframe][selectedTeam]
    ) {
      setCurrentPerformanceData(
        performanceData[selectedTimeframe][selectedTeam]
      );
    }
  }, [selectedTimeframe, selectedTeam, performanceData]);

  const handleTaskWorkload = (e) => {
    setTimeframeWorkload(e.target.value);
    setWorkloadTeamData(workloadData[e.target.value]);
  };

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
  };

  const handleTimeframeChange = (e) => {
    setSelectedTimeframe(e.target.value);
  };

  return (
    <div className="dashboard-grid">
      {/* Performance Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Team Performance</h3>
          <div className="chart-legend">
            {user?.role === "admin" ? (
              <>
                <div className="time-selector">
                  <Users className="calendar-icon" />
                  <select value={selectedTeam} onChange={handleTeamChange}>
                    <option value="all">All Teams</option>
                    <option value="Business Advisory">Business Advisory</option>
                    <option value="Japandesk">Japandesk</option>
                    <option value="Tax Advisory">Tax Advisory</option>
                  </select>
                </div>
                <div className="time-selector">
                  <Calendar className="calendar-icon" />
                  <select
                    value={selectedTimeframe}
                    onChange={handleTimeframeChange}
                  >
                    <option value="week">Day wise</option>
                    <option value="month">Weekly</option>
                    <option value="year">Monthly</option>
                  </select>
                </div>
              </>
            ) : (
              (user?.role === "manager" || user?.role === "opic") && (
                <div className="time-selector">
                  <Calendar className="calendar-icon" />
                  <select
                    value={selectedTimeframe}
                    onChange={handleTimeframeChange}
                  >
                    <option value="week">Day wise</option>
                    <option value="month">Weekly</option>
                    <option value="year">Monthly</option>
                  </select>
                </div>
              )
            )}
          </div>
        </div>

        <div className="chart-legend-2">
          <div className="legend-item">
            <span className="legend-dot target-dot"></span>
            <span className="legend-label">Target</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot achieved-dot"></span>
            <span className="legend-label">Achieved</span>
          </div>
        </div>

        <div className="chart-container">
          <LineChart
            data={currentPerformanceData}
            width={500}
            height={300}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              domain={[0, 12]}
              ticks={[0, 2, 4, 6, 8, 10, 12]}
              dx={-10}
            />
            <Tooltip content={<CustomPerformanceTooltip />} cursor={false} />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#FF8C69"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8, fill: "#FF8C69" }}
            />
            <Line
              type="monotone"
              dataKey="achieved"
              stroke="#4ADE80"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 8, fill: "#4ADE80" }}
            />
          </LineChart>
        </div>
      </div>

      {/* Projects Workload Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Tasks Workload</h3>
          {user?.role === "admin" && (
            <div className="time-selector">
              <Users className="calendar-icon" />
              <select value={timeframeWorkload} onChange={handleTaskWorkload}>
                <option value="all">All Teams</option>
                <option value="Business Advisory">Business Advisory</option>
                <option value="Japandesk">Japandesk</option>
                <option value="Tax Advisory">Tax Advisory</option>
              </select>
            </div>
          )}
        </div>

        <div className="chart-container">
          <BarChart
            data={workloadTeamData}
            width={500}
            height={300}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              domain={[0, 12]}
              ticks={[0, 2, 4, 6, 8, 10, 12]}
              dx={-10}
            />
            <Tooltip content={<CustomWorkloadTooltip />} cursor={false} />
            <Bar
              dataKey="tasks"
              radius={[4, 4, 4, 4]}
              barSize={30}
              fill="#404C93"
            />
          </BarChart>
        </div>
      </div>
    </div>
  );
}

// Custom tooltip for Performance chart
function CustomPerformanceTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="tooltip">
        <div className="tooltip-item">
          <span className="tooltip-dot target-dot"></span>
          <span className="tooltip-text">{payload[0].value} Tasks</span>
        </div>
        <div className="tooltip-item">
          <span className="tooltip-dot achieved-dot"></span>
          <span className="tooltip-text">{payload[1].value} Tasks</span>
        </div>
      </div>
    );
  }
  return null;
}

CustomPerformanceTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
    })
  ),
};

// Custom tooltip for Workload chart
function CustomWorkloadTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="tooltip">
        <div className="tooltip-item">
          <span className="tooltip-text">{payload[0].value} Tasks</span>
        </div>
      </div>
    );
  }
  return null;
}

CustomWorkloadTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number,
    })
  ),
};
