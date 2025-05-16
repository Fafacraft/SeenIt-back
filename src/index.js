import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./db.js";
import User from "./models/User.js";

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
    if (existingUser) {
      return res.status(409).json({ message: "Email already taken" });
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

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
