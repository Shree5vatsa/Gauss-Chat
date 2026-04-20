"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
const get_env_1 = require("../utils/get-env");
exports.Env = {
    NODE_ENV: (0, get_env_1.getEnv)("NODE_ENV", "development"),
    PORT: (0, get_env_1.getEnv)("PORT", "4000"),
    MONGO_URI: (0, get_env_1.getEnv)("MONGO_URI"),
    JWT_SECRET: (0, get_env_1.getEnv)("JWT_SECRET", "my_secret_jwt"),
    JWT_EXPIRES_IN: (0, get_env_1.getEnv)("JWT_EXPIRES_IN", "15m"),
    FRONTEND_ORIGIN: (0, get_env_1.getEnv)("FRONTEND_ORIGIN", "http://localhost:5173"),
    CLOUDINARY_CLOUD_NAME: (0, get_env_1.getEnv)("CLOUDINARY_CLOUD_NAME"),
    CLOUDINARY_API_KEY: (0, get_env_1.getEnv)("CLOUDINARY_API_KEY"),
    CLOUDINARY_API_SECRET: (0, get_env_1.getEnv)("CLOUDINARY_API_SECRET"),
    GEMINI_API_KEY: (0, get_env_1.getEnv)("GEMINI_API_KEY"),
    OPENROUTER_API_KEY: (0, get_env_1.getEnv)("OPENROUTER_API_KEY"),
    GROQ_API_KEY: (0, get_env_1.getEnv)("GROQ_API_KEY"),
};
