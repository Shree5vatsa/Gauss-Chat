"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_config_1 = require("./config/env.config");
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const database_config_1 = __importDefault(require("./config/database.config"));
const passport_1 = __importDefault(require("passport"));
const http_config_1 = require("./config/http.config");
const asyncHandler_middleware_1 = require("./middlewares/asyncHandler.middleware");
const routes_1 = __importDefault(require("./routes"));
const socket_1 = require("./lib/socket");
const chats_controller_1 = require("./controllers/chats.controller");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
//socket
(0, socket_1.initializeSocket)(server);
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: env_config_1.Env.FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
}));
app.use(passport_1.default.initialize());
app.get("/health", (0, asyncHandler_middleware_1.asyncHandler)(async (req, res) => {
    res
        .status(http_config_1.HTTP_STATUS.OK)
        .json({ message: "Server is running", status: "OK" });
}));
app.use("/api", routes_1.default);
app.use(errorHandler_middleware_1.errorHandler);
server.listen(env_config_1.Env.PORT, async () => {
    await (0, database_config_1.default)();
    await (0, chats_controller_1.ensureAIUserExists)();
    console.log(`Server is running on port ${env_config_1.Env.PORT} in ${env_config_1.Env.NODE_ENV} mode`);
});
