import { Router } from "express";
import { passportAuthenticateJwt } from "../config/passport.config";
import {
  getUserController,
  updateProfileController,
  deleteAccountController,
} from "../controllers/user.controller";

const userRoutes = Router()
  .use(passportAuthenticateJwt)
  .get("/all", getUserController)
  .put("/profile", updateProfileController)
  .delete("/account", deleteAccountController);

export default userRoutes;
