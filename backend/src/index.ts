import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { Env } from "./config/env.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDB from "./config/database.config";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: Env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);

app.use(errorHandler);

app.listen(Env.PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
