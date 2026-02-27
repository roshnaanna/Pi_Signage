const express = require("express");
const router = express.Router();
const Media = require("../models/media");
const upload = require("../utils/multer");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../utils/cloudinary");

// ================= Helper: Format Date =================
function formatDate(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ================= GET PLAYLIST (Admin formatted) =================
router.get("/", async (req, res) => {
  try {
    const playlist = await Media.find().sort({ order: 1 });

    const formatted = playlist.map((item) => ({
      id: item._id,
      type: item.type.toUpperCase(),
      title: item.title,
      url: item.url,
      duration: item.duration || null,
      order: item.order,
      created: formatDate(item.createdAt),
      status: "Active",
      preview:
        item.type === "image"
          ? `<img src="${item.url}" style="height:40px;border-radius:4px;">`
          : "—",
    }));

    res.json({
      pageTitle: "Playlist Data",
      subtitle: "Live playlist items fetched from the system",
      items: formatted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= GET RAW PLAYLIST (for /display) =================
router.get("/raw", async (req, res) => {
  try {
    const playlist = await Media.find().sort({ order: 1 });
    res.json(playlist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADD ITEM TO PLAYLIST =================
router.post("/", upload.array("file"), async (req, res) => {
  try {
    // FILE UPLOAD
    if (req.files && req.files.length > 0) {
      let count = await Media.countDocuments(); // 🔥 FIXED (let instead of const)
      const savedFiles = [];

      for (const file of req.files) {
        const type = file.mimetype.startsWith("video") ? "video" : "image";
        const fileUrl = `/uploads/${file.filename}`;

        const media = new Media({
          type,
          title: file.originalname,
          url: fileUrl,
          duration: null,
          order: count,
        });

        await media.save();
        savedFiles.push(media);
        count++; // safe now
      }

      return res.json({
        success: true,
        message: "Files uploaded successfully",
        files: savedFiles,
      });
    }

    // JSON BODY
    const { type, url, title, duration } = req.body;

    if (!type || !url) {
      return res
        .status(400)
        .json({ error: "Missing required fields: type and url" });
    }

    const count = await Media.countDocuments();

    const media = new Media({
      type,
      title,
      url,
      duration: duration || null,
      order: count,
    });

    await media.save();
    res.json({ success: true, media });
  } catch (err) {
    console.error("Error adding to playlist:", err);
    res.status(500).json({ error: err.message });
  }
});

// ================= REORDER PLAYLIST =================
router.post("/reorder", async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ error: "Request body must be an array" });
    }

    for (let i = 0; i < req.body.length; i++) {
      await Media.findByIdAndUpdate(req.body[i].id, { order: i });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE SINGLE ITEM =================
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const media = await Media.findById(id);

    if (!media) return res.status(404).json({ error: "Not found" });

    // Delete local file
    if (media.url && media.url.startsWith("/uploads/")) {
      const rel = media.url.replace(/^\//, "");
      const filePath = path.join(__dirname, "..", rel);

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete from Cloudinary
    if (media.url && media.url.includes("res.cloudinary.com")) {
      try {
        const parts = media.url.split("/upload/");
        if (parts[1]) {
          let publicPath = parts[1];
          publicPath = publicPath.replace(/v\d+\//, "");
          publicPath = publicPath.replace(/\.[^/.]+$/, "");

          await cloudinary.uploader.destroy(publicPath, {
            resource_type:
              media.type === "video" ? "video" : "image", // 🔥 FIXED
          });
        }
      } catch (e) {
        console.warn("Cloudinary delete failed", e.message);
      }
    }

    await Media.findByIdAndDelete(id);

    // Reorder remaining
    const remaining = await Media.find().sort({ order: 1 });
    for (let i = 0; i < remaining.length; i++) {
      await Media.findByIdAndUpdate(remaining[i]._id, { order: i });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= DELETE ALL =================
router.delete("/", async (req, res) => {
  try {
    const all = await Media.find();

    for (const media of all) {
      if (media.url && media.url.startsWith("/uploads/")) {
        const rel = media.url.replace(/^\//, "");
        const filePath = path.join(__dirname, "..", rel);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      if (media.url && media.url.includes("res.cloudinary.com")) {
        try {
          const parts = media.url.split("/upload/");
          if (parts[1]) {
            let publicPath = parts[1];
            publicPath = publicPath.replace(/v\d+\//, "");
            publicPath = publicPath.replace(/\.[^/.]+$/, "");

            await cloudinary.uploader.destroy(publicPath, {
              resource_type:
                media.type === "video" ? "video" : "image", // 🔥 FIXED
            });
          }
        } catch (e) {
          console.warn("Cloudinary delete failed", e.message);
        }
      }
    }

    await Media.deleteMany({});
    res.json({ success: true, message: "Playlist cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;