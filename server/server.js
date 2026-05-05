const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require('multer');
const path = require('path');
const bcrypt = require("bcryptjs");

// Models - ensure these paths are correct for your folder structure
const User = require("./models/User");
const Track = require("./models/Track");
const Playlist = require("./models/Playlist");
const Composition = require("./models/Composition");

// --- THE CRITICAL FIX ---
// This tells Node: "Look at the folder I'm in, go up one, and find .env.local"
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 5001;

// --- 1. GLOBAL LOGGER ---
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] 🛰️  ${req.method} to ${req.url}`);
  next();
});

// --- 2. MIDDLEWARE ---
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'http://localhost:5174', 
    'http://127.0.0.1:5174'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. DATABASE CONNECTION ---
// Now process.env.MONGODB_URI will actually be defined!
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// --- 4. MULTER CONFIG ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, path.join(__dirname, 'uploads/')); },
  filename: (req, file, cb) => { cb(null, Date.now() + path.extname(file.originalname)); }
});
const upload = multer({ storage: storage });

// --- 5. AUTH ROUTES ---
app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, passwordHash: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User created", user });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/login", async (req, res) => {
  console.log("🔑 Login attempt for:", req.body.email);
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    res.json({ message: "Login successful", user });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- 6. TRACK & UPLOAD ROUTES ---
app.get("/api/tracks", async (req, res) => {
  try {
    const tracks = await Track.find();
    res.json(tracks);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post("/api/tracks/upload", upload.single('audio'), async (req, res) => {
  try {
    const { title, artist } = req.body;
    const newTrack = new Track({
      title,
      artist,
      fileUrl: `http://localhost:5001/uploads/${req.file.filename}`
    });
    await newTrack.save();
    res.status(201).json({ message: "Uploaded!", track: newTrack });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/tracks/:id", async (req, res) => { 
  console.log("🗑️ Deleting track ID:", req.params.id);
  try {
    const deletedTrack = await Track.findByIdAndDelete(req.params.id);
    if (!deletedTrack) return res.status(404).json({ message: "Track not found" });
    res.json({ message: "Track deleted successfully" });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- TEST ROUTE ---
app.get("/", (req, res) => {
  res.send("MusicMaker backend is running");
});

// --- 7. START ---
app.listen(PORT, () => {
  console.log(`🚀 STUDIO BACKEND LIVE AT: http://localhost:${PORT}`);
});

// --- COMPOSITION ROUTES ---
app.get("/api/compositions", async (req, res) => {
  try {
    const { visibility } = req.query;

    const filter = visibility ? { visibility } : {};
    const compositions = await Composition.find(filter).sort({ createdAt: -1 });

    res.json(compositions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/compositions", async (req, res) => {
  try {
    const { title, visibility, beatPattern, pianoRecording, tempo } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const composition = new Composition({
      title: title.trim(),
      visibility: visibility || "private",
      beatPattern: beatPattern || [],
      pianoRecording: pianoRecording || [],
      tempo: tempo || 120,
    });

    await composition.save();

    res.status(201).json({
      message: "Composition saved!",
      composition,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/compositions/:id", async (req, res) => {
  try {
    const deleted = await Composition.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Composition not found" });
    }

    res.json({ message: "Composition deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});