const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
    content: { type: String},
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Who posted the comment
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true }, // Which task the comment is for
    attachments: [{
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number },
        publicId: { type: String }, // Cloudinary public_id (was s3Key)
        s3Key: { type: String } // legacy, kept for backward compatibility
    }],
    driveLinks: [{
        isDrive: { type: Boolean, default: false },
        name: { type: String },
        url: { type: String }
    }],
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);
