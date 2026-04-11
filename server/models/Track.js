const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema({
  title: String,
  artist: String,
  fileUrl: String,
});

module.exports = mongoose.model("Track", TrackSchema);