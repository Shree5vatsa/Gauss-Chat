"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearJwtAuthCookie = exports.setJwtAuthCookie = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_config_1 = require("../config/env.config");
const setJwtAuthCookie = async ({ res, userId }) => {
    const token = jsonwebtoken_1.default.sign({ userId }, env_config_1.Env.JWT_SECRET, {
        audience: ["user"],
        expiresIn: env_config_1.Env.JWT_EXPIRES_IN,
        // can specify: algorithm: "HS256"
    });
    return res.cookie("accessToken", token, {
        httpOnly: true,
        secure: env_config_1.Env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};
exports.setJwtAuthCookie = setJwtAuthCookie;
//logout logic
const clearJwtAuthCookie = (res) => res.clearCookie("accessToken", {
    path: "/",
    httpOnly: true,
    secure: env_config_1.Env.NODE_ENV === "production",
    sameSite: env_config_1.Env.NODE_ENV === "production" ? "strict" : "lax",
});
exports.clearJwtAuthCookie = clearJwtAuthCookie;
