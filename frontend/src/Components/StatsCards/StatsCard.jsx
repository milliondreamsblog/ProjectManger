import { ChevronDown, Plus } from "lucide-react";
import React, { useEffect, useState } from "react";
import "./StatsCard.css";
import CreateProject from "../CreateProject/CreateProject";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const StatsCard = () => {
  const { projectsStats, fetchProject, user, fetchStatsOfProject } = useAuth();
  const [isCreateProjectVisible, setIsCreateProjectVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatsOfProject();
  }, []);

  const handleOpenCreateProject = () => {
    setIsCreateProjectVisible(true);
  };

  //console.log('this is project stats', projectsStats);

  const handleNavigate = (tab) => {
    // let openTab = 'All';
    navigate(`/project?openTab=${tab}`);
  };

  return (
    <div className="stats-card-container">
      {isCreateProjectVisible && (
        <CreateProject
          fetchProject={fetchProject}
          setIsCreateProjectVisible={setIsCreateProjectVisible}
        />
      )}

      {/* Time Filter */}
      <div className="time-filter-section">
        <div className="dropdown">
          {/* <button className="dropdown-btn" onClick={toggleTimeFilterDropdown}>
                {timeFilter}
                <ChevronDown size={16} />
              </button>
              {showTimeFilterDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => handleTimeFilterSelect('Daily')}>Daily</div>
                  <hr />
                  <div className="dropdown-item" onClick={() => handleTimeFilterSelect('Weekly')}>Weekly</div>
                  <hr />
                  <div className="dropdown-item" onClick={() => handleTimeFilterSelect('Monthly')}>Monthly</div>
                  <hr />
                  <div className="dropdown-item" onClick={() => handleTimeFilterSelect('Yearly')}>Yearly</div>
                </div>
              )} */}
        </div>
        {
          <button className="new-project-btn" onClick={handleOpenCreateProject}>
            <span>Create Project</span>
            <Plus size={16} />
          </button>
        }
      </div>

      {/* Stats Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-info" onClick={() => handleNavigate("All")}>
            <span className="stat-title">Total Projects</span>
            <span className="stat-value"> {projectsStats?.totalProjects} </span>
          </div>
        </div>
        <div
          className="stat-card due-today"
          onClick={() => handleNavigate("Due+Today")}
        >
          <div className="stat-info">
            <span className="stat-title">Due Today</span>
            <span className="stat-value">{projectsStats?.dueToday}</span>
          </div>
        </div>
        <div
          className="stat-card due"
          onClick={() => handleNavigate("Due+This+Week")}
        >
          <div className="stat-info">
            <span className="stat-title">Due This Week</span>
            <span className="stat-value">{projectsStats?.dueThisWeek}</span>
          </div>
        </div>
        <div
          className="stat-card overdue"
          onClick={() => handleNavigate("Overdue")}
        >
          <div className="stat-info">
            <span className="stat-title">Overdue Projects</span>
            <span className="stat-value">{projectsStats?.overdue}</span>
          </div>
        </div>
        <div
          className="stat-card completed"
          onClick={() => handleNavigate("Closed")}
        >
          <div className="stat-info">
            <span className="stat-title">Completed Projects</span>
            <span className="stat-value">
              {projectsStats?.completedProjects}
            </span>
          </div>
        </div>
      </div>

      {isCreateProjectVisible && (
        <CreateProject setIsCreateProjectVisible={setIsCreateProjectVisible} />
      )}
    </div>
  );
};

export default StatsCard;
