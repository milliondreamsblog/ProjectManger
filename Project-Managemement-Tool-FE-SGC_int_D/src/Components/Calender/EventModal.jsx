import { useState, useEffect } from "react";
import { format } from "date-fns";
import PropTypes from "prop-types";
import "./EventModal.css";
import { useCalendar } from "../../context/CalendarContext";

const EventModal = ({ onClose, event }) => {
  const { addEvent, updateEvent, deleteEvent } = useCalendar();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [calendar, setCalendar] = useState("My Calendar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (event) {
      const start = new Date(event.start);
      const end = new Date(event.end);

      setTitle(event.title);
      setDescription(event.description || "");
      setStartDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setAllDay(event.allDay || false);
      setCalendar(event.calendar || "My Calendar");
    } else {
      const now = new Date();
      const oneHourLater = new Date(now);
      oneHourLater.setHours(oneHourLater.getHours() + 1);

      setStartDate(format(now, "yyyy-MM-dd"));
      setStartTime(format(now, "HH:mm"));
      setEndTime(format(oneHourLater, "HH:mm"));
    }
  }, [event]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const startDateTime = new Date(`${startDate}T${startTime}`);
    const endDateTime = new Date(`${startDate}T${endTime}`);
    
    const eventData = {
      title,
      description,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      allDay,
      calendar
    };
    
    try {
      if (event) {
        await updateEvent({ ...eventData, id: event.id });
      } else {
        await addEvent(eventData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error.response?.data?.message || 'Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (event) {
      if (!window.confirm('Are you sure you want to delete this event?')) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        await deleteEvent(event.id);
        onClose();
      } catch (error) {
        console.error('Error deleting event:', error);
        setError(error.response?.data?.message || 'Failed to delete event. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event ? "Edit Event" : "Add Event"}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <br />
            <label>Event Title<span className="require" >*</span> </label>
            <input
              type="text"
              placeholder="Add title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="form-control title-input"
              disabled={loading}
            />
          </div>
 
          <div className="form-group form-group-2">
            <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                disabled={loading}
              />
              <p className="checkbox-text" > All day  </p> 
          </div>

          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="form-control"
              disabled={loading}
            />
          </div>

          {!allDay && (
            <div className="form-row">
              <div className="form-group">
                <label>Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="form-control"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>End</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="form-control"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* {!allDay && (
              
            )} */}

          <div className="form-group">
            <select
              value={calendar}
              onChange={(e) => setCalendar(e.target.value)}
              className="form-control"
              disabled={loading}
            >
              <option value="My Calendar">My Calendar</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Birthdays">Birthdays</option>
              <option value="Holidays">Holidays</option>
            </select>
          </div>

          <div className="form-group">
            <textarea
              placeholder="Add description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control"
              rows="3"
              disabled={loading}
            ></textarea>
          </div>

          <div className="modal-footer">
            {event && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </button>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

EventModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  event: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    start: PropTypes.instanceOf(Date),
    end: PropTypes.instanceOf(Date),
    allDay: PropTypes.bool,
    calendar: PropTypes.string,
  }),
};

export default EventModal;
