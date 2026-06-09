const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Task = require("../models/Task1");
require("dotenv").config();
// const AWS = require("aws-sdk"); // replaced by Cloudinary
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinaryUpload");

const router = express.Router();

router.use(passport.initialize());

// ----- (legacy) AWS S3 config — replaced by Cloudinary -----
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
// });
// const s3BucketName = process.env.AWS_S3_BUCKET_NAME;
//
// // Configure multer for disk storage (temp local before S3)
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "uploads/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// Multer in-memory storage — buffers are streamed straight to Cloudinary.
const upload = multer({ storage: multer.memoryStorage() });

// Register Admin (Only existing admins can create new admins)
// , authMiddleware, roleMiddleware(["admin"])
router.post("/register/admin", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { name, email, password, team, location } = req.body;
    console.log("req.body", req.body);

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const generatedPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      team,
      location,
    });

    const mailOptions = {
      from: "no-reply@suzuki-gc.com",
      to: email,
      subject: "Welcome to the platform!",
      text: `Hello ${name},\n\nWelcome to the platform. Here are your login credentials:\n\nEmail: ${email}\nPassword: ${generatedPassword}\n\nYou can log in using the following link: https://sgc-cloud.com/ \n\nPlease use these credentials to log in.\n\nBest Regards,\nSuzuki Team`,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Error creating admin:", error);
    res
      .status(500)
      .json({ message: "Error creating admin", error: error.message });
  }
});

// Edit Admin
router.put("/edit/admin/:adminId", authMiddleware, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized - Only admins can edit other admins" });
    }

    const { adminId } = req.params;
    const { name, email, team, location } = req.body;

    // Prevent admin from editing themselves
    if (adminId === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot edit your own admin account" });
    }

    // Find the admin to edit
    const adminToEdit = await User.findOne({
      _id: adminId,
      role: "admin",
    });

    if (!adminToEdit) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== adminToEdit.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      adminToEdit.email = email;
    }

    // Update other fields if provided
    if (name) adminToEdit.name = name;
    if (team) adminToEdit.team = team;
    if (location) adminToEdit.location = location;

    await adminToEdit.save();

    res.status(200).json({
      message: "Admin updated successfully",
      admin: {
        id: adminToEdit._id,
        name: adminToEdit.name,
        email: adminToEdit.email,
        team: adminToEdit.team,
        location: adminToEdit.location,
      },
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res
      .status(500)
      .json({ message: "Error updating admin", error: error.message });
  }
});

// Delete Admin
router.delete("/delete/admin/:adminId", authMiddleware, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "Unauthorized - Only admins can delete other admins",
        });
    }

    const { adminId } = req.params;

    // Prevent admin from deleting themselves
    if (adminId === req.user.id) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own admin account" });
    }

    // Find and delete the admin
    const deletedAdmin = await User.findOneAndDelete({
      _id: adminId,
      role: "admin",
    });

    if (!deletedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json({
      message: "Admin deleted successfully",
      deletedAdmin: {
        id: deletedAdmin._id,
        name: deletedAdmin.name,
        email: deletedAdmin.email,
      },
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res
      .status(500)
      .json({ message: "Error deleting admin", error: error.message });
  }
});

