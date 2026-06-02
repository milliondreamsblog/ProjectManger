const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
    projectId: { type: String, required: true},
    projectName: { type: String, required: true },
    projectType: { type: String, required: true },
    projectDescription: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    targetDate: { type: String },   
    status: { type: String, default: "Pending" }, //  Pending, In Progress, Completed
    completionDate: { type: Date },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }], 
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    team: { type: String, required: true }, // Team identifier (e.g., "Team 1", "Team 2")
    totalBudget: { type: Number },
    clientName: {
  type: String,
},
    milestones: [{ type: mongoose.Schema.Types.ObjectId, ref: "Milestone" }],
    teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // All users in the team
    expectedDuration: { type: Number },
}, { timestamps: true });

// Add validation for completion date
projectSchema.pre('save', function(next) {
    if (this.status === "Completed") {
        // If project is being marked as completed
        if (!this.completionDate) {
            // Set completion date to current date if not provided
            this.completionDate = new Date();
        } else {
            // Validate that completion date is not in the future
            const now = new Date();
            if (this.completionDate > now) {
                return next(new Error("Completion date cannot be in the future"));
            }
        }
    } else if (this.isModified('status') && this._oldStatus === "Completed") {
        // If trying to change status from Completed to something else
        return next(new Error("Cannot change status of a completed project"));
    }
    next();
});

// Store old status before update
projectSchema.pre('findOneAndUpdate', function(next) {
    this._oldStatus = this._update.status;
    next();
});

module.exports = mongoose.model("Project", projectSchema);
