import "dotenv/config";
import cookieParser from "cookie-parser";
import http from "http";
import express from "express";
import cors from "cors";
import { Env } from "./config/env.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDB from "./config/database.config";
import passport, { initialize } from "passport";
import { HTTP_STATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import router from "./routes";
import { initializeSocket } from "./lib/socket";

const app = express();
const server = http.createServer(app);

//socket
initializeSocket(server);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.use(passport.initialize());

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    res
      .status(HTTP_STATUS.OK)
      .json({ message: "Server is running", status: "OK" });
  }),
);

app.use("/api", router);

app.use(errorHandler);

server.listen(Env.PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