router.get("/get-admin", authMiddleware, async (req, res) => {
  try {
    console.log("enter in get admin");
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({
          message: "Unauthorized - Only admins can access this endpoint",
        });
    }

    // Find all admins except the requesting admin
    const admins = await User.find({
      role: "admin",
      _id: { $ne: req.user.id }, // Exclude the requesting admin
    }).select("name email team location"); // Only select necessary fields

    console.log("admins", admins);

    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res
      .status(500)
      .json({ message: "Error fetching admins", error: error.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    {
      id: user._id,
      team: user.team,
      role: user.role,
      permissions: user.permissions,
      parentId: user.managerId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({
    token,
    role: user.role,
    team: user.team,
    permissions: user.permissions,
    name: user.name,
    id: user._id,
  });
});

// Create Manager
const transporter = nodemailer.createTransport({
  service: "gmail", // You can choose other providers too
  auth: {
    user: "no-reply@suzuki-gc.com", // Your email
    pass: "yndl gedx zfca gksd", // Your email password (or use OAuth for more security)
  },
});
// const transporter = nodemailer.createTransport({
//     host: "sv10588.xserver.jp",
//     port: 465,  // Changed to 465 for secure SSL connection
//     secure: true, // Changed to true for SSL
//     auth: {
//         user: "no-reply@suzuki-gc.com",
//         pass: "Noreply!12345",
//     },
//     tls: {
//         rejectUnauthorized: false // Helps avoid certificate issues
//     },
//     debug: true // This will help log detailed connection information
// });

// "/create/manager", authMiddleware, roleMiddleware(["admin"]), async (req, res)

router.post("/create/manager", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Only Admin can create manager" });
  }

  const { name, email, team, location, permissions } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ message: "User with this email already exists" });
  }

  const generatedPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  const newManager = new User({
    name,
    email,
    password: hashedPassword,
    role: "manager",
    team,
    location,
  });

  try {
    //  First save the manager
    await newManager.save();

    // Then send the email
    const mailOptions = {
      from: "no.reply.suzuki.gc@gmail.com",
      to: email,
      subject: "Welcome to the platform!",
      text: `Hello ${name},\n\nWelcome to the platform. Here are your login credentials:\n\nEmail: ${email}\nPassword: ${generatedPassword}\n\nYou can log in using the following link: https://sgc-cloud.com/ \n\nPlease use these credentials to log in.\n\nBest Regards,\nSuzuki Team`,
    };

    await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          reject(error);
        } else {
          resolve(info);
        }
      });
    });

    res
      .status(200)
      .json({ message: "Manager created and email sent successfully!" });
  } catch (error) {
    console.error("Error in manager creation:", error);
    // If email failed but user was created, we should still return success
    if (error.code === "ESOCKET" || error.code === "ETIMEDOUT") {
      res.status(200).json({
        message:
          "Manager created successfully but email could not be sent. Please contact support.",
        error: error.message,
      });
    } else {
      res
        .status(500)
        .json({ message: "Error creating manager", error: error.message });
    }
  }
});

// Edit Manager
router.put("/edit/manager/:managerId", authMiddleware, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized - Only admins can edit managers" });
    }

    const { managerId } = req.params;
    const { name, email, team, location } = req.body;

    // Find the manager to edit
    const managerToEdit = await User.findOne({
      _id: managerId,
      role: "manager",
    });

    if (!managerToEdit) {
      return res.status(404).json({ message: "Manager not found" });
    }

    // Check if email is being changed and if it's already in use
    if (email && email !== managerToEdit.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      managerToEdit.email = email;
    }

    // Update other fields if provided
    if (name) managerToEdit.name = name;
    if (team) managerToEdit.team = team;
    if (location) managerToEdit.location = location;

    await managerToEdit.save();

    // Update team for all OPICs under this manager
    if (team) {
      await User.updateMany({ managerId: managerId }, { $set: { team: team } });
    }

    res.status(200).json({
      message: "Manager updated successfully",
      manager: {
        id: managerToEdit._id,
        name: managerToEdit.name,
        email: managerToEdit.email,
        team: managerToEdit.team,
        location: managerToEdit.location,
      },
    });
  } catch (error) {
    console.error("Error updating manager:", error);
    res
      .status(500)
      .json({ message: "Error updating manager", error: error.message });
  }
});

