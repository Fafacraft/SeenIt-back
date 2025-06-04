import mongoose from "mongoose";
import dotenv from "dotenv";
import {MongoClient} from "mongodb";


dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB :", err);
    process.exit(1);
  }
};

async function getUserCollection() {
  if (!client.isConnected) await client.connect();
  const db = client.db("SeenIt");
  return db.collection("users");
}

async function getshowUserListCollection() {
  if (!client.isConnected) await client.connect();
  const db = client.db("SeenIt");
  return db.collection("showUserList");
}

export {getUserCollection, getshowUserListCollection};