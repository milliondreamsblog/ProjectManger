import React, { useState } from "react";
import ReactFlow, { Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
// import "./styles.css";

// const mockData = {
//   id: "1",
//   name: "Project Name",
//   owner: "Owner Name",
//   tasks: [
//     {
//       id: "task1",
//       name: "Task 1",
//       team: "Team A",
//       subtasks: [
//         { id: "subtask1-1", name: "Subtask 1.1", poc: "POC A" },
//         { id: "subtask1-2", name: "Subtask 1.2", poc: "POC B" }
//       ]
//     },
//     {
//       id: "task2",
//       name: "Task 2",
//       team: "Team B",
//       subtasks: [
//         { id: "subtask2-1", name: "Subtask 2.1", poc: "POC C" },
//         { id: "subtask2-2", name: "Subtask 2.2", poc: "POC D" },
//         { id: "subtask2-3", name: "Subtask 2.3", poc: "POC E" }
//       ]
//     },
//     {
//       id: "task3",
//       name: "Task 3",
//       team: "Team C",
//       subtasks: []
//     },
//     {
//       id: "task4",
//       name: "Task 4",
//       team: "Team D",
//       subtasks: [
//         { id: "subtask4-1", name: "Subtask 4.1", poc: "POC F" },
//         { id: "subtask4-2", name: "Subtask 4.2", poc: "POC G" },
//         { id: "subtask4-3", name: "Subtask 4.3", poc: "POC H" },
//         { id: "subtask4-4", name: "Subtask 4.4", poc: "POC I" }
//       ]
//     },
//     {
//       id: "task5",
//       name: "Task 5",
//       team: "Team E",
//       subtasks: [
//         { id: "subtask5-1", name: "Subtask 5.1", poc: "POC J",
//          },
//         { id: "subtask5-2", name: "Subtask 5.2", poc: "POC K" }
//       ]
//     }
//   ]
// };

const mockData = {
  id: "1",
  name: "Project Name",
  owner: "Owner Name",
  tasks: [
    {
      id: "task1",
      name: "Task 1",
      team: "Team A",
      subtasks: [
        {
          id: "subtask1-1",
          name: "Subtask 1.1",
          poc: "POC A",
          subtasks: [
            { id: "subtask1-1-1", name: "Subtask 1.1.1", poc: "POC A1" },
            { id: "subtask1-1-2", name: "Subtask 1.1.2", poc: "POC A2" }
          ]
        },
        {
          id: "subtask1-2",
          name: "Subtask 1.2",
          poc: "POC B",
          subtasks: []
        }
      ]
    },
    {
      id: "task2",
      name: "Task 2",
      team: "Team B",
      subtasks: [
        {
          id: "subtask2-1",
          name: "Subtask 2.1",
          poc: "POC C",
          subtasks: [
            { id: "subtask2-1-1", name: "Subtask 2.1.1", poc: "POC C1" }
          ]
        },
        {
          id: "subtask2-2",
          name: "Subtask 2.2",
          poc: "POC D",
          subtasks: [
            { id: "subtask2-2-1", name: "Subtask 2.2.1", poc: "POC D1" },
            { id: "subtask2-2-2", name: "Subtask 2.2.2", poc: "POC D2" }
          ]
        }
      ]
    },
    {
      id: "task3",
      name: "Task 3",
      team: "Team C",
      subtasks: []
    },
    {
      id: "task4",
      name: "Task 4",
      team: "Team D",
      subtasks: [
        {
          id: "subtask4-1",
          name: "Subtask 4.1",
          poc: "POC F",
          subtasks: [
            { id: "subtask4-1-1", name: "Subtask 4.1.1", poc: "POC F1" },
            { id: "subtask4-1-2", name: "Subtask 4.1.2", poc: "POC F2" },
            { id: "subtask4-1-3", name: "Subtask 4.1.3", poc: "POC F3" }
          ]
        }
      ]
    },
    {
      id: "task5",
      name: "Task 5",
      team: "Team E",
      subtasks: [
        {
          id: "subtask5-1",
          name: "Subtask 5.1",
          poc: "POC J",
          subtasks: [
            { id: "subtask5-1-1", name: "Subtask 5.1.1", poc: "POC J1" }
          ]
        },
        {
          id: "subtask5-2",
          name: "Subtask 5.2",
          poc: "POC K",
          subtasks: []
        }
      ]
    }
  ]
};

const ProjectFlow = () => {
  const [expandedTasks, setExpandedTasks] = useState({});

  const toggleTask = (taskId) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const generateNodes = (taskList, parentId, depth = 1, positionX = 200) => {
    let nodes = [];
    let edges = [];
    
    taskList.forEach((task, index) => {
      let nodeId = task.id;
      let position = { x: positionX, y: depth * 120 + index * 100 };

      nodes.push({
        id: nodeId,
        type: "default",
        data: {
          label: (
            <div onClick={() => toggleTask(nodeId)} className="task-node">
              {task.name} ({task.poc || task.team})
            </div>
          )
        },
        position
      });

      if (parentId) {
        edges.push({ id: `e-${parentId}-${nodeId}`, source: parentId, target: nodeId });
      }

      if (expandedTasks[nodeId] && task.subtasks?.length > 0) {
        const { nodes: subNodes, edges: subEdges } = generateNodes(
          task.subtasks,
          nodeId,
          depth + 1,
          positionX + 200
        );
        nodes = [...nodes, ...subNodes];
        edges = [...edges, ...subEdges];
      }
    });

    return { nodes, edges };
  };

  const { nodes, edges } = generateNodes(mockData.tasks, mockData.id);

  nodes.unshift({
    id: mockData.id,
    type: "default",
    data: { label: `${mockData.name} (${mockData.owner})` },
    position: { x: 300, y: 50 }
  });

  return (
    <div style={{ height: "600px", width: "100%" }}>
      <ReactFlow nodes={nodes} edges={edges} fitView />
    </div>
  );
};

export default ProjectFlow;
