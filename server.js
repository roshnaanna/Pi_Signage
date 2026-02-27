require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

const uploadRoutes = require("./routes/upload");
const playlistRoutes = require("./routes/playlistRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());

// ================= STATIC FILES =================
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve public folder (admin + display)
app.use(express.static(path.join(__dirname, "public")));

// ================= ROUTES =================
app.use("/api/upload", uploadRoutes);
app.use("/api/playlist", playlistRoutes);

// Admin panel
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public/admin/index.html"));
});

// Display screen
app.get("/display", (req, res) => {
  res.sendFile(path.join(__dirname, "public/display/index.html"));
});

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/admin");
});

// ================= MONGOOSE SETTINGS =================
mongoose.set("strictQuery", false);

// ================= CONNECT TO MONGODB =================
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB connection error:");
    console.error(err.message);
    process.exit(1);
  }
}

startServer();
