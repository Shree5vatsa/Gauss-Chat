import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { Env } from "./config/env.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import connectDB from "./config/database.config";
import passport from "passport";
import { HTTP_STATUS } from "./config/http.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import router from "./routes";

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

app.use(passport.initialize());

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.status(HTTP_STATUS.OK).json({ message: "Server is running" , status:"OK"});
  })
)

app.use("/api", router);


app.use(errorHandler);

app.listen(Env.PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${Env.PORT} in ${Env.NODE_ENV} mode`);
});
