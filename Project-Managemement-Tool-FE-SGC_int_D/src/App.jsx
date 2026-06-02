import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css'
import Dashboard from "./Pages/Dashboard";
import Project from "./Pages/Project";
import Layout from "./Components/NavBar/Layout";
import Calender from "./Pages/Calender";
import Reports from "./Pages/Reports";
import AuditLogs from "./Pages/AuditLogs";
import OperationPic from "./Pages/OperationPic";
import Managers from "./Pages/Managers";
import Error from "./Pages/Error";
import TaskManagement from "./Pages/TaskManagement";
import LoginForm from "./Pages/LoginForm";
import Admin from "./Pages/Admin";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import { AuthProvider} from "./context/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import PublicRoute from "./Components/PublicRoute";
import { Toaster } from 'react-hot-toast';
import TaskAndSubTask from "./Components/Projects/ProjectsTable/TaskAndSubTask";
import OAuth2RedirectHandler from "./Pages/OAuth2RedirectHandler";
import ProjectTemplates from "./Pages/ProjectTemplates";
import Dependencies from "./Components/Dependencies/Dependencies";

const App = () => {

  

    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    
                    <Route element={<PublicRoute />}>
                        <Route path="/login" element={<LoginForm />} />
                        <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                    </Route>

                  <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/project" element={<Project />} />
                        <Route path="project/:id" element={<TaskAndSubTask  />} />
                        <Route path="/task_management" element={<TaskManagement />} />
                        <Route path="/dependencies" element={<Dependencies/>} />
                        <Route path="/calendar" element={<Calender />} />                
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/audit-Logs" element={<AuditLogs />} />
                        <Route path="/Hello" element={<Error />} />

                      {/* only for admin */}
                   <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                        <Route path="/managers" element={<Managers />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/ProjectTemplates" element={<ProjectTemplates />} />
                    </Route>

                    {/* admin and manager */}
                   <Route element={<ProtectedRoute allowedRoles={["admin", "manager"]} />}>
                        <Route path="/operation-PICs" element={<OperationPic />} />
                    </Route>
                    </Route>
                  </Route>
                    
                </Routes>
                <Toaster position="top-right" reverseOrder={false} />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
