const mongoose = require("mongoose");

const CompositionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    beatPattern: { type: Array, default: [] },
    pianoRecording: { type: Array, default: [] },
    tempo: { type: Number, default: 120 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Composition", CompositionSchema);