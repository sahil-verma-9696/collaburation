import chalk from "chalk";
import User from "../models/User.js";

export function socketAuthAndMapping(
  namespace,
  idToSocketMap,
  activeUsersIds,
  onlineUsersIds,
  idToStatusMap
) {
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

      idToStatusMap.set(userId, {
        status: "active",
        lastSeen: new Date().toString(),
      });

      // Add user to active users list
      activeUsersIds.add(userId);

      // Attach to socket for later use
      socket.userId = userId;
      socket.idToSocketMap = idToSocketMap;
      socket.user = updatedUser;
      socket.activeUsersIds = activeUsersIds;
      socket.onlineUsersIds = onlineUsersIds;
      socket.idToStatusMap = idToStatusMap;

      // const onlineUserIds = Array.from(socket.idToSocketMap.keys());

      namespace.emit("get_online_users", Object.fromEntries(idToStatusMap));

      console.log(
        chalk.greenBright(`[SOCKET CONNECT]`) +
          ` User: ${chalk.cyan(userId)} | Socket ID: ${chalk.yellow(socket.id)}`
      );

      console.log(chalk.cyanBright(`[ACTIVE USERS]`), activeUsersIds);

      // On disconnect
      socket.on("disconnect", async () => {
        idToSocketMap.delete(userId);
        activeUsersIds.delete(userId);
        idToStatusMap.set(userId, {
          status: "offline",
          lastSeen: new Date().toString(),
        });

        namespace.emit("get_online_users", Object.fromEntries(idToStatusMap));

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
        console.log(chalk.cyanBright(`[ACTIVE USERS]`), activeUsersIds);
        // console.log(chalk.cyanBright(`[ONLINE USERS]`), onlineUsersIds);
      });

      next();
    } catch (err) {
      console.error(chalk.red(`Error during socket auth: ${err.message}`));
      return next(new Error("Authentication or DB update failed"));
    }
  };
}
