const axios = require("axios");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send an Expo push notification to one or more Expo push tokens.
 * No-op when there are no tokens. Safe to call without awaiting strictly.
 *
 * @param {string[]} tokens - Expo push tokens (ExponentPushToken[...])
 * @param {string} title
 * @param {string} body
 * @param {object} [data] - arbitrary payload delivered to the app
 */
const sendExpoPush = async (tokens, title, body, data = {}) => {
  const valid = (tokens || []).filter((t) => typeof t === "string" && t.startsWith("ExponentPushToken"));
  if (valid.length === 0) return;

  const messages = valid.map((to) => ({ to, sound: "default", title, body, data }));

  try {
    await axios.post(EXPO_PUSH_URL, messages, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
    });
  } catch (err) {
    console.error("Expo push failed:", err.response?.data || err.message);
  }
};

module.exports = { sendExpoPush };
