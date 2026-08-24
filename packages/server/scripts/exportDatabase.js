import "dotenv/config";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../src/config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = path.resolve(__dirname, "../../../DATABASE");

async function exportDatabase() {
  await connectDB();

  if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true });
  }

  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections in database.`);

  const fullDump = {};

  for (const col of collections) {
    const colName = col.name;
    const documents = await mongoose.connection.db.collection(colName).find({}).toArray();
    
    // Save per-collection JSON
    const filePath = path.join(DATABASE_DIR, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf-8");
    console.log(`Exported ${documents.length} documents from '${colName}' to ${colName}.json`);

    fullDump[colName] = documents;
  }

  // Save combined export
  const fullDumpPath = path.join(DATABASE_DIR, "full_database_export.json");
  fs.writeFileSync(fullDumpPath, JSON.stringify(fullDump, null, 2), "utf-8");
  console.log(`Exported full database dump to full_database_export.json`);

  await mongoose.connection.close();
  console.log("Database export completed successfully!");
  process.exit(0);
}

exportDatabase().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
