import "dotenv/config";
import mongoose from "mongoose";
import Student from "../src/models/Student.js";
import { connectDB } from "../src/config/db.js";

const studentsData = [
  {
    rfidTagUid: "579D1D3F",
    studentId: "2023-330049",
    firstName: "Djanaisah M.",
    lastName: "Benito",
    sex: "Female",
    schoolYear: "2026-2027",
    guardianContact: "09171234567",
    age: 21,
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    isActive: true,
  },
  {
    rfidTagUid: "EADF614C",
    studentId: "2023-132138",
    firstName: "Sean Gerome F.",
    lastName: "Recto",
    sex: "Male",
    schoolYear: "2026-2027",
    guardianContact: "09171234567",
    age: 21,
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    isActive: true,
  },
  {
    rfidTagUid: "873A325A",
    studentId: "2023-330059",
    firstName: "Wilpingston M.",
    lastName: "Lagunay",
    sex: "Male",
    schoolYear: "2026-2027",
    guardianContact: "09171234567",
    age: 21,
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    isActive: true,
  },
  {
    rfidTagUid: "87F8113F",
    studentId: "2023-330069",
    firstName: "Carlos Angello J.",
    lastName: "Bernardo",
    sex: "Male",
    schoolYear: "2026-2027",
    guardianContact: "09171234567",
    age: 21,
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    isActive: true,
  },
  {
    rfidTagUid: "6757805A",
    studentId: "2023-230083",
    firstName: "Delfin Joseph D.",
    lastName: "Feleo",
    sex: "Male",
    schoolYear: "2026-2027",
    guardianContact: "09171234567",
    age: 21,
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    isActive: true,
  },
  // Keep existing demo fallback records as well
  {
    rfidTagUid: "B3432B38",
    studentId: "2024-100123",
    firstName: "Maria",
    lastName: "Santos",
    sex: "Female",
    schoolYear: "2026-2027",
    guardianContact: "09179998888",
    age: 20,
    program: "BS Information Technology",
    yearLevel: "2nd Year",
    isActive: true,
  },
  {
    rfidTagUid: "17F7C664",
    studentId: "2024-888999",
    firstName: "Juan",
    lastName: "Dela Cruz",
    sex: "Male",
    schoolYear: "2026-2027",
    guardianContact: "09175554444",
    age: 21,
    program: "BS Information Technology",
    yearLevel: "3rd Year",
    isActive: true,
  },
];

async function main() {
  await connectDB();

  for (const s of studentsData) {
    const student = await Student.findOneAndUpdate(
      { studentId: s.studentId },
      s,
      { upsert: true, new: true }
    );
    console.log(`Seeded student: ${student.studentId} — ${student.firstName} ${student.lastName} (RFID: ${student.rfidTagUid})`);
  }

  console.log("All students seeded successfully!");
  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
