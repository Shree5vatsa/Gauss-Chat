import { Router } from "express";

import authRoutes from "./auth.routes";
import chatRoutes from "./chat.routes";
import userRoutes from "./user.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/chat", chatRoutes);
router.use("/user", userRoutes);


export default router;
