const mongoose = require("mongoose");

const PlaylistSchema = new mongoose.Schema({
  name: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  tracks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
    },
  ],
});

module.exports = mongoose.model("Playlist", PlaylistSchema);