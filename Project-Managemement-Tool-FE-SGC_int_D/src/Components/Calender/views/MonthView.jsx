import { format, isSameMonth, isToday } from 'date-fns';
import { useCalendar } from '../../../context/CalendarContext';

const MonthView = ({ onEditEvent, onAddEvent }) => {
  const { currentDate, getMonthDays, getEventsForDate } = useCalendar();
  
  const days = getMonthDays();
  
  const getEventColor = (index) => {
    const colors = ['event-blue', 'event-green', 'event-red', 'event-yellow', 'event-purple'];
    return colors[index % colors.length];
  };

  return (
    <div className="month-view">
      <div className="calendar-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-name">{day}</div>
        ))}
      </div>
      <div className="calendar-body">
        {days.map((day, index) => {
          const dateEvents = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div 
              key={index} 
              className="calendar-cell"
              onClick={() => onAddEvent(day)}
            >
              <div 
                className={`calendar-date ${isToday(day) ? 'today' : ''} ${!isCurrentMonth ? 'different-month' : ''}`}
              >
                {format(day, 'd')}
              </div>
              <div className="event-list">
                {dateEvents.slice(0, 3).map((event, idx) => (
                  <div 
                    key={event.id} 
                    className={`event-item ${getEventColor(idx)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dateEvents.length > 3 && (
                  <div className="text-muted text-small">
                    + {dateEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;