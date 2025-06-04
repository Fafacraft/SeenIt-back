import mongoose from "mongoose";

const watchListSchema = new mongoose.Schema({
  userId: { type: String, require: true},
  showId: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  year: { type: String, required: false },
  type: { type: String, required: false },
  poster_link: { type: String, required: false },
  episode: { type: String, required: false },
  season: { type: String, required: false },
}, { timestamps: true });

export default mongoose.model("watchList", watchListSchema);
