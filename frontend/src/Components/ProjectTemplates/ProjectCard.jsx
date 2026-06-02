import './ProjectCard.css'
import TaskItem from './TaskItem'
import ActionMenu from './ActionMenu'
import { useState } from 'react'

const ProjectCard = ({ project, onTaskToggle, fetchTemplate }) => {
  const [showMenu, setShowMenu] = useState(false)
  
  const toggleMenu = () => {
    setShowMenu(!showMenu)
  }

  return (
    <div className="projectTemplates-card">
      <div className="project-card-header">
        <h2 className="project-card-title">{project?.projectName}</h2>
        <div className="project-card-actions">
          <span className="project-duration">{project?.expectedDuration}</span>
          <button className="menu-button" onClick={toggleMenu}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          {showMenu && (
            <ActionMenu 
              onClose={() => setShowMenu(false)} 
              project={project}
              fetchTemplate={fetchTemplate}
              toggleMenu={toggleMenu}
            />
          )}
        </div>
      </div>
      
      <div className="project-card-content">
        {project?.tasks?.map((task, index) => (
          <TaskItem 
            key={index}
            index={index}
            projectId={project._id}
            task={task}
            onTaskToggle={onTaskToggle}
          />
        ))}
      </div>
    </div>
  )
}

export default ProjectCard