import chalk from "chalk";
import User from "../models/User.js";

export function socketAuthAndMapping(idToSocketMap) {
  return async (socket, next) => {
    const { id: userId } = socket.handshake.query;

    if (!userId) {
      return next(new Error("User ID is required"));
    }

    // Set status to "active" in DB
    let user = null;
    try {
      user = await User.findByIdAndUpdate(userId, { status: "active" });
    } catch (err) {
      console.error("Error setting user active:", err.message);
    }

    // Save mapping
    idToSocketMap.set(userId, socket.id);

    // Attach to socket for easy access later
    socket.userId = userId;
    socket.idToSocketMap = idToSocketMap;
    socket.user = user;

    console.log(
      chalk.yellowBright(`User ${userId} connected with socket ID ${socket.id}`)
    );

    // Remove mapping when disconnected
    socket.on("disconnect", async () => {
      // Remove mapping
      idToSocketMap.delete(userId);

      // Set status to "offline" in DB
      try {
        await User.findByIdAndUpdate(userId, { status: "offline" });
      } catch (err) {
        console.error("Error setting user offline:", err.message);
      }
      console.log(`User ${userId} disconnected`);
    });

    next();
  };
}
