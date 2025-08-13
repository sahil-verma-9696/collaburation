import User from "../../models/User.js";

export async function getProfile(req, res) {
  const { id } = req.params;

  if (!id) {
    res.status(400);
    throw new Error("User ID is required");
  }

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ message: "User found", user });
}

async function updateProfile(req, res) {}
