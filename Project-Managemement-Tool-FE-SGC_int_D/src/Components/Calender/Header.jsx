import { useState } from 'react';
import { format } from 'date-fns';
import './Header.css';
import { useCalendar } from '../../context/CalendarContext';
import { CalendarDays } from 'lucide-react';

const Header = ({ onAddEvent }) => {
  const { 
    currentDate, 
    view, 
    setView, 
    goToToday, 
    prevMonth, 
    nextMonth,
    prevWeek,
    nextWeek,
    prevDay,
    nextDay
  } = useCalendar();
  
  const [showViewOptions, setShowViewOptions] = useState(false);

  const handlePrev = () => {
    if (view === 'month') prevMonth();
    else if (view === 'week') prevWeek();
    else prevDay();
  };

  const handleNext = () => {
    if (view === 'month') nextMonth();
    else if (view === 'week') nextWeek();
    else nextDay();
  };

  const getHeaderTitle = () => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (view === 'week') {
      const weekStart = format(currentDate, 'MMM d');
      return `Week of ${weekStart}`;
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <header className="calender-header-container">
      <div className="header-left">
        <div className="logo">
          <span className="calendar-icon"><CalendarDays size={20} /></span>
          <span className="logo-text">Calendar</span>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={onAddEvent}>Create</button>
          <button className="btn" onClick={goToToday}>Today</button>
          <div className="nav-buttons">
            <button className="btn btn-icon" onClick={handlePrev}>
              &lt;
            </button>
            <button className="btn btn-icon" onClick={handleNext}>
              &gt;
            </button>
          </div>
          <h2 className="current-date">{getHeaderTitle()}</h2>
        </div>
      </div>
      <div className="header-right">
        <div className="view-selector">
          <button 
            className="btn view-selector-button" 
            onClick={() => setShowViewOptions(!showViewOptions)}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
            <span className="dropdown-arrow">▼</span>
          </button>
          {showViewOptions && (
            <div className="view-options">
              {/* <div 
                className={`view-option ${view === 'day' ? 'active' : ''}`}
                onClick={() => {
                  setView('day');
                  setShowViewOptions(false);
                }}
              >
                Day
              </div> */}
              <div 
                className={`view-option ${view === 'week' ? 'active' : ''}`}
                onClick={() => {
                  setView('week');
                  setShowViewOptions(false);
                }}
              >
                Week
              </div>
              <div 
                className={`view-option ${view === 'month' ? 'active' : ''}`}
                onClick={() => {
                  setView('month');
                  setShowViewOptions(false);
                }}
              >
                Month
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;