"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
//zod being a runtime vlaidation library
// Zod schemas:
// Exist at runtime
// Can validate actual data
// Can throw errors
exports.emailSchema = zod_1.z
    .string()
    .trim()
    .email("Invalid email address")
    .min(1);
exports.passwordSchema = zod_1.z.string().trim().min(1);
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    email: exports.emailSchema,
    password: exports.passwordSchema,
    avatar: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: exports.emailSchema,
    password: exports.passwordSchema,
});
exports.changePasswordSchema = zod_1.z.object({
    newPassword: exports.passwordSchema,
});
