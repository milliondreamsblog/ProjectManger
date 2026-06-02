const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authMiddleware");
const UserToken = require("../models/GoogleToken");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID_C,
  process.env.GOOGLE_CLIENT_SECRET_C,
  "http://localhost:5001/api/calendar/google/callback"
);

// ✅ STEP 1: Start Google Auth Flow (client opens this URL)
router.get("/google/auth", async (req, res) => {
  const token = req.query.token;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/calendar"],
      prompt: "consent",
      state: userId, // send userId as state
    });

    res.redirect(url);
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
});

// ✅ STEP 2: Google OAuth2 Callback (handles redirect after login)
router.get("/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const userId = req.query.state; // Extracted from previous state

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save or update user token in DB
    await UserToken.findOneAndUpdate(
      { userId },
      { ...tokens, userId },
      { upsert: true, new: true }
    );

    res.send(`<h2>✅ Google Calendar connected successfully!</h2><script>window.close()</script>`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Authentication failed");
  }
});

// ✅ STEP 3: Sync Event to Google Calendar (requires login)
router.post("/google/sync", authMiddleware, async (req, res) => {
  try {
    const tokenDoc = await UserToken.findOne({ userId: req.user.id });
    if (!tokenDoc) return res.status(401).json({ message: "Not authenticated with Google" });

    oauth2Client.setCredentials(tokenDoc.toObject());
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: req.body,
    });

    res.status(200).json({ message: "Event synced", event: response.data });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ message: "Failed to sync event", error: error.message });
  }
});

// ✅ STEP 4: Fetch Google Calendar Events
router.get("/google/fetch", authMiddleware, async (req, res) => {
  try {
    const tokenDoc = await UserToken.findOne({ userId: req.user.id });
    if (!tokenDoc) return res.status(401).json({ message: "Not authenticated with Google" });

    oauth2Client.setCredentials(tokenDoc.toObject());
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    res.status(200).json({ events: response.data.items });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

module.exports = router;
