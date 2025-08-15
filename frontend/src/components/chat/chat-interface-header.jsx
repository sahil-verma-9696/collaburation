import React, { memo, useEffect, useRef, useState } from "react";
import { CardHeader, CardTitle } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useChatSocketContext } from "@/contexts/ChatSocket";

const Header = ({ name, avatar, friendId, userId }) => {
  const [isTyping, setIsTyping] = useState(false);
  const [status, setStatus] = useState("offline");

  const { socket } = useChatSocketContext();

  useEffect(() => {
    const typingHandler = getTypingHandler(setIsTyping);
    const onlineUsersHandler = getOnlineUsersHandler(
      setStatus,
      friendId,
      userId
    );

    socket.on("get_online_users", onlineUsersHandler);
    socket.on("typing", typingHandler);
    return () => {
      socket.off("get_online_users", onlineUsersHandler);
      socket.off("typing", typingHandler);
    };
  }, [socket]);

  return (
    <CardHeader className="border-b px-4 py-3">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar || "/placeholder.svg"} />
            <AvatarFallback className="text-sm font-medium">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(
              status
            )}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate">{name}</CardTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {isTyping ? "typing..." : status}
          </p>
        </div>
      </div>
    </CardHeader>
  );
};

function getStatusColor(status) {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}
function getTypingHandler(setIsTyping) {
  return (data) => {
    const { status } = data;
    setIsTyping(status === "start");
  };
}

function getOnlineUsersHandler(setStatus, friendId, userId) {
  return (data) => {
    // console.log("onlineUser", data);
    if (typeof data === "object") {
      if (data[friendId]) {
        setStatus(() => {
          switch (data[friendId].status) {
            case "offline":
              return new Date(data[friendId].lastSeen).toLocaleTimeString();

            case "active":
              return "active";

            case "online":
              if (data[friendId].for === userId) {
                return "online";
              }
              return "away";
            default:
              return "offline";
              break;
          }
        });
      }
    }
  };
}

export default memo(Header);
