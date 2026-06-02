import './TaskItem.css'
import SubtaskItem from './SubtaskItem'

const TaskItem = ({ projectId, task, onTaskToggle, index }) => {
  const handleToggle = () => {
    onTaskToggle(projectId, index)
  }

  return (
    <div className="templates-task-item">
      <div 
        className={`task-header ${task.isOpen ? 'open' : ''}`} 
        onClick={handleToggle}
      >
        <div className="task-title">{task.taskName}</div>
        <div className="task-controls">
          <span className="task-duration">{task.expectedDuration}</span>
          <button className="chevron-button">
            <svg 
              className={`chevron-icon ${task.isOpen ? 'open' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              width="18" 
              height="18" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      
      {task.isOpen && (
        <div className="subtasks-container">
          {task?.subtasks && task?.subtasks?.map((subtask, index) => (
            <SubtaskItem 
              key={index} 
              subtask={subtask} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default TaskItem