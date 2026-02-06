import mongoose from "mongoose";
import { Env } from "./env.config";

const connectDB = async () => {
    try {
        await mongoose.connect(Env.MONGO_URI);
        console.log("Database connected Successfully");
    } catch (error) {
        console.log("Error connecting in database", error);
        process.exit(1);
    }
}

export default connectDB;