import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./db.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { getUserCollection } from "./db.js";
import showUserList from "./models/showUserList.js";
import addshowUserList from "./util.js";

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API SeenIt");
});

// ROUTE: Create user
app.post("/api/user", async (req, res) => {
  const { pseudo, email, password } = req.body;

  if (!pseudo || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // check if user exist
    const existingUser = await User.findOne({ email });
    const existingUserPseudo = await User.findOne({ pseudo });
    if (existingUser) {
      return res.status(409).json({ message: "Email already taken" });
    } else if (existingUserPseudo) {
      return res.status(409).json({ message: "Pseudo already taken" });
    }

    // create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ pseudo, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User successfully created", userId: newUser._id });
  } catch (err) {
    console.error("User creation error :", err);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/api/login", async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    return res.status(409).json({ message: "Login and password are required." });
  }

  const users = await getUserCollection();
  const user = await users.findOne({
    $or: [
      { email: login },
      { pseudo: login }
    ]
  });

  if (!user) {
    return res.status(409).json({ message: "User not found." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(409).json({ message: "Invalid password." });
  }

  const sessionToken = jwt.sign(
    {
      uid: user._id,
      pseudo: user.pseudo,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(200).json({ token: sessionToken });
});

app.get("/api/verify", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid token." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Save decoded user info for use in route
    return res.status(200).json({ user: decoded });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
})

app.post("/api/showuserlist/update", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).send("No token provided");
  const token = authHeader.split(" ")[1];
  var decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).send("Invalid token");
  }

  req.body.userId = decoded.uid; // inject the UID directly into the body

  try {
    await addshowUserList(req, res);
  } catch (err) {
    console.error("Error in watchlist toggle:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/showuserlist/check", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).send("No token provided");
  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.uid;
  const { showId } = req.query;

  const exists = await showUserList.findOne({ userId: userId, "show.showId": showId });
  if (!exists) {
    return res.status(200).json(null);
  }

  return res.status(200).json({
    watchList: exists.watchList,
    episode: exists.episode,
    season: exists.season,
  });
});

app.get("/api/watchlist", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("No token provided");

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.uid;

    const list = await showUserList.find({ userId, watchList: true }).sort({ updatedAt: -1 });
    return res.status(200).json(list);
  } catch (err) {
    console.error("Failed to get watchlist:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/watched", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send("No token provided");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.uid;

    const watchedShows = await showUserList.find({
      userId,
      done: true,
    }).sort({ updatedAt: -1 });

    res.status(200).json(watchedShows);
  } catch (err) {
    console.error("Error fetching watched shows:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/startedShows", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send("No token provided");

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.uid;

    // Find shows with episode > 1 OR season > 1 for that user
    const startedShows = await showUserList.find({
      userId,
      $or: [
        { episode: { $gt: 1 } },
        { season: { $gt: 1 } },
      ],
      done: false,
    }).sort({ updatedAt: -1 });

    res.status(200).json(startedShows);
  } catch (err) {
    console.error("Error fetching started shows:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
