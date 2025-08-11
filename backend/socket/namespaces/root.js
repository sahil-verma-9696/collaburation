export function rootNamespaceHandler(_) {
  return async function (socket) {
    const { id: currUserId } = socket.handshake.query;
    const currUserSocketId = socket.id;

    console.log("Connected to root namespace, user:", currUserId);

    socket.on("disconnect", async () => {
      console.log("Disconnected from root namespace, user:", currUserId);
    });
  };
}
