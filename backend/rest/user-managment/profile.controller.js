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

export async function updateProfile(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  if (!id) {
    const err = new Error("User ID is required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(id).select("-password");
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  user.name = name;

  await user.save();

  res.json({ message: "User updated", user });
}
