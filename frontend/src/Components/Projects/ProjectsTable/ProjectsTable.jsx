import { useEffect, useState } from "react";
import "./ProjectsTable.css";
import CreateProject from "../../CreateProject/CreateProject";
import TaskAndSubTask from "./TaskAndSubTask";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { formatCompletionDate, formatDate } from "../../../utils/helper";
import ActionPopUp from "./ActionPopUp";
import UpdateProject from "../../CreateProject/UpdateProject";
import { useSearchParams } from "react-router-dom";
import { FaAngleDown } from "react-icons/fa6";
import { IoMdInformationCircleOutline } from "react-icons/io";

const ProjectsTable = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const openTab = searchParams.get("openTab");
  const [activeTab, setActiveTab] = useState(openTab || "All");

  const [isCreateProjectVisible, setIsCreateProjectVisible] = useState(false);
  const [isUpdateProjectVisible, setIsUpdateProjectVisible] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectEditData, setProjectEditData] = useState();
  const [projectCounts, setProjectCounts] = useState({
    all: 0,
    pending: 0,
    inprogress: 0,
    closed: 0,
    overdue: 0,
    dueToday: 0,
    dueThisWeek: 0,
  });

  // ✅ New States for milestone data
  const [milestoneData, setMilestoneData] = useState({});
  const [loadingMilestones, setLoadingMilestones] = useState({});

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("startDate");
  const [sortOrder, setSortOrder] = useState("asc");

  const navigate = useNavigate();

  // ✅ Fetch milestone data for a specific project
  const fetchMilestoneData = async (projectId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingMilestones((prev) => ({ ...prev, [projectId]: true }));
      const milestoneResp = await axios.get(
        `/api/project/milestones/${projectId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMilestoneData((prev) => ({
        ...prev,
        [projectId]: milestoneResp.data,
      }));
    } catch (err) {
      console.warn(`Milestones fetch failed for project ${projectId}`);
    } finally {
      setLoadingMilestones((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // ✅ Fetch all projects
  const fetchProject = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const resp = await axios.get(
        "/api/project/view",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjects(resp.data);

      // Calculate counts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDay = today.getDay();
      const startOfWeek = new Date(today);
      const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
      startOfWeek.setDate(today.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const overdueProjects = resp.data.filter((project) => {
        const endDate = new Date(project.endDate);
        endDate.setHours(0, 0, 0, 0);
        return project.status !== "Completed" && endDate < today;
      });

      const dueTodayProjects = resp.data.filter((project) => {
        const endDate = new Date(project.endDate);
        endDate.setHours(0, 0, 0, 0);
        return (
          project.status !== "Completed" &&
          endDate.getTime() === today.getTime()
        );
      });

      const dueThisWeekProjects = resp.data.filter((project) => {
        const endDate = new Date(project.endDate);
        endDate.setHours(0, 0, 0, 0);
        return (
          project.status !== "Completed" &&
          endDate >= today &&
          endDate >= startOfWeek &&
          endDate <= endOfWeek
        );
      });

      const counts = {
        all: resp.data.length,
        pending: resp.data.filter(
          (project) =>
            project.status === "Pending" && !overdueProjects.includes(project)
        ).length,
        closed: resp.data.filter((project) => project.status === "Completed")
          .length,
        inprogress: resp.data.filter(
          (project) => project.status === "In Progress"
        ).length,
        overdue: overdueProjects.length,
        dueToday: dueTodayProjects.length,
        dueThisWeek: dueThisWeekProjects.length,
      };
      setProjectCounts(counts);

      // ✅ Fetch milestone data for each project
      resp.data.forEach((proj) => {
        fetchMilestoneData(proj._id);
      });
    } catch (err) {
      console.log("Error fetching projects:", err);
    }
  };

  useEffect(() => {
    fetchProject();
  }, []);

  const tabs = [
    { name: "All", count: projectCounts.all },
    { name: "In Progress", count: projectCounts.inprogress },
    { name: "Due Today", count: projectCounts.dueToday },
    { name: "Due This Week", count: projectCounts.dueThisWeek },
    { name: "Overdue", count: projectCounts.overdue },
    { name: "Closed", count: projectCounts.closed },
  ];

  const filteredProjects = projects.filter((project) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(project.endDate);
    endDate.setHours(0, 0, 0, 0);
    const isOverdue = project.status !== "Completed" && endDate < today;
    const isDueToday =
      project.status !== "Completed" && endDate.getTime() === today.getTime();

    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const isDueThisWeek =
      project.status !== "Completed" &&
      endDate >= today &&
      endDate >= startOfWeek &&
      endDate <= endOfWeek;

    if (activeTab === "All") return true;
    if (activeTab === "Pending")
      return project.status === "Pending" && !isOverdue;
    if (activeTab === "Closed") return project.status === "Completed";
    if (activeTab === "In Progress") return project.status === "In Progress";
    if (activeTab === "Overdue") return isOverdue;
    if (activeTab === "Due Today") return isDueToday;
    if (activeTab === "Due This Week") return isDueThisWeek;
    return true;
  });

  const handleNewProject = () => {
    setIsCreateProjectVisible(true);
  };

  const handleEditProject = (proj) => {
    setProjectEditData(proj);
    setIsUpdateProjectVisible(true);
  };

  const handleNavigateToTask = (id) => {
    navigate(`/project/${id}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab.name);
    setSearchParams({ openTab: tab.name });
  };

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(type);
      setSortOrder("asc");
    }
    setIsFilterOpen(false);
  };

  const sortProjects = (projects) => {
    if (!projects) return [];
    let sortedProjects = [...projects];
    sortedProjects.sort((a, b) => {
      if (sortBy === "startDate") {
        const dateA = new Date(a.startDate);
        const dateB = new Date(b.startDate);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "targetDate") {
        const dateA = new Date(a.endDate);
        const dateB = new Date(b.endDate);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortBy === "completionDate") {
        const dateA = new Date(a.completionDate || 0);
        const dateB = new Date(b.completionDate || 0);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
    return sortedProjects;
  };

  const calculateProjectDuration = (project) => {
    const startDate = new Date(project.startDate);
    const endDate =
      project.status === "Completed"
        ? new Date(project.completionDate)
        : new Date();
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="projects-table-container">
      {isCreateProjectVisible && (
        <CreateProject
          fetchProject={fetchProject}
          setIsCreateProjectVisible={setIsCreateProjectVisible}
        />
      )}

      {isUpdateProjectVisible && (
        <UpdateProject
          fetchProject={fetchProject}
          projectEditData={projectEditData}
          setIsUpdateProjectVisible={setIsUpdateProjectVisible}
        />
      )}

      <div className="projects-header">
        <h1>Projects</h1>
        <button className="new-project-button" onClick={handleNewProject}>
          New Project +
        </button>
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
          <div className="filter-dropdown">
            <button
              className={`filter-button ${isFilterOpen ? "active" : ""}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <span className="filter-icon">⚙</span> Filter{" "}
              <span className="dropdown-arrow">
                <FaAngleDown />
              </span>
            </button>
            {isFilterOpen && (
              <div className="dropdown-menu">
                <div
                  className={`dropdown-item ${
                    sortBy === "startDate" ? "active" : ""
                  }`}
                  onClick={() => handleSort("startDate")}
                >
                  Start Date{" "}
                  {sortBy === "startDate" && (sortOrder === "asc" ? "↑" : "↓")}
                </div>
                <div
                  className={`dropdown-item ${
                    sortBy === "targetDate" ? "active" : ""
                  }`}
                  onClick={() => handleSort("targetDate")}
                >
                  Target Date{" "}
                  {sortBy === "targetDate" && (sortOrder === "asc" ? "↑" : "↓")}
                </div>
                <div
                  className={`dropdown-item ${
                    sortBy === "completionDate" ? "active" : ""
                  }`}
                  onClick={() => handleSort("completionDate")}
                >
                  Completion Date{" "}
                  {sortBy === "completionDate" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Project Type</th>
                <th>Owner</th>
                <th>Total Budget</th>
                <th>Remaining</th>
                <th>Milestones</th>
                <th>Start Date</th>
                <th>Due Date</th>
                <th>Completion Date</th>
                <th>Project Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortProjects(filteredProjects).map((project, index) => (
                <tr className="single-project" key={index}>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {project?.projectName}
                  </td>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {project.projectType}
                  </td>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {project?.owner ? (
                      <div className="assignee">
                        <div className="avatar">
                          {project?.owner?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>{" "}
                        {project?.owner?.name}
                      </div>
                    ) : (
                      ""
                    )}
                  </td>
                  {/* ✅ Milestone API Data */}
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {/* ✅ Show Total Budget from Project Schema */}$
                    {project?.totalBudget?.toLocaleString() || 0}
                  </td>

                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {loadingMilestones[project._id]
                      ? "Loading..."
                      : `$${(
                          (project?.totalBudget || 0) -
                          (milestoneData[project._id]?.remainingBudget || 0)
                        ).toLocaleString()}`}
                  </td>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {loadingMilestones[project._id]
                      ? "Loading..."
                      : `${milestoneData[project._id]?.completed || 0}/${
                          milestoneData[project._id]?.total || 0
                        }`}
                    <IoMdInformationCircleOutline
                      size={16}
                      style={{
                        marginLeft: "5px",
                        marginTop: "1px",
                        color:
                          milestoneData[project._id]?.completed ===
                          milestoneData[project._id]?.total
                            ? "green"
                            : "red",
                      }}
                    />
                    <p>Completed</p>
                  </td>

                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {formatDate(project.startDate)}
                  </td>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {formatDate(project.endDate)}
                  </td>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {formatCompletionDate(project?.completionDate)}
                  </td>
                  <td onClick={() => handleNavigateToTask(project._id)}>
                    {calculateProjectDuration(project)} days
                  </td>
                  <td>
                    <span
                      className={`status-badge ${project.status.toLowerCase()}`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td>
                    <ActionPopUp
                      fetchProject={fetchProject}
                      handleEditProject={handleEditProject}
                      project={project}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeTab === "All" && (
          <button className="add-project-button" onClick={handleNewProject}>
            + Add Project
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectsTable;
