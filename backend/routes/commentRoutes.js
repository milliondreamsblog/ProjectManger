const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require('multer');
const Comment = require('../models/Comment');
const Task = require('../models/Task1');
const { logActivity } = require("../middlewares/auditLogMiddleware");
const { sendNotification } = require('../services/notificationService');
const User = require('../models/User');
const { uploadBufferToCloudinary, deleteFromCloudinary } = require('../utils/cloudinaryUpload');

// ----- (legacy) AWS S3 — replaced by Cloudinary -----
// const AWS = require('aws-sdk');
// const s3 = new AWS.S3();
// const s3BucketName = process.env.AWS_S3_BUCKET_NAME;

// Multer in-memory storage — buffers stream straight to Cloudinary.
const upload = multer({ storage: multer.memoryStorage() });

// Add comment to task
router.post("/add/:taskId", authMiddleware, upload.array('attachments', 5), async (req, res) => {
    const taskId = req.params.taskId;
    const { content } = req.body;
    const files = req.files;

    try {
        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }


        const attachments = [];
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    // Upload the in-memory buffer to Cloudinary (was AWS S3)
                    const result = await uploadBufferToCloudinary(
                        file.buffer,
                        `task-attachments/${taskId}`,
                        file.originalname
                    );

                    attachments.push({
                        fileName: file.originalname,
                        fileUrl: result.url,
                        publicId: result.publicId,
                        fileType: file.mimetype,
                        fileSize: file.size,
                    });
                } catch (uploadError) {
                    console.error('Error uploading attachment to Cloudinary:', uploadError);
                }
            }
        }

        // Handle Google Drive links as a separate field
        let driveLinks = req.body.driveLinks;
        if (typeof driveLinks === 'string') {
            try {
                driveLinks = JSON.parse(driveLinks);
            } catch (e) {
                driveLinks = [];
            }
        }
        if (!Array.isArray(driveLinks)) {
            driveLinks = [];
        }

        const newComment = new Comment({
            content: content || '',
            user: req.user.id,
            task: taskId,
            attachments,
            driveLinks
        });

        await newComment.save();
        task.comments.push(newComment._id);
        await task.save();

        const user = await User.findById(req.user.id).select('name');

        await logActivity(req.user.id, "Added Comment ", newComment._id, "comment", `ID: ${user.name} added a comment on Task ID: ${task.taskId}`, req.user.parentId);

        const populatedComment = await Comment.findById(newComment._id)
            .populate('user', 'name email');

        if (task.assignee && task.assignee.toString() !== req.user.id) {
            await sendNotification(
                task.assignee,
                'New Comment on Your Task',
                `A new comment has been added to your task "${task.taskName}".`,
                'comment',
                newComment._id
            );
        }
        
        if (task.createdBy && task.createdBy.toString() !== req.user.id) {
            await sendNotification(
                task.createdBy,
                'New Comment on Your Task',
                `A new comment has been added to your task "${task.taskName}".`,
                'comment',
                newComment._id
            );
        }

        res.status(201).json({ 
            message: "Comment added successfully", 
            comment: populatedComment 
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Error adding comment", error: error.message });
    }
});

// Get all comments for a task
router.get("/task/:taskId", authMiddleware, async (req, res) => {
    try {
        const comments = await Comment.find({ task: req.params.taskId })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Comments fetched successfully",
            comments
        });
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Error fetching comments", error: error.message });
    }
});

// Update a comment
router.put("/update/:commentId", authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this comment" });
        }

        const { content } = req.body;
        comment.content = content;
        await comment.save();

        await logActivity(req.user.id, "Updated Comment", comment._id, "comment", `Updated comment on Task: ${comment.task}`, req.user.parentId);

        const updatedComment = await Comment.findById(comment._id)
            .populate('user', 'name email');

        res.status(200).json({
            message: "Comment updated successfully",
            comment: updatedComment
        });
    } catch (error) {
        console.error("Error updating comment:", error);
        res.status(500).json({ message: "Error updating comment", error: error.message });
    }
});

// Delete a comment
router.delete("/delete/:commentId", authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this comment" });
        }

        if (comment.attachments && comment.attachments.length > 0) {
            for (const attachment of comment.attachments) {
                // Remove the asset from Cloudinary (was AWS S3 deleteObject)
                if (attachment.publicId) {
                    await deleteFromCloudinary(attachment.publicId);
                }
            }
        }

        const task = await Task.findById(comment.task);
        if (task) {
            task.comments = task.comments.filter(c => c.toString() !== comment._id.toString());
            await task.save();
        }

        await comment.deleteOne();

        await logActivity(req.user.id, "Deleted Comment", comment._id, "comment", `Deleted comment on Task: ${comment.task}`, req.user.parentId);

        res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).json({ message: "Error deleting comment", error: error.message });
    }
});

module.exports = router; 