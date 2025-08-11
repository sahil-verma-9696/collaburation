import { createContext, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { useGlobalContext } from "./Global";

const ChatSocketContext = createContext({
  socket: null,
});

export const ChatSocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user } = useGlobalContext();
  async function connectSocket() {
    const socket = io("http://localhost:8000/ws/chat", {
      query: { id: user?._id },
    });

    socketRef.current = socket;
  }

  if (!socketRef.current && user) {
    connectSocket();
  }
  return (
    <ChatSocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocketContext = () => useContext(ChatSocketContext);
