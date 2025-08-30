import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import Internship from "./models/internshipPosting.js";
import internshipSeedData from "./data.js";
dotenv.config();

async function main(){
    try{
        await mongoose.connect("mongodb+srv://rahulsannamath29_db_user:j1XVQSOSenaFBBkt@cluster0.p83mb5y.mongodb.net/internshipDB?retryWrites=true&w=majority");
        console.log("✅ Connected to MongoDB");
    }
    catch(e){
        console.error("❌ MongoDB connection error:", e);
        process.exit(1);
    }
}

main();

async function initDB() {
    try{
        await Internship.insertMany(internshipSeedData);
        console.log("✅ Database initialized with seed data");
    }
    catch(e){
        console.error("❌ Error initializing database:", e);
    }
}

initDB();