const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submission: { type: String }, // URL to the PDF file
    status: { type: String, default: "In Progress" }, // Example: Not Started, In Progress, Completed
}); 

// module.exports = mongoose.model("Subtask", subtaskSchema);
const Subtask = mongoose.models.Subtask || mongoose.model("Subtask", subtaskSchema);
module.exports = Subtask;
