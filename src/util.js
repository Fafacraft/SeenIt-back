import showUserList from "./models/showUserList.js";

async function addshowUserList(req, res) {
  try {
    const { userId, show, season, episode, watchList } = req.body;
    const { showId, name, year, type, poster_link } = show;

    // Try to find existing entry
    const existing = await showUserList.findOne({ userId, "show.showId": show.showId });

    if (existing) {
      // Update fields if it already exists
      existing.show = show;
      existing.season = season;
      existing.episode = episode;
      existing.watchList = watchList;

      await existing.save();
      return res.status(200).json({ message: "Watchlist entry updated", updated: true });
    } else {
      // Create new entry
      const newEntry = new showUserList({
        userId,
        show,
        season,
        episode,
        watchList
      });

      await newEntry.save();
      return res.status(201).json({ message: "Watchlist entry added", created: true });
    }
  } catch (err) {
    console.error("Error adding/updating watchlist:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

export default addshowUserList;