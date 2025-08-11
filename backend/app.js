import connectDB from "./database/connection.js";
import getHttpServer from "./rest/index.js";
import initialiseSocketServer from "./socket/index.js";

async function main() {
  // Your code here
  const PORT = 8000;
  const DATABASE_NAME = "test-chat";

  await connectDB(DATABASE_NAME);
  const httpServer = getHttpServer(PORT);
  initialiseSocketServer(httpServer);
}

main();
