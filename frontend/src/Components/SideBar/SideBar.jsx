import {
  BarChart2,
  Calendar,
  ClipboardList,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
  Users,
  UserCog,
  ChevronLeft,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import "./SideBar.css";
import { NavLink } from "react-router-dom";
import { useState } from "react";
import Setting from "../Settings/Settings";
import { useAuth } from "../../context/AuthContext";
import { TbAB2 } from "react-icons/tb";
const SideBar = () => {
  const { user, logout } = useAuth();
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [userRole, setUserRole] = useState("manager");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const handleSettingOpen = () => {
    //console.log("clicked...");
    setIsSettingOpen(true);
  };

  const handleOutsideClick = () => {
    // alert("Clicked outside the nested box!");
    setIsSettingOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleExpendCollapseSidebar = () => {
    //console.log("clicked....");
    setIsSidebarVisible((prev) => !prev);
  };

  return (
    //`${isSidebarVisible ? 'sidebar-container' : ''}`
    <div
      className={`${
        isSidebarVisible ? "sidebar-container" : "collapse-sidebase"
      }`}
    >
      <div
        className="sidebar-collapse-btn"
        onClick={handleExpendCollapseSidebar}
      >
        {isSidebarVisible ? (
          <PanelRightOpen size={20} />
        ) : (
          <PanelRightClose size={20} />
        )}
      </div>

      <nav className={isSidebarVisible ? "nav-menu" : "collapse-nav-menu"}>
        <ul>
          <NavLink to="/" className="nav-item">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/project" className="nav-item">
            <FolderKanban size={20} />
            <span>Projects</span>
          </NavLink>

          <NavLink to="/task_management" className="nav-item">
            <FolderKanban size={20} />
            <span>Task</span>
          </NavLink>

          {user?.role === "admin" && (
            <NavLink to="/admin" className="nav-item">
              <UserCog size={20} />
              <span>Admin</span>
            </NavLink>
          )}

          {user?.role === "admin" && (
            <NavLink to="/managers" className="nav-item">
              <UserRound size={20} />
              <span>Managers</span>
            </NavLink>
          )}

          {(user?.role === "admin" || user?.role === "manager") && (
            <NavLink to="/operation-PICs" className="nav-item">
              <Users size={20} />
              <span>Operation PICs</span>
            </NavLink>
          )}

          <NavLink to="/calendar" className="nav-item">
            {/* <NavLink to="/Hello" className="nav-item"> */}
            <Calendar size={20} />
            <span>Calendar</span>
          </NavLink>

          {user?.role === "admin" && (
            <NavLink to="/ProjectTemplates" className="nav-item">
              <UserRound size={20} />
              <span>Project Templates</span>
            </NavLink>
          )}
          <NavLink to="/dependencies" className="nav-item">
            {/* <NavLink to="/Hello" className="nav-item"> */}

            <TbAB2 size={20} />
            <span>Dependencies</span>
          </NavLink>

          <NavLink to="/reports" className="nav-item">
            {/* <NavLink to="/Hello" className="nav-item"> */}

            <BarChart2 size={20} />
            <span>Reports</span>
          </NavLink>

          <NavLink to="/audit-Logs" className="nav-item">
            {/* <NavLink to="/Hello" className="nav-item"> */}

            <ClipboardList size={20} />
            <span>Audit Logs</span>
          </NavLink>
        </ul>
        <ul>
          <li className="nav-item" onClick={handleSettingOpen}>
            <Settings size={20} />
            <span>Settings</span>
          </li>
          <NavLink to="/login" className="nav-item" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </NavLink>
        </ul>
      </nav>
      {isSettingOpen && (
        <Setting
          setIsSettingOpen={setIsSettingOpen}
          onOutsideClick={handleOutsideClick}
        />
      )}
    </div>
  );
};

export default SideBar;
