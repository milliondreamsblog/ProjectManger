import React, { useEffect, useState } from "react";
import ProjectHeader from "../Components/ProjectTemplates/ProjectHeader";
import ProjectCard from "../Components/ProjectTemplates/ProjectCard";
import "./ProjectTemplates.css";
import axios from "axios";
import { notify } from "../utils/helper";

const projectsData = [
  {
    id: 1,
    title: "PAN Application Body Corporate",
    duration: "11d",
    tasks: [
      {
        id: 101,
        title: "Collection of information & Documents",
        duration: "6d",
        isOpen: false,
        subtasks: [
          {
            id: 1001,
            title: "Collection of Signatory information",
            duration: "2d",
          },
          {
            id: 1002,
            title: "Collection of Signatory information",
            duration: "3d",
          },
          {
            id: 1003,
            title: "Collection of Signatory information",
            duration: "1d",
          },
        ],
      },
      {
        id: 102,
        title: "Preparation of application",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 1004,
            title: "Form preparation",
            duration: "2d",
          },
          {
            id: 1005,
            title: "Document verification",
            duration: "3d",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "PAN Application Body Corporate",
    duration: "9d",
    tasks: [
      {
        id: 201,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2001,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 202,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2002,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 203,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2003,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 204,
        title: "Preparation of application",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2004,
            title: "Form filling",
            duration: "3d",
          },
          {
            id: 2005,
            title: "Review and submission",
            duration: "2d",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "PAN Application Body Corporate",
    duration: "9d",
    tasks: [
      {
        id: 201,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2001,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 202,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2002,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 203,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2003,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 204,
        title: "Preparation of application",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2004,
            title: "Form filling",
            duration: "3d",
          },
          {
            id: 2005,
            title: "Review and submission",
            duration: "2d",
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "PAN Application Body Corporate",
    duration: "9d",
    tasks: [
      {
        id: 201,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2001,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 202,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2002,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 203,
        title: "Collection of information & Documents",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2003,
            title: "Collection of information & Documents",
            duration: "5d",
          },
        ],
      },
      {
        id: 204,
        title: "Preparation of application",
        duration: "5d",
        isOpen: false,
        subtasks: [
          {
            id: 2004,
            title: "Form filling",
            duration: "3d",
          },
          {
            id: 2005,
            title: "Review and submission",
            duration: "2d",
          },
        ],
      },
    ],
  },
];

const ProjectTemplates = () => {
  const [projects, setProjects] = useState(null);

  const handleTaskToggle = (projectId, taskId) => {
    //console.log("projectid and task id", projectId, taskId);
    setProjects((prevProjects) =>
      prevProjects.map((project) => {
        if (project._id === projectId) {
          return {
            ...project,
            tasks: project.tasks.map((task, index) => {
              if (index === taskId) {
                return { ...task, isOpen: !task.isOpen };
              }
              return task;
            }),
          };
        }
        return project;
      })
    );
  };

  const fetchTemplate = async () => {
    //console.log("called...");
    const token = localStorage.getItem("token");
    if (!token) {
      //console.log("No token found, please login again");
      notify("error", "No token found, please login again");
      return;
    }
    try {
      const resp = await axios.get(
        "/api/templates/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      //console.log("fetch template", resp.data);
      setProjects(resp.data);
    } catch (error) {
      //console.log("error in fetching template", error);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, []);

  return (
    <div className="projectTemplate-container">
      <ProjectHeader fetchTemplate={fetchTemplate} />
      <div className="projects-wrapper">
        {projects
          ?.sort((a, b) => {
            if (a.projectName < b.projectName) return -1;
            if (a.projectName > b.projectName) return 1;
            return 0;
          })
          ?.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onTaskToggle={handleTaskToggle}
              fetchTemplate={fetchTemplate}
            />
          ))}
      </div>
    </div>
  );
};

export default ProjectTemplates;
