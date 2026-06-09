const mongoose = require("mongoose");

const milestoneSchema = new mongoose.Schema(
  {
    milestoneId: { type: String, required: true }, // Auto (M1, M2, ...)
    milestoneName: { type: String, required: true },
    budget: { type: Number, required: true },
    dueDate: { type: Date, required: true },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    tasks: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Task" }
    ],
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    completionDate: { type: Date },
  },
  { timestamps: true }
);

// ✅ Update milestone status dynamically
milestoneSchema.methods.updateStatus = async function () {
  const Task = mongoose.model("Task");
  const tasks = await Task.find({ _id: { $in: this.tasks } });

  if (tasks.length > 0 && tasks.every(t => t.teamStatus === "Completed")) {
    this.status = "Completed";
    this.completionDate = new Date();
  } else if (tasks.some(t => t.teamStatus === "In Progress")) {
    this.status = "In Progress";
  } else {
    this.status = "Pending";
  }
  await this.save();
};

module.exports = mongoose.model("Milestone", milestoneSchema);
