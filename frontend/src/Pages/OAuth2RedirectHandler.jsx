// OAuth2RedirectHandler.jsx
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuth2RedirectHandler() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const role = params.get("role");
    const name = params.get("name");
    const id = params.get("id");

    if (token) { 
      login(token, role, [], name, id);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [search, login, navigate]);

  return <p>Logging you in…</p>;
}
