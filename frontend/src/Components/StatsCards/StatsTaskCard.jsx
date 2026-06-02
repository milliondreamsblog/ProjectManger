import './StatsCard.css'
import { useAuth } from '../../context/AuthContext';

const StatsTaskCard = ({allTasks, taskStats, handleChangeTab}) => {

  return (
    <div className='stats-card-container' >

    <div className="time-filter-section">       
    </div>

          <div className="stats-container">
            <div className="stat-card total" onClick={()=> handleChangeTab('all')}>
              <div className="stat-info"  >
                <span className="stat-title">Total Tasks</span>
                <span className="stat-value"> {allTasks?.all?.length} </span>
              </div>
            </div>
            <div className="stat-card due-today" onClick={()=> handleChangeTab('dueToday')}>
              <div className="stat-info">
                <span className="stat-title">Due Today</span>
                <span className="stat-value"> {taskStats?.taskStatus?.dueToday} </span>
              </div>
            </div>
            <div className="stat-card due" onClick={()=> handleChangeTab('dueInWeek')}>
              <div className="stat-info">
                <span className="stat-title">Due This Week</span>
                <span className="stat-value">{taskStats?.taskStatus?.dueInWeek}</span>
              </div>
            </div>
            <div className="stat-card overdue" onClick={()=> handleChangeTab('overdue')}>
              <div className="stat-info">
                <span className="stat-title">Overdue Tasks</span>
                <span className="stat-value">{taskStats?.taskStatus?.overdue}</span>
              </div>
            </div>
            <div className="stat-card completed" onClick={()=> handleChangeTab('completed')} >
              <div className="stat-info">
                <span className="stat-title">Completed Tasks</span>
                <span className="stat-value">{taskStats?.taskStatus?.completed}</span>
              </div>
            </div>
          </div>  
 
    </div>
  )
}

export default StatsTaskCard