import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useGlobalContext } from "./Global";

const DEBUG = false;
const ChatSocketContext = createContext({
  socket: null,
  isConnected: false,
  connectSocket: () => {},
  disconnectSocket: () => {},
});

export const ChatSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useGlobalContext();

  const socketRef = useRef(null);
  const isConnectingRef = useRef(false);

  const connectSocket = async () => {
    if (!user?._id || isConnectingRef.current) return;

    // Don't create new socket if already exists and connected
    if (socketRef.current && socketRef.current.connected) {
      return;
    }

    isConnectingRef.current = true;

    try {
      DEBUG && console.log("Creating new socket connection...");

      const newSocket = io("http://localhost:8000/ws/chat", {
        query: { id: user._id },
      });

      // Store in ref for cleanup
      socketRef.current = newSocket;

      // Connection event listeners
      newSocket.on("connect", () => {
        DEBUG && console.log("Socket connected:", newSocket.id);
        setIsConnected(true);
        isConnectingRef.current = false;
      });

      newSocket.on("disconnect", (reason) => {
        DEBUG && console.log("Socket disconnected:", reason);
        setIsConnected(false);
        isConnectingRef.current = false;
      });

      newSocket.on("connect_error", (error) => {
        DEBUG && console.error("Socket connection error:", error);
        setIsConnected(false);
        isConnectingRef.current = false;
      });

      setSocket(newSocket);
    } catch (error) {
      console.error("Failed to create socket connection:", error);
      isConnectingRef.current = false;
    }
  };

  const disconnectSocket = () => {
    DEBUG && console.log("Disconnecting socket...");

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
    isConnectingRef.current = false;
  };

  // Connect when user is available
  useEffect(() => {
    if (user?._id) {
      connectSocket();
    }
  }, [user?._id]);

  // Cleanup on unmount (when leaving chat page)
  useEffect(() => {
    return () => {
      DEBUG && console.log("ChatSocketProvider unmounting, cleaning up...");
      disconnectSocket();
    };
  }, []);

  const contextValue = {
    socket,
    isConnected,
    connectSocket,
    disconnectSocket,
  };

  return (
    <ChatSocketContext.Provider value={contextValue}>
      {children}
    </ChatSocketContext.Provider>
  );
};

export const useChatSocketContext = () => {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error(
      "useChatSocketContext must be used within a ChatSocketProvider"
    );
  }
  return context;
};
