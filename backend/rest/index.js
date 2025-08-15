import chalk from "chalk";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./auth/routes.js";
import userRoutes from "./user-managment/route.js";
import messagingRoutes from "./messaging/route.js";
import attachmentsRoutes from "./attachments/route.js";
import friendshipRoutes from "./friend-managment/route.js";
import notificationRoutes from "./notifications/route.js";

import { errorHandler } from "../middleware/errorMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

// TODO : enable cors
app.use(
  cors({
    origin: "http://localhost:5173", // frontend origin
    credentials: true,
  })
);

// auth namespace
app.use("/auth", authRoutes);

// friend-managment namespace
app.use("/friendship", protect, friendshipRoutes);

// user-managment namespace
app.use("/user", protect, userRoutes);

// messaging namespace
app.use("/messages", protect, messagingRoutes);

// attachments namespace
app.use("/attachments", protect, attachmentsRoutes);

// notifications namespace
app.use("/notifications", protect, notificationRoutes)

// hanndle errors
app.use(errorHandler);

/**
 *
 * @param {number} PORT
 * @returns {object} httpServer
 */
function getHttpServer(PORT) {
  const HOST = "localhost";
  const httpServer = app.listen(PORT, HOST, () =>
    console.log(
      chalk.gray(`App is listening on the `) +
        chalk.green.bold.underline(`http://${HOST}:${PORT}`)
    )
  );
  return httpServer;
}

export default getHttpServer;
