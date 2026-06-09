const mongoose = require("mongoose");
require("dotenv").config();

let memoryServer = null;

const connectDB = async () => {
    try {
        let uri = process.env.MONGO_URI;

        // Zero-config local dev: if no MONGO_URI is provided, spin up an
        // ephemeral in-memory MongoDB so the app runs with no setup.
        // (Data is NOT persisted across restarts.)
        if (!uri) {
            const { MongoMemoryServer } = require("mongodb-memory-server");
            console.log("ℹ️  MONGO_URI not set — starting in-memory MongoDB (dev mode, data not persisted)...");
            memoryServer = await MongoMemoryServer.create();
            uri = memoryServer.getUri("SGC");
            process.env.MONGO_URI = uri;
            process.env.USING_MEMORY_DB = "true";
        }

        await mongoose.connect(uri);
        console.log("✅ MongoDB Connected Successfully");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
