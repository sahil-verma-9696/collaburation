import User from "../../models/User.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { generateToken } from "../../utils/generateToken.js";

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // 1️⃣ Validate request body
  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.statusCode = 400;
    throw err;
  }

  // 2️⃣ Find user & explicitly select password
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  // 3️⃣ Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  // 4️⃣ Generate token
  const token = generateToken(user._id);

  // 5️⃣ Send cookie
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // 6️⃣ Send response without password
  res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profile_picture: user.profile_picture,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});
