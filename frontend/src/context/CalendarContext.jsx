import React, { createContext, useContext, useEffect, useState } from "react";

const CalendarContext = createContext();
export const useCalendar = () => useContext(CalendarContext);

export const CalendarProvider = ({ children }) => {
  const [events, setEventsState] = useState([]);

  // Load events from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem("calendarEvents");
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.forEach((e) => {
        e.start = new Date(e.start);
        e.end = new Date(e.end);
      });
      setEventsState(parsed);
    }
  }, []);

  // Save events to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  const setEvents = (newEvents) => setEventsState(newEvents);
  const addEvent = (event) => setEventsState((prev) => [...prev, event]);

  return (
    <CalendarContext.Provider value={{ events, setEvents, addEvent }}>
      {children}
    </CalendarContext.Provider>
  );
};
