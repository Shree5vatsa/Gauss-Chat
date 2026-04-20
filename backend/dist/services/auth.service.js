"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordService = exports.loginService = exports.registerService = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const app_Error_1 = require("../utils/app-Error");
const registerService = async (body) => {
    const { email } = body;
    const existingUser = await user_model_1.default.findOne({ email });
    if (existingUser) {
        throw new app_Error_1.UnauthorizedException("User already exists");
    }
    const newUser = new user_model_1.default({
        name: body.name,
        email: body.email,
        password: body.password,
        avatar: body.avatar,
    });
    await newUser.save();
    return newUser;
};
exports.registerService = registerService;
const loginService = async (body) => {
    const { email, password } = body;
    const user = await user_model_1.default.findOne({ email });
    if (!user)
        throw new app_Error_1.UnauthorizedException("Email or Password not found");
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched)
        throw new app_Error_1.UnauthorizedException("Invalid Email or Password");
    return user;
};
exports.loginService = loginService;
const changePasswordService = async (userId, newPassword) => {
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        throw new app_Error_1.BadRequestException("User not found");
    }
    user.password = newPassword;
    await user.save();
    return user;
};
exports.changePasswordService = changePasswordService;
