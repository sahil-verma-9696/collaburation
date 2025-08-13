import chalk from "chalk";
import User from "../models/User.js";

export function socketAuthAndMapping(namespace, idToSocketMap) {
  return async (socket, next) => {
    const { id: userId } = socket.handshake.query;

    if (!userId) {
      return next(new Error("User ID is required"));
    }

    try {
      // Mark user active in DB
      const updatedUser = await User.findByIdAndUpdate(userId, {
        status: "active",
      });

      // Map user → socket
      idToSocketMap.set(userId, socket.id);

      // Attach to socket for later use
      socket.userId = userId;
      socket.idToSocketMap = idToSocketMap;
      socket.user = updatedUser;

      const onlineUserIds = Array.from(socket.idToSocketMap.keys());

      namespace.emit("active_users", onlineUserIds);

      console.log(
        chalk.greenBright(`[SOCKET CONNECT]`) +
          ` User: ${chalk.cyan(userId)} | Socket ID: ${chalk.yellow(socket.id)}`
      );

      // On disconnect
      socket.on("disconnect", async () => {
        idToSocketMap.delete(userId);

        const onlineUserIds = Array.from(socket.idToSocketMap.keys()).filter(
          (userId) => userId !== socket.userId
        );

        namespace.emit("active_users", onlineUserIds);

        try {
          await User.findByIdAndUpdate(userId, { status: "offline" });
        } catch (err) {
          console.error(
            chalk.red(`Error setting user offline: ${err.message}`)
          );
        }

        console.log(
          chalk.redBright(`[SOCKET DISCONNECT]`) +
            ` User: ${chalk.cyan(userId)} | Socket ID: ${chalk.yellow(
              socket.id
            )}`
        );
      });

      next();
    } catch (err) {
      console.error(chalk.red(`Error during socket auth: ${err.message}`));
      return next(new Error("Authentication or DB update failed"));
    }
  };
}
