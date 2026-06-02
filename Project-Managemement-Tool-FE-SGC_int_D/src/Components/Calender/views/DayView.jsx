import { format, isToday } from 'date-fns';
import PropTypes from 'prop-types';
import { useCalendar } from '../../../context/CalendarContext';

const DayView = ({ onEditEvent, onAddEvent }) => {
  const { currentDate, getHours, events } = useCalendar();
  
  const hours = getHours();
  
  const getEventPosition = (event) => {
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    
    const top = startTime.getHours() * 60 + startTime.getMinutes();
    const height = (endTime.getHours() * 60 + endTime.getMinutes()) - top;
    
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  };
  
  const getDayEvents = () => {
    const dayStr = format(currentDate, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = format(new Date(event.start), 'yyyy-MM-dd');
      return eventDate === dayStr && !event.allDay;
    });
  };
  
  const getAllDayEvents = () => {
    const dayStr = format(currentDate, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = format(new Date(event.start), 'yyyy-MM-dd');
      return eventDate === dayStr && event.allDay;
    });
  };
  
  const getEventColor = (index) => {
    const colors = ['event-blue', 'event-green', 'event-red', 'event-yellow', 'event-purple'];
    return colors[index % colors.length];
  };

  return (
    <div className="day-view">
      <div className="time-grid">
        <div className="all-day-label">All day</div>
        <div className="all-day-section">
          {getAllDayEvents().map((event, eventIdx) => (
            <div 
              key={event.id} 
              className={`event-item ${getEventColor(eventIdx)}`}
              onClick={() => onEditEvent(event)}
            >
              {event.title}
            </div>
          ))}
        </div>
        
        <div className="time-labels">
          {hours.map(hour => (
            <div key={hour} className="time-label">
              <span>{hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}</span>
            </div>
          ))}
        </div>
        
        <div className="day-column">
          <div className="day-header">
            <div className="day-name">{format(currentDate, 'EEEE')}</div>
            <div className={`day-number ${isToday(currentDate) ? 'today' : ''}`}>
              {format(currentDate, 'd')}
            </div>
          </div>
          
          <div className="time-slots">
            {hours.map(hour => (
              <div 
                key={hour} 
                className="time-slot"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setHours(hour);
                  onAddEvent(newDate);
                }}
              ></div>
            ))}
            
            {getDayEvents().map((event, eventIdx) => {
              const { top, height } = getEventPosition(event);
              return (
                <div 
                  key={event.id} 
                  className={`time-event ${getEventColor(eventIdx)}`}
                  style={{ top, height }}
                  onClick={() => onEditEvent(event)}
                >
                  {event.title}
                </div>
              );
            })}
            
            {isToday(currentDate) && (
              <div 
                className="current-time-indicator" 
                style={{ 
                  top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` 
                }}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

DayView.propTypes = {
  onEditEvent: PropTypes.func.isRequired,
  onAddEvent: PropTypes.func.isRequired
};

export default DayView;