// Delete Manager
router.delete(
  "/delete/manager/:managerId",
  authMiddleware,
  async (req, res) => {
    try {
      // Check if the requesting user is an admin
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Unauthorized - Only admins can delete managers" });
      }

      const { managerId } = req.params;

      // Find the manager
      const manager = await User.findOne({
        _id: managerId,
        role: "manager",
      });

      if (!manager) {
        return res.status(404).json({ message: "Manager not found" });
      }

      // Check if manager has any OPICs assigned
      const opicsCount = await User.countDocuments({ managerId: managerId });
      if (opicsCount > 0) {
        return res.status(400).json({
          message:
            "Cannot delete manager with assigned OPICs. Please reassign or remove OPICs first.",
          opicsCount: opicsCount,
        });
      }

      // Delete the manager
      const deletedManager = await User.findOneAndDelete({
        _id: managerId,
        role: "manager",
      });

      res.status(200).json({
        message: "Manager deleted successfully",
        deletedManager: {
          id: deletedManager._id,
          name: deletedManager.name,
          email: deletedManager.email,
          team: deletedManager.team,
        },
      });
    } catch (error) {
      console.error("Error deleting manager:", error);
      res
        .status(500)
        .json({ message: "Error deleting manager", error: error.message });
    }
  }
);

// Create OPIC
router.post(
  "/create/opic",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const {
      name,
      email,
      team,
      location,
      permissions,
      role,
      designation,
      managerId,
    } = req.body;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Admin can create Opics" });
    }

    console.log("role", role);
    console.log("managerId from body", managerId);

    if (!managerId) {
      return res
        .status(400)
        .json({ message: "Manager ID is required to create an OPIC" });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      }

      const assignedManager = await User.findOne({
        _id: managerId,
        role: "manager",
      });

      if (!assignedManager) {
        return res.status(400).json({ message: "Invalid Manager ID provided" });
      }

      const generatedPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const opicTeam = assignedManager.team;
      console.log("Using assigned managers team for OPIC:", opicTeam);

      const newOpic = new User({
        name,
        email,
        password: hashedPassword,
        role: "opic",
        managerId: assignedManager._id,
        team: opicTeam,
        location,
        designation,
      });

      console.log("newOpic", newOpic);

      await newOpic.save();

      const mailOptions = {
        from: "parmarkrrish2643@gmail.com",
        to: email,
        subject: "Welcome to the platform!",
        text: `Hello ${name},\n\nWelcome to the platform. Here are your login credentials:\n\nEmail: ${email}\nPassword: ${generatedPassword}\n\n You can log in using the following link: https://sgc-cloud.com/ \n\nPlease use these credentials to log in  .\n\nBest Regards,\nSuzuki Team`,
      };

      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            reject(error);
          } else {
            resolve(info);
          }
        });
      });

      res
        .status(200)
        .json({ message: "OPIC created and email sent successfully!" });
    } catch (error) {
      console.error("Error in OPIC creation:", error);
      if (error.code === "ESOCKET" || error.code === "ETIMEDOUT") {
        res.status(200).json({
          message:
            "OPIC created successfully but email could not be sent. Please contact support.",
          error: error.message,
        });
      } else {
        res
          .status(500)
          .json({ message: "Error creating OPIC", error: error.message });
      }
    }
  }
);

// Edit OPIC
router.put(
  "/edit/opic/:opicId",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const { opicId } = req.params;
      const { name, email, team, location, designation, managerId } = req.body;

      if(req.user.role !== "admin"){
        return res.status(403).json({ message: "Only Admin can edit Opics" });
    } 

      const opicToEdit = await User.findOne({
        _id: opicId,
        role: "opic",
      });

      if (!opicToEdit) {
        return res.status(404).json({ message: "OPIC not found" });
      }

      if (email && email !== opicToEdit.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
        opicToEdit.email = email;
      }

      if (managerId) {
        const newManager = await User.findOne({
          _id: managerId,
          role: "manager",
        });
        if (!newManager) {
          return res.status(400).json({ message: "Invalid manager ID" });
        }
        opicToEdit.managerId = managerId;
        opicToEdit.team = newManager.team;
      }

      if (name) opicToEdit.name = name;
      if (team) opicToEdit.team = team;
      if (location) opicToEdit.location = location;
      if (designation) opicToEdit.designation = designation;

      await opicToEdit.save();

      res.status(200).json({
        message: "OPIC updated successfully",
        opic: {
          id: opicToEdit._id,
          name: opicToEdit.name,
          email: opicToEdit.email,
          team: opicToEdit.team,
          location: opicToEdit.location,
          designation: opicToEdit.designation,
          managerId: opicToEdit.managerId,
        },
      });
    } catch (error) {
      console.error("Error updating OPIC:", error);
      res
        .status(500)
        .json({ message: "Error updating OPIC", error: error.message });
    }
  }
);

