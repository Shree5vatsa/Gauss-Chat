"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("./env.config");
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(env_config_1.Env.MONGO_URI);
        console.log("Database connected Successfully");
    }
    catch (error) {
        console.log("Error connecting in database", error);
        process.exit(1);
    }
};
exports.default = connectDB;
