const bcrypt = require("bcryptjs");

const User = require("./models/User");
const Track = require("./models/Track");
const Playlist = require("./models/Playlist");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config({ path: "../.env.local" });

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const Composition = require("./models/Composition");

app.post("/api/compositions", async (req, res) => {
  try {
    const composition = new Composition(req.body);
    await composition.save();
    res.status(201).json(composition);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/compositions/public", async (req, res) => {
  try {
    const compositions = await Composition.find({ visibility: "public" });
    res.json(compositions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/api/users", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      passwordHash: hashedPassword,
    });

    await user.save();

    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tracks", async (req, res) => {
  try {
    const track = new Track(req.body);
    await track.save();
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tracks", async (req, res) => {
  try {
    const tracks = await Track.find();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/playlists", async (req, res) => {
  try {
    const playlist = new Playlist(req.body);
    await playlist.save();
    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/playlists", async (req, res) => {
  try {
    const playlists = await Playlist.find().populate("userId").populate("tracks");
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const Composition = require("./models/Composition");

app.get("/api/compositions/public", async (req, res) => {
  try {
    const compositions = await Composition.find({
      visibility: "public",
    }).sort({ createdAt: -1 });

    res.json(compositions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});