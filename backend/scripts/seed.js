/**
 * Database seed script — creates a ready-to-explore demo dataset.
 *
 *   Run:  npm run seed   (from the backend/ folder)
 *
 * Creates role configs, demo users (admin/manager/opic), clients, and a couple
 * of fully-wired projects (milestones → tasks → subtasks → comments).
 *
 * ⚠️ This WIPES the seeded collections first, so only run it against a
 *    dev/demo database (your own MongoDB Atlas), never production data.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const RoleConfig = require("../models/RoleConfig");
const Client = require("../models/ClientName");
const Project = require("../models/Project");
const Milestone = require("../models/Milestone");
const Task = require("../models/Task1");
const Subtask = require("../models/SubTask");
const Comment = require("../models/Comment");

const DEMO_PASSWORD = "Demo@12345";

const ROLE_PERMISSIONS = {
  admin: [
    "create_project", "edit_project", "delete_project",
    "create_task", "edit_task", "delete_task",
    "create_subtask", "edit_subtask", "delete_subtask",
    "create_user", "edit_user", "delete_user",
    "view_analytics", "manage_roles",
  ],
  manager: [
    "create_project", "edit_project",
    "create_task", "edit_task", "delete_task",
    "create_subtask", "edit_subtask", "delete_subtask",
    "create_user", "edit_user", "view_analytics",
  ],
  opic: ["edit_task", "create_subtask", "edit_subtask"],
};

// helpers
const days = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const STAMP = `${String(today.getFullYear()).slice(2)}${pad(today.getMonth() + 1)}${pad(today.getDate())}`;

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not set. Add it to backend/.env first.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔌 Connected to MongoDB");

  // 1. Wipe seeded collections
  await Promise.all([
    User.deleteMany({}),
    RoleConfig.deleteMany({}),
    Client.deleteMany({}),
    Project.deleteMany({}),
    Milestone.deleteMany({}),
    Task.deleteMany({}),
    Subtask.deleteMany({}),
    Comment.deleteMany({}),
  ]);
  console.log("🧹 Cleared existing demo data");

  // 2. Role configs
  await RoleConfig.insertMany(
    Object.entries(ROLE_PERMISSIONS).map(([roleName, permissions]) => ({ roleName, permissions }))
  );
  console.log("🔐 Created role configurations");

  // 3. Users
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await User.create({
    name: "Demo Admin", email: "admin@demo.com", password, role: "admin",
    team: "Management", location: "HQ", designation: "Administrator",
    permissions: ROLE_PERMISSIONS.admin,
  });
  const manager = await User.create({
    name: "Maria Manager", email: "manager@demo.com", password, role: "manager",
    team: "Team Alpha", location: "Tokyo", designation: "Project Manager",
    managerId: admin._id, permissions: ROLE_PERMISSIONS.manager,
  });
  const opic1 = await User.create({
    name: "Oscar OPIC", email: "opic1@demo.com", password, role: "opic",
    team: "Team Alpha", location: "Tokyo", designation: "Operations PIC",
    managerId: manager._id, permissions: ROLE_PERMISSIONS.opic,
  });
  const opic2 = await User.create({
    name: "Olivia OPIC", email: "opic2@demo.com", password, role: "opic",
    team: "Team Alpha", location: "Osaka", designation: "Operations PIC",
    managerId: manager._id, permissions: ROLE_PERMISSIONS.opic,
  });
  console.log("👥 Created users (admin / manager / 2 opics)");

  // 4. Clients (replaces Zoho sync)
  const clients = await Client.insertMany([
    { zohoId: "DEMO-001", name: "Acme Corporation", companyName: "Acme Corp", email: "contact@acme.test" },
    { zohoId: "DEMO-002", name: "Globex Inc", companyName: "Globex", email: "hello@globex.test" },
    { zohoId: "DEMO-003", name: "Initech", companyName: "Initech LLC", email: "info@initech.test" },
    { zohoId: "DEMO-004", name: "Umbrella Ltd", companyName: "Umbrella", email: "ops@umbrella.test" },
    { zohoId: "DEMO-005", name: "Wayne Enterprises", companyName: "Wayne Ent.", email: "biz@wayne.test" },
  ]);
  console.log(`🗂️  Created ${clients.length} clients`);

  // 5. Projects with milestones → tasks → subtasks → comments
  let projectSeq = 0;
  let taskSeq = 0;

  const buildProject = async ({ name, type, description, client, taskSpecs }) => {
    projectSeq += 1;
    const project = await Project.create({
      projectId: `PJ${STAMP}-${pad(projectSeq)}`,
      projectName: name,
      projectType: type,
      projectDescription: description,
      owner: manager._id,
      startDate: days(-10),
      endDate: days(30),
      targetDate: days(30).toDateString(),
      status: "In Progress",
      team: "Team Alpha",
      totalBudget: 500000,
      clientName: client,
      assignedTo: [opic1._id, opic2._id],
      teamMembers: [manager._id, opic1._id, opic2._id],
      expectedDuration: 40,
    });

    const milestone = await Milestone.create({
      milestoneId: "M1",
      milestoneName: `${name} — Phase 1`,
      budget: 250000,
      dueDate: days(20),
      projectId: project._id,
      status: "In Progress",
    });

    const taskIds = [];
    for (const spec of taskSpecs) {
      taskSeq += 1;
      // subtasks
      const subtaskDocs = await Subtask.insertMany(
        spec.subtasks.map((s) => ({
          name: s.name,
          assignee: s.assignee,
          status: s.status,
          submission: s.submission || undefined,
        }))
      );
      const total = subtaskDocs.length;
      const done = subtaskDocs.filter((s) => s.status === "Completed").length;
      const progress = total ? Math.round((done / total) * 100) : 0;

      const task = await Task.create({
        taskId: `TK${STAMP}-${pad(taskSeq)}`,
        taskName: spec.name,
        assignee: spec.assignee,
        assigner: manager._id,
        teamStatus: spec.teamStatus,
        progress,
        dueDate: spec.dueDate,
        subtasks: subtaskDocs.map((s) => s._id),
        milestone: milestone._id,
      });

      // a demo comment per task
      const comment = await Comment.create({
        content: spec.comment,
        user: opic1._id,
        task: task._id,
      });
      task.comments.push(comment._id);
      await task.save();

      taskIds.push(task._id);
    }

    milestone.tasks = taskIds;
    await milestone.save();
    project.tasks = taskIds;
    project.milestones = [milestone._id];
    await project.save();
    return project;
  };

  await buildProject({
    name: "Website Revamp",
    type: "Web Development",
    description: "Redesign and rebuild the corporate website.",
    client: "Acme Corporation",
    taskSpecs: [
      {
        name: "Design system & wireframes",
        assignee: opic1._id,
        teamStatus: "Completed",
        dueDate: days(-2),
        comment: "Wireframes approved by the client. 🎉",
        subtasks: [
          { name: "Create color palette", assignee: opic1._id, status: "Completed" },
          { name: "Design landing wireframe", assignee: opic1._id, status: "Completed" },
        ],
      },
      {
        name: "Frontend implementation",
        assignee: opic2._id,
        teamStatus: "In Progress",
        dueDate: days(7),
        comment: "Building the component library this week.",
        subtasks: [
          { name: "Set up React + Vite", assignee: opic2._id, status: "Completed" },
          { name: "Build navbar & sidebar", assignee: opic2._id, status: "In Progress" },
          { name: "Wire up API layer", assignee: opic2._id, status: "Not Started" },
        ],
      },
    ],
  });

  await buildProject({
    name: "Mobile App Launch",
    type: "Mobile",
    description: "Ship the v1 mobile application to the stores.",
    client: "Globex Inc",
    taskSpecs: [
      {
        name: "API integration",
        assignee: opic1._id,
        teamStatus: "In Progress",
        dueDate: days(5),
        comment: "Auth endpoints integrated; payments pending.",
        subtasks: [
          { name: "Auth flow", assignee: opic1._id, status: "Completed" },
          { name: "Payments", assignee: opic1._id, status: "In Progress" },
        ],
      },
      {
        name: "QA & store submission",
        assignee: opic2._id,
        teamStatus: "Not Started",
        dueDate: days(14),
        comment: "Will start once integration is done.",
        subtasks: [
          { name: "Write test cases", assignee: opic2._id, status: "Not Started" },
        ],
      },
    ],
  });
  console.log("📁 Created 2 demo projects with milestones, tasks, subtasks & comments");

  console.log("\n✅ Seed complete! Demo login:");
  console.log("   Admin    →  admin@demo.com    / " + DEMO_PASSWORD);
  console.log("   Manager  →  manager@demo.com  / " + DEMO_PASSWORD);
  console.log("   OPIC     →  opic1@demo.com    / " + DEMO_PASSWORD);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("❌ Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
