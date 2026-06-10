import React from "react";
import { ScrollView } from "react-native";
import Svg, { Line, Rect, Text as SvgText } from "react-native-svg";
import { hierarchy, tree } from "d3-hierarchy";
import { statusColor, COLORS } from "@pm/config";
import type { SubTask, Task } from "@pm/types";

interface GNode {
  name: string;
  status?: string;
  children?: GNode[];
}

const NODE_W = 150;
const NODE_H = 38;
const PAD = 28;
const truncate = (s: string, n = 18) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * Project → Tasks → Subtasks hierarchy, laid out with d3-hierarchy and drawn
 * with react-native-svg (the mobile counterpart of the web D3 TaskGraphView).
 */
export function TaskGraph({ projectName, tasks }: { projectName: string; tasks: Task[] }) {
  const data: GNode = {
    name: projectName,
    children: tasks.map((t) => ({
      name: t.taskName,
      status: t.teamStatus,
      children: ((t.subtasks ?? []) as SubTask[])
        .filter((s) => typeof s === "object")
        .map((s) => ({ name: s.name, status: s.status })),
    })),
  };

  const root = hierarchy<GNode>(data);
  tree<GNode>().nodeSize([NODE_H + 16, NODE_W + 50])(root);

  const nodes = root.descendants();
  const links = root.links();
  const xs = nodes.map((n) => n.x ?? 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...nodes.map((n) => n.y ?? 0));

  const sx = (n: { y?: number }) => (n.y ?? 0) + PAD;
  const sy = (n: { x?: number }) => (n.x ?? 0) - minX + PAD;

  const width = maxY + NODE_W + PAD * 2;
  const height = maxX - minX + NODE_H + PAD * 2;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator>
      <ScrollView showsVerticalScrollIndicator style={{ maxHeight: 480 }}>
        <Svg width={width} height={height}>
          {links.map((l, i) => (
            <Line
              key={`l${i}`}
              x1={sx(l.source) + NODE_W / 2}
              y1={sy(l.source)}
              x2={sx(l.target) - NODE_W / 2}
              y2={sy(l.target)}
              stroke={COLORS.border}
              strokeWidth={1.5}
            />
          ))}
          {nodes.map((n, i) => {
            const depth = n.depth;
            const fill = depth === 0 ? COLORS.primary : n.data.status ? statusColor(n.data.status) : COLORS.muted;
            const x = sx(n) - NODE_W / 2;
            const y = sy(n) - NODE_H / 2;
            return (
              <React.Fragment key={`n${i}`}>
                <Rect
                  x={x}
                  y={y}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={depth === 0 ? fill : "#fff"}
                  stroke={fill}
                  strokeWidth={1.5}
                />
                <SvgText
                  x={sx(n)}
                  y={sy(n) + 4}
                  fontSize={12}
                  fontWeight={depth === 0 ? "700" : "500"}
                  fill={depth === 0 ? "#fff" : COLORS.text}
                  textAnchor="middle"
                >
                  {truncate(n.data.name)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    </ScrollView>
  );
}
