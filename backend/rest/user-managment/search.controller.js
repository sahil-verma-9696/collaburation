import User from "../../models/User.js";

export async function search(req, res) {
  const { q } = req.query;
  const users = await User.find({
    $or: [
      { name: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ],
  });
  res.json(users);
}
