import jwt from "jsonwebtoken";
import { Response } from "express"; // Import from express
import { Env } from "../config/env.config";

type Time = `${number}${"s" | "m" | "h" | "d" | "w" | "y"}`;

type CookieParams = {
  res: Response;
  userId: string;
};

export const setJwtAuthCookie = async ({ res, userId }: CookieParams) => {
  const token = jwt.sign({ userId }, Env.JWT_SECRET, {
    audience: ["user"],
    expiresIn: Env.JWT_EXPIRES_IN as Time,
    // can specify: algorithm: "HS256"
  });

  return res.cookie("accessToken", token, {
    httpOnly: true,
    secure: Env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

//logout logic
export const clearJwtAuthCookie = (res: Response) =>
  res.clearCookie("accessToken", {
    path: "/",
    httpOnly: true,
    secure: Env.NODE_ENV === "production",
    sameSite: Env.NODE_ENV === "production" ? "strict" : "lax",
  });