// Delete OPIC
router.delete("/delete/opic/:opicId", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Unauthorized - Only admins can delete OPICs" });
    }

    const { opicId } = req.params;

    const opic = await User.findOne({
      _id: opicId,
      role: "opic",
    });

    if (!opic) {
      return res.status(404).json({ message: "OPIC not found" });
    }

    const tasksCount = await Task.countDocuments({ assignee: opicId });
    if (tasksCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete OPIC with assigned tasks. Please reassign or complete tasks first.",
        tasksCount: tasksCount,
      });
    }

    const deletedOpic = await User.findOneAndDelete({
      _id: opicId,
      role: "opic",
    });

    res.status(200).json({
      message: "OPIC deleted successfully",
      deletedOpic: {
        id: deletedOpic._id,
        name: deletedOpic.name,
        email: deletedOpic.email,
        team: deletedOpic.team,
        designation: deletedOpic.designation,
      },
    });
  } catch (error) {
    console.error("Error deleting OPIC:", error);
    res
      .status(500)
      .json({ message: "Error deleting OPIC", error: error.message });
  }
});

// Get all OPICs (all OPICs for admin, only created OPICs for managers)
router.get("/my-opics", authMiddleware, async (req, res) => {
  try {
    let query = { role: "opic" };

    if (req.user.role !== "admin") {
      query.managerId = req.user.id;
    }

    const opics = await User.find(query)
      .select("name email team location createdAt managerId designation")
      .populate({
        path: 'managerId',
        select: 'name _id'
      });

    res.status(200).json(opics);
  } catch (error) {
    console.error("Error fetching OPICs:", error);
    res
      .status(500)
      .json({ message: "Error fetching OPICs", error: error.message });
  }
});

// Get all managers (admin only)
// roleMiddleware(["admin"]),
router.get("/my-managers", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const managers = await User.find({ role: "manager" }).select(
      "name email team location createdAt"
    );

    res.status(200).json(managers);
  } catch (error) {
    console.error("Error fetching managers:", error);
    res
      .status(500)
      .json({ message: "Error fetching managers", error: error.message });
  }
});

// Update user profile
router.put(
  "/update-profile",
  authMiddleware,
  permissionMiddleware("edit_user"),
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { name, team, location, designation } = req.body;
      const userId = req.user.id;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Handle profile picture upload (Cloudinary)
      if (req.file) {
        const file = req.file;

        // ----- (legacy) AWS S3 upload — replaced by Cloudinary -----
        // const fileStream = fs.createReadStream(file.path);
        // const uploadParams = {
        //   Bucket: s3BucketName,
        //   Key: `profile-pictures/${file.filename}`,
        //   Body: fileStream,
        //   ContentType: file.mimetype,
        // };
        // const s3UploadResult = await s3.upload(uploadParams).promise();
        // fs.unlink(file.path, (err) => { if (err) console.error(err); });

        // Remove the previous picture from Cloudinary if present
        if (user.profilePicture && user.profilePicture.publicId) {
          await deleteFromCloudinary(user.profilePicture.publicId);
        }

        // Upload the new picture buffer to Cloudinary
        const result = await uploadBufferToCloudinary(
          file.buffer,
          "profile-pictures",
          file.originalname
        );

        user.profilePicture = {
          url: result.url, // Cloudinary secure URL
          publicId: result.publicId, // Cloudinary public_id
        };
      }

      // Update other fields if provided
      if (name) user.name = name;
      if (team) user.team = team;
      if (location) user.location = location;
      if (designation) user.designation = designation;

      await user.save();

      // Return updated user without password
      const updatedUser = await User.findById(userId).select("-password");

      res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error updating profile with S3:", error);
      // Ensure local file is deleted even on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlink(req.file.path, (err) => {
          if (err)
            console.error("Error deleting local file after S3 error:", err);
        });
      }
      res
        .status(500)
        .json({ message: "Error updating profile", error: error.message });
    }
  }
);

