import { format, isToday } from 'date-fns';
import { useCalendar } from '../../../context/CalendarContext';

const WeekView = ({ onEditEvent, onAddEvent }) => {
  const { getWeekDays, getHours, events } = useCalendar();
  
  const weekDays = getWeekDays();
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
  
  const getEventsByDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter(event => {
      const eventDate = format(new Date(event.start), 'yyyy-MM-dd');
      return eventDate === dayStr && !event.allDay;
    });
  };
  
  const getAllDayEvents = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
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
    <div className="week-view">
      <div className="time-grid">
        <div className="all-day-label">All day</div>
        <div className="all-day-events" style={{ display: 'grid', gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}>
          {weekDays.map((day, idx) => (
            <div key={idx} className="all-day-section">
              {getAllDayEvents(day).map((event, eventIdx) => (
                <div 
                  key={event.id} 
                  className={`event-item ${getEventColor(eventIdx)}`}
                  onClick={() => onEditEvent(event)}
                >
                  {event.title}
                </div>
              ))}
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
        
        <div className="day-columns" style={{ display: 'grid', gridTemplateColumns: `repeat(${weekDays.length}, 1fr)` }}>
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="day-column">
              <div className="day-header">
                <div className="day-name">{format(day, 'EEE')}</div>
                <div className={`day-number ${isToday(day) ? 'today' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
              
              <div className="time-slots">
                {hours.map(hour => (
                  <div 
                    key={hour} 
                    className="time-slot"
                    onClick={() => {
                      const newDate = new Date(day);
                      newDate.setHours(hour);
                      onAddEvent(newDate);
                    }}
                  ></div>
                ))}
                
                {getEventsByDay(day).map((event, eventIdx) => {
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
                
                {isToday(day) && (
                  <div 
                    className="current-time-indicator" 
                    style={{ 
                      top: `${new Date().getHours() * 60 + new Date().getMinutes()}px` 
                    }}
                  ></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;