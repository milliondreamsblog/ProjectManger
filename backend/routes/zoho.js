// routes/zohoRoutes.js
const express = require("express");
const axios = require("axios");
const ZohoToken = require("../models/ZohoToken"); // Mongoose model

const router = express.Router();

// 🔑 Loaded from environment (see .env.example). Zoho is optional in the
// portfolio build — client data is seeded into the ClientName collection.
const ORG_ID = process.env.ZOHO_ORG_ID;
const CLIENT_ID = process.env.ZOHO_CLIENT_ID;
const CLIENT_SECRET = process.env.ZOHO_CLIENT_SECRET;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI || "http://localhost:5001/api/zoho/callback";

let REFRESH_TOKEN = null; // keep a copy in memory

// ✅ Function to fetch & save access token
async function getAccessToken(authCode = null, accountsServer = "https://accounts.zoho.com") {
  try {
    const url = `${accountsServer}/oauth/v2/token`;
    let params;

    if (REFRESH_TOKEN) {
      // Use refresh token if available
      params = new URLSearchParams({
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
      });
    } else if (authCode) {
      // First time: exchange auth code
      params = new URLSearchParams({
        code: authCode,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: ZOHO_REDIRECT_URI,
        grant_type: "authorization_code",
      });
    } else {
      throw new Error("No refresh token or auth code provided");
    }

    const res = await axios.post(url, params, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = res.data.access_token;

    // ⚠️ Only update refresh_token if Zoho provided one
    let refreshToken = REFRESH_TOKEN;
    if (res.data.refresh_token) {
      refreshToken = res.data.refresh_token;
      REFRESH_TOKEN = refreshToken;
    }

    // ✅ Fix: always use expires_in_sec, fallback 3600s
    const expiresAt = new Date(Date.now() + ((res.data.expires_in_sec || 3600) * 1000));

    // ✅ Save/Update token in DB
    await ZohoToken.findOneAndUpdate(
      {},
      {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      },
      { upsert: true, new: true }
    );

    console.log("✅ Access token fetched & saved in DB");
    return accessToken;
  } catch (err) {
    console.error("❌ Failed to fetch Zoho access token:", err.response?.data || err.message);
    throw new Error("Zoho authentication failed");
  }
}

// ✅ Callback route to receive auth code from Zoho
router.get("/callback", async (req, res) => {
  const { code, ["accounts-server"]: accountsServer } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code missing");
  }

  try {
    await getAccessToken(code, accountsServer || "https://accounts.zoho.com");
    res.send("✅ Zoho authorization successful!");
  } catch (err) {
    res.status(500).send("❌ Failed to get access token: " + err.message);
  }
});

// ✅ Route to fetch clients from Zoho Books
router.get("/clients", async (req, res) => {
  try {
    // Get token from DB
    let tokenDoc = await ZohoToken.findOne();
    console.log("🔑 Found token in DB:", tokenDoc);
    if (!tokenDoc) {
      return res.status(400).send("No token found. Please authorize Zoho first.");
    }

    // Keep REFRESH_TOKEN in memory for faster refresh calls
    REFRESH_TOKEN = tokenDoc.refresh_token;

    // Check if expired
    if (new Date() >= tokenDoc.expires_at) {
      console.log("⚠️ Access token expired, refreshing...");
      await getAccessToken(); // refresh token flow
      tokenDoc = await ZohoToken.findOne(); // re-fetch updated record
    }

    console.log("🔑 Using token:", tokenDoc.access_token);

    // ✅ Fetch clients from Zoho Books
    let resp;
    try {
      resp = await axios.get(
        `https://www.zohoapis.com/books/v3/contacts?organization_id=${ORG_ID}`, // 👈 use .in if your Books URL is .in
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${tokenDoc.access_token}`,
          },
        }
      );
    } catch (err) {
      // If token is invalid, try refreshing
      if (err.response?.data?.code === 57 || err.response?.data?.message?.includes("INVALID_OAUTHTOKEN")) {
        console.log("⚠️ Zoho token invalid, refreshing...");
        await getAccessToken(); // refresh token flow
        tokenDoc = await ZohoToken.findOne();
        resp = await axios.get(
          `https://www.zohoapis.com/books/v3/contacts?organization_id=${ORG_ID}`,
          {
            headers: {

              Authorization: `Zoho-oauthtoken ${tokenDoc.access_token}`,
            },
          }
        );
      } else {
        throw err;
      }
    }

    const clients = resp.data.contacts.map((c) => ({
      id: c.contact_id,
      name: c.contact_name,
      company_name: c.company_name || null,
      email: c.email || null,
    }));

    console.log("✅ Clients fetched:", clients.length);
    res.json({ clients });
  } catch (err) {
    console.error("❌ Zoho API error:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message || "Zoho API error",
    });
  }
});

module.exports = router;
