const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    zohoId: { type: String, unique: true, required: true }, // Zoho's unique ID
    name: { type: String, required: true },
    companyName: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
