const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskId: { type: String, required: true },
    taskName: { type: String, required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    assigner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamStatus: { type: String, default: "Not Started" },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    dueDate: { type: Date },
    completionDate: { type: Date },
    subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subtask" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    clientName: [""],
    milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
    closeReason: { type: String },
    closeDate: { type: Date },


    // ✅ Updated dependencies
    dependencies: [
      {
        personId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        description: {
          type: String,
          trim: true,
          required: true,
        },
        status: {
          type: String,
          enum: ["Pending", "In Progress", "Completed"],
          default: "Pending",
        },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Validation for completion date
taskSchema.pre("save", async function (next) {
  // Only check dependencies if teamStatus is "Completed"
  if (this.teamStatus === "Completed") {
    const incompleteDeps = this.dependencies.filter(
      (d) => d.status !== "Completed"
    );
    if (incompleteDeps.length > 0) {
      return next(
        new Error("Cannot mark task as Completed because dependencies are incomplete")
      );
    }

    // Set completion date if not provided
    if (!this.completionDate) {
      this.completionDate = new Date();
    } else {
      const now = new Date();
      if (this.completionDate > now) {
        return next(new Error("Completion date cannot be in the future"));
      }
    }
  }
  next();
});

// Store old status before update
taskSchema.pre("findOneAndUpdate", function (next) {
  this._oldStatus = this._update.teamStatus;
  next();
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
