import mongoose from "mongoose";

const showUserList = new mongoose.Schema({
  userId: { type: String, require: true},
  show: {
    showId: { type: String, required: true},
    name: { type: String, required: true},
    year: { type: String, required: false },
    type: { type: String, required: false },
    poster_link: { type: String, required: false },
  },
  episode: { type: String, required: false, default: "1" },
  season: { type: String, required: false, default: "1" },
  watchList: { type: Boolean, required: true, default: false },
}, { timestamps: true });

export default mongoose.model("showUserList", showUserList);
