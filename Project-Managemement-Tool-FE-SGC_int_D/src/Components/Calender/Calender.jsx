import MonthView from './views/MonthView';
import WeekView from './views/WeekView';
import DayView from './views/DayView';
import './Calender.css';
import { useCalendar } from '../../context/CalendarContext';

const Calendar = ({ onEditEvent, onAddEvent }) => {
  const { view } = useCalendar();

  return (
    <div className="calendar-container">
      {view === 'month' && <MonthView onEditEvent={onEditEvent} onAddEvent={onAddEvent} />}
      {view === 'week' && <WeekView onEditEvent={onEditEvent} onAddEvent={onAddEvent} />}
      {view === 'day' && <DayView onEditEvent={onEditEvent} onAddEvent={onAddEvent} />}
    </div>
  );
};

export default Calendar;