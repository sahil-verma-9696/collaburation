import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
configDotenv();

import User from "../models/User.js";
import { asyncHandler } from "../utils/async-handler.js";

export const protect = asyncHandler(async (req, res, next) => {

  // 1️⃣ Get token from HTTP-only cookie
  const token = req.cookies?.token;

  if (!token) {
    const err = new Error("Not authorized, token missing");
    err.statusCode = 401;
    throw err;
  }

  // 2️⃣ Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    const err = new Error("Not authorized, invalid token");
    err.statusCode = 401;
    throw err;
  }

  // 3️⃣ Fetch user without password
  const user = await User.findById(decoded.id).select("-password");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  // 4️⃣ Attach user to req
  req.user = user;
  next();
});
