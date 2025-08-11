import mongoose from "mongoose";

async function connectDB(DATABASE_NAME) {
  try {
    await mongoose.connect(`mongodb://localhost:27017/${DATABASE_NAME}`);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

export default connectDB;
