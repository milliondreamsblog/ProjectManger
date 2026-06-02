import { useState } from 'react';
import './ProjectHeader.css'
import CreateTemplateModal from './CreateTemplateModal';

const ProjectHeader = ({fetchTemplate}) => {

  const [showModal, setShowModal] = useState(false);

  return (
    <div className="projectTemplate-header">
      <h1 className="project-title">Projects Templates</h1>
      <button className="new-template-button" onClick={() => setShowModal(true)} > 
        <span>New Template</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
      {showModal && <CreateTemplateModal
      fetchTemplate={fetchTemplate}
      onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default ProjectHeader