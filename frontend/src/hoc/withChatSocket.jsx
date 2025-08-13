import { ChatSocketProvider } from "@/contexts/ChatSocket";
import React from "react";

export default function withChatSocket(Component) {
  return () => <ChatSocketProvider>{<Component />}</ChatSocketProvider>;
}
