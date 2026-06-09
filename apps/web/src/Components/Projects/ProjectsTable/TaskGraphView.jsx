import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "./TaskGraphView.css";

const TaskGraphView = ({ projectData }) => {
  const svgRef = useRef();
  const [hierarchyData, setHierarchyData] = useState(null);

  const NODE_WIDTH = 200;
  const NODE_HEIGHT = 60;

  const mapStatus = (backendStatus) => {
    const statusMap = {
      complete: "completed",
      completed: "completed",
      pending: "pending",
      inprogress: "in-progress",
      assigned: "pending",
      not: "pending",
    };
    return statusMap[backendStatus?.toLowerCase()] || "pending";
  };

  useEffect(() => {
    if (!projectData || !projectData.tasks) {
      setHierarchyData(null);
      return;
    }

    const hierarchy = {
      id: "root",
      title: projectData.projectName || "Unnamed Project",
      status: "root",
      children: [],
    };

    projectData.tasks.forEach((task) => {
      const taskId = task.taskId || task._id;
      if (!taskId) return;

      const taskNode = {
        id: taskId,
        title: task?.taskName || "Unnamed Task",
        status: mapStatus(task?.teamStatus || task?.status),
        children: (task.subtasks || []).map((subtask) => ({
          id: subtask.id || subtask._id || `${taskId}-${subtask.name}`,
          title: subtask.name || subtask.title || "Unnamed Subtask",
          status: mapStatus(subtask.status || "pending"),
          children: [],
        })),
      };

      hierarchy.children.push(taskNode);
    });

    setHierarchyData(hierarchy);
  }, [projectData]);

  const wrapText = (text, width) => {
    text.each(function () {
      const textEl = d3.select(this);
      const words = textEl.text().split(/\s+/).reverse();
      let word;
      let line = [];
      let lineNumber = 0;
      const lineHeight = 1.1;
      const y = textEl.attr("y");
      const dy = parseFloat(textEl.attr("dy") || 0);
      let tspan = textEl
        .text(null)
        .append("tspan")
        .attr("x", 10)
        .attr("y", y)
        .attr("dy", dy + "em");
      while ((word = words.pop())) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width - 20) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = textEl
            .append("tspan")
            .attr("x", 10)
            .attr("y", y)
            .attr("dy", ++lineNumber * lineHeight + dy + "em")
            .text(word);
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: "#10b981",
      "in-progress": "#E28409",
      pending: "#6b7280",
      root: "#3b82f6",
    };
    return colors[status] || "#6b7280";
  };

  useEffect(() => {
    if (!hierarchyData) return;

    const container = svgRef.current.parentNode;
    const containerWidth = container.offsetWidth - 50;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    const root = d3.hierarchy(hierarchyData);
    const height = Math.max(600, (root.height + 1) * 120);

    // ✅ Auto-fit width based on number of nodes instead of fixed large value
    const HORIZONTAL_SPACING = 70; // 🔹 reduced from 120 to 70
    const maxNodes = Math.max(...root.descendants().map((d) => d.depth)) + 1;
    const calculatedWidth = maxNodes * (NODE_WIDTH + HORIZONTAL_SPACING);

    const treeLayout = d3
      .tree()
      .size([height - margin.top - margin.bottom, calculatedWidth])
      .separation(() => 1.6);

    treeLayout(root);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg
      .attr("width", Math.max(containerWidth, calculatedWidth + 100))
      .attr("height", height);

    const g = svg.append("g").attr("transform", `translate(50,${margin.top})`);

    // ✅ Links aligned to center of each box
    g.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr(
        "d",
        d3
          .linkHorizontal()
          .x((d) => d.y)
          .y((d) => d.x + NODE_HEIGHT / 2)
      )
      .attr("fill", "none")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 2);

    // Nodes
    const nodeGroups = g
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.y},${d.x})`);

    nodeGroups
      .append("rect")
      .attr("width", NODE_WIDTH)
      .attr("height", NODE_HEIGHT)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("fill", "#fff")
      .attr("stroke", (d) => getStatusColor(d.data.status))
      .attr("stroke-width", 2);

    nodeGroups
      .append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("dy", 0)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .text((d) => d.data.title)
      .call(wrapText, NODE_WIDTH);
  }, [hierarchyData]);

  return (
    <div className="task-visualizer-container">
      <h2 className="graph-title">
        {projectData?.projectName || "Unnamed Project"}
      </h2>
      <svg ref={svgRef} className="task-visualizer-svg"></svg>
    </div>
  );
};

export default TaskGraphView;
