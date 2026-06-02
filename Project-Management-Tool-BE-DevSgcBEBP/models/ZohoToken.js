// models/ZohoToken.js
const mongoose = require("mongoose");

const ZohoTokenSchema = new mongoose.Schema({
  access_token: String,
  refresh_token: String,
  expires_at: Date, // when the token will expire
});

module.exports = mongoose.model("ZohoToken", ZohoTokenSchema);