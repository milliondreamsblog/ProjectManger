import { createRoot } from "react-dom/client";
import "./index.css";
import "./api/axios.js"; // configures global axios baseURL from VITE_API_BASE_URL
import App from "./App.jsx";
import { CalendarProvider } from "./context/CalendarContext.jsx";

createRoot(document.getElementById("root")).render(
  <CalendarProvider>
    <App />
  </CalendarProvider>
);