// Get user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user and exclude password
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team,
        location: user.location,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res
      .status(500)
      .json({ message: "Error fetching profile", error: error.message });
  }
});

// Forgot Password - Request Reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `https://sgc-cloud.com/reset-password?token=${resetToken}`;

    // Send email with reset link
    const mailOptions = {
      from: "parmarkrrish2643@gmail.com",
      to: email,
      subject: "Password Reset Request",
      text: `Hello ${user.name},\n\nYou requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest Regards,\nSuzuki Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending reset email:", error);
        return res
          .status(500)
          .json({ message: "Error sending reset email", error });
      }
      res
        .status(200)
        .json({ message: "Password reset email sent successfully" });
    });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Error processing request", error });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in reset password:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid reset token" });
    }
    res.status(500).json({ message: "Error resetting password", error });
  }
});

// Configure Google Strategy — OPTIONAL.
// Only register it when credentials are present; otherwise the
// passport-google-oauth20 constructor throws and crashes boot. This keeps the
// app runnable with just MONGO_URI + JWT_SECRET (Google login simply disabled).
const googleAuthEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (googleAuthEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        // Derived from the backend's public URL (set BACKEND_URL in prod).
        callbackURL: `${process.env.BACKEND_URL || "http://localhost:5001"}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this email
          const existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (!existingUser) {
            return done(null, false, {
              message: "User not registered in the system",
            });
          }

          // If user exists but no Google ID, link the Google ID
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            await existingUser.save();
          }

          return done(null, existingUser);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("⚠️  GOOGLE_CLIENT_ID/SECRET not set — Google login disabled.");
}

// Short-circuit Google routes when the strategy isn't configured.
const requireGoogleAuth = (req, res, next) => {
  if (!googleAuthEnabled) {
    return res.status(503).json({ message: "Google login is not configured on this server." });
  }
  next();
};

// Google login route
router.get(
  "/google",
  requireGoogleAuth,
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

// Google callback route
router.get(
  "/google/callback",
  requireGoogleAuth,
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    console.log("enter in google auth");

    const token = jwt.sign(
      {
        id: req.user._id,
        role: req.user.role,
        permissions: req.user.permissions,
        parentId: req.user.managerId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // res.json({
    //     token,
    //     role: req.user.role,
    //     permissions: req.user.permissions,
    //     name: req.user.name,
    //     id: req.user._id,
    //     redirectUrl: process.env.FRONTEND_URL
    // });
    const FRONTEND = process.env.FRONTEND_URL; // e.g. http://localhost:5173
    const redirectUrl = new URL("/oauth2/redirect", FRONTEND);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("role", req.user.role);
    redirectUrl.searchParams.set("name", req.user.name);
    redirectUrl.searchParams.set("id", req.user._id);

    // 3) Send them back to React
    res.redirect(redirectUrl.toString());
  }
);

// Get users by team
router.get("/users/by-team/:team", authMiddleware, async (req, res) => {
  try {
    const { team } = req.params;

    console.log("team", team);

    // Find all users with the specified team
    const users = await User.find({
      team: team,
    }).select("name email");

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: "No users found for this team",
        team: team,
      });
    }

    res.status(200).json({
      message: "Users fetched successfully",
      team: team,
      users: users,
    });
  } catch (error) {
    console.error("Error fetching users by team:", error);
    res.status(500).json({
      message: "Error fetching users by team",
      error: error.message,
    });
  }
});

module.exports = router;
