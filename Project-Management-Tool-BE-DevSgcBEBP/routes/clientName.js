const express = require("express");
const router = express.Router();
const Client = require("../models/ClientName");
const authMiddleware = require("../middlewares/authMiddleware");

// 🔹 Get all clients
// backend route /all
router.get("/all", async (req, res) => {
  try {
    const clients = await Client.find({}, "name").sort({ name: 1 });
    res.json(clients.map(c => c.name)); // ensures array of strings
  } catch (error) {
    res.status(500).json({ message: "Error fetching clients" });
  }
});



// 🔹 Bulk insert clients
// 🔹 Bulk insert clients
router.post("/bulk", async (req, res) => {
  try {
    const { clients } = req.body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return res.status(400).json({ message: "Clients array is required" });
    }

    console.log("➡️ Total clients received:", clients.length);

    // Clean and map
    const cleanClients = clients
      .filter((c) => c && c.id && c.name) // must have Zoho ID + name
      .map((c) => ({
        zohoId: c.id,
        name: c.name.trim(),
        companyName: c.company_name || "",
        email: c.email || "",
      }));

    console.log("✅ After cleaning:", cleanClients.length);

    // Find existing Zoho IDs
    const existing = await Client.find(
      { zohoId: { $in: cleanClients.map((c) => c.zohoId) } },
      "zohoId"
    );
    const existingIds = existing.map((c) => c.zohoId);
    console.log("⚠️ Existing in DB:", existingIds.length);

    // Filter only new clients
    const newClients = cleanClients.filter(
      (c) => !existingIds.includes(c.zohoId)
    );
    console.log("🆕 New clients to insert:", newClients.length);

    let inserted = [];
    if (newClients.length > 0) {
      try {
        inserted = await Client.insertMany(newClients, { ordered: false });
      } catch (err) {
        if (err.code === 11000) {
          console.warn("⚠️ Duplicate error, skipping duplicates");
        } else {
          throw err;
        }
      }
    }

    res.status(201).json({
      message: "Clients processed",
      added: inserted,
      skipped: existingIds,
    });
  } catch (error) {
    console.error("❌ Failed to bulk insert clients:", error);
    res.status(500).json({ message: "Error inserting clients" });
  }
});


module.exports = router;
