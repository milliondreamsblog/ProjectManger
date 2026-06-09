const mongoose = require('mongoose');

const projectTemplateSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: true,
      unique: true,
    },
    expectedDuration: {
      type: Number,
      required: true,
      min: 1,
    },
    tasks: [
      {
        taskName: {
          type: String,
          required: true,
        },
        expectedDuration: {
          type: Number,
          required: true,
        },
        subtasks: [
          {
            name: {
              type: String,
              required: true,
            },
            expectedDuration: {
              type: Number,
              // required: true
            },
          },
        ],
      },
    ],

    // 👇 Make milestones optional
    milestones: [
      {
        milestoneName: {
          type: String,
          required: false, // ✅ not required
        },
        dueDate: {
          type: Date,
          required: false, // ✅ not required
        },
        budget: {
          type: Number,
          required: false, // ✅ not required
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProjectTemplate', projectTemplateSchema);
