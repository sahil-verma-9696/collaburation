import chalk from "chalk";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./auth/routes.js";
import friendshipRoutes from "./friend-managment/route.js";
import userRoutes from "./user-managment/route.js";
import { errorHandler } from "../middleware/errorMiddleware.js";

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
app.use("/friendship", friendshipRoutes);

// user-managment namespace
app.use("/user", userRoutes);

app.use(errorHandler);

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
