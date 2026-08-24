import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.resolve(__dirname, "../../../DATABASE");

async function importDatabase() {
  await connectDB();

  const files = fs.readdirSync(DATABASE_DIR).filter((f) => f.endsWith(".json") && f !== "full_database_export.json");
  console.log(`Found ${files.length} collection JSON files to import.`);

  for (const file of files) {
    const colName = file.replace(".json", "");
    const filePath = path.join(DATABASE_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (!Array.isArray(data) || data.length === 0) {
      console.log(`Skipping empty collection file '${file}'`);
      continue;
    }

    const collection = mongoose.connection.db.collection(colName);
    
    // Clear existing collection data to avoid key duplicates
    await collection.deleteMany({});
    
    // Convert string $oid and $date if needed
    const parsedData = data.map((doc) => {
      if (doc._id && doc._id.$oid) doc._id = new mongoose.Types.ObjectId(doc._id.$oid);
      return doc;
    });

    await collection.insertMany(parsedData);
    console.log(`Imported ${parsedData.length} documents into '${colName}'`);
  }

  await mongoose.connection.close();
  console.log("Database import completed successfully!");
  process.exit(0);
}

importDatabase().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
