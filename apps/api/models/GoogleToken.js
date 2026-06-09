const mongoose = require("mongoose");

const googleTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // adjust this to your actual user model
    required: true,
    unique: true,
  },
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expiry_date: Number,
});

module.exports = mongoose.model("GoogleToken", googleTokenSchema);
