import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PublicRoute = () => {
    const { user } = useAuth();

    if (user) {
        return <Navigate to="/" />; 
    }

    return <Outlet />;
};

export default PublicRoute;
