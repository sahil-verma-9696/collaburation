import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useChatSocketContext } from "@/contexts/ChatSocket";
import { useGlobalContext } from "@/contexts/Global";

const MessageArea = (props) => {
  const { friendId, messages, setMessages } = props;

  const messagesEndRef = useRef(null);
  const messageRefs = useRef(new Map());
  const observerRef = useRef(null);

  const { socket } = useChatSocketContext();
  const { user } = useGlobalContext();

  // Intersection Observer for read receipts
  const setupIntersectionObserver = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const unreadMessageIds = [];

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            const message = messages.find((msg) => msg._id === messageId);
            const sender_id =
              typeof message.sender_id === "object"
                ? message.sender_id._id
                : message.sender_id;

            if (message && sender_id !== user?._id && !message.is_read) {
              unreadMessageIds.push(messageId);
            }
          }
        });

        if (unreadMessageIds.length > 0) {
          console.log(unreadMessageIds);
          socket.emit("read", { message_ids: unreadMessageIds });
        }
      },
      {
        threshold: 0.5,
        rootMargin: "0px",
      }
    );
  }, [messages, socket, user?._id]);

  //------------------------- Socket event handlers -----------------
  const wsMessageHandler = (setMessages) => (data) => {
    setMessages((prev) => {
      // Avoid duplicates
      if (prev.some((msg) => msg._id === data._id)) {
        return prev;
      }
      return [...prev, data];
    });
  };
  const wsReadHandler = (setMessages) => (data) => {
    console.log("read", data);
    if (data.confirmed) {
      // Update local messages as read
      setMessages((prev) =>
        prev.map((msg) =>
          data.message_ids.includes(msg._id)
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      );
    } else if (data.message_id) {
      // Someone read our message
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.message_id
            ? { ...msg, is_read: true, read_at: data.read_at }
            : msg
        )
      );
    }
  };
  const wsDeleteHandler = (setMessages) => (data) => {
    setMessages((prev) => prev.filter((msg) => msg._id !== data.message_id));
  };

  //-------------------------- utility functions ---------------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };
  const deleteMessage = (messageId) => {
    socket.emit("delete", { message_id: messageId });
  };

  //-------------------------- async functions ------------------------
  const getMessages = async (setMessages = () => {}, friendId) => {
    const res = await fetch(
      `http://localhost:8000/messages/${friendId}?limit=20`,
      {
        credentials: "include",
      }
    );
    const data = await res.json();
    setMessages(data.data.messages.reverse());
  };

  //-------------------------- all useEffects --------------------------
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    getMessages(setMessages, friendId);
  }, []);

  useEffect(() => {
    const handleMessageEvent = wsMessageHandler(setMessages);
    const handleReadEvent = wsReadHandler(setMessages);
    const handleDeleteEvent = wsDeleteHandler(setMessages);

    socket.on("message", handleMessageEvent);
    socket.on("read", handleReadEvent);
    socket.on("delete", handleDeleteEvent);

    return () => {
      socket.off("message", handleMessageEvent);
      socket.off("read", handleReadEvent);
      socket.off("delete", handleDeleteEvent);
    };
  }, [socket]);

  // Update observer when messages change
  useEffect(() => {
    setupIntersectionObserver();

    // Observe all unread messages from other users
    messages &&
      messages.forEach((message) => {
        const sender_id =
          typeof message.sender_id === "object"
            ? message.sender_id._id
            : message.sender_id;
        if (sender_id !== user?._id && !message.is_read) {
          const messageElement = messageRefs.current.get(message._id);
          if (messageElement && observerRef.current) {
            observerRef.current.observe(messageElement);
          }
        }
      });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, setupIntersectionObserver, user?._id]);

  return (
    <ScrollArea className="flex-1 p-4 overflow-auto">
      <div className="space-y-4">
        {messages.map((message) => {
          let isOwn = false;
          const sender_id =
            typeof message.sender_id === "object"
              ? message.sender_id._id
              : message.sender_id;

          isOwn = sender_id === user?._id;
          return (
            <div
              key={message._id}
              ref={(el) => {
                if (el) {
                  messageRefs.current.set(message._id, el);
                }
              }}
              data-message-id={message._id}
              className={`flex ${
                isOwn ? "justify-end" : "justify-start"
              } group`}
            >
              <div className="flex items-start space-x-2 max-w-[85%]">
                {isOwn && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => deleteMessage(message._id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Message
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.content}
                  </p>
                  <div
                    className={`flex items-center justify-between mt-1 gap-2 ${
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-xs">
                      {formatTime(message.sent_at)}
                    </span>
                    {isOwn && (
                      <span className="text-xs flex-shrink-0">
                        {message.is_read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default memo(MessageArea);
