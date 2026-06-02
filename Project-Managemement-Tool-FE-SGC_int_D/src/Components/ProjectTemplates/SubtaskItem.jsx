import './SubtaskItem.css'

const SubtaskItem = ({ subtask }) => {
  return (
    <div className="templates-subtask-item">
      <div className="subtask-content">
        <div className="subtask-title">{subtask.name}</div>
        {/* <span className="subtask-duration">{subtask.expectedDuration}</span> */}
      </div>
    </div>
  )
}

export default SubtaskItem