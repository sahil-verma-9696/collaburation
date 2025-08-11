import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip } from "lucide-react";
import { useChatSocketContext } from "@/contexts/ChatSocket";

// Static mock messages
const mockMessages = [
  {
    _id: "msg1",
    sender_id: "user456",
    recipient_id: "user123",
    content: "Hey! How are you doing?",
    attachments: [],
    is_read: true,
    sent_at: new Date(Date.now() - 3600000).toISOString(),
    read_at: new Date(Date.now() - 3500000).toISOString(),
  },
  {
    _id: "msg2",
    sender_id: "user123",
    recipient_id: "user456",
    content: "I'm doing great! Thanks for asking. How about you?",
    attachments: [],
    is_read: true,
    sent_at: new Date(Date.now() - 3400000).toISOString(),
    read_at: new Date(Date.now() - 3300000).toISOString(),
  },
  {
    _id: "msg3",
    sender_id: "user456",
    recipient_id: "user123",
    content: "Pretty good! Working on some exciting projects.",
    attachments: [],
    is_read: false,
    sent_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: "msg4",
    sender_id: "user123",
    recipient_id: "user456",
    content: "That sounds awesome! What kind of projects?",
    attachments: [],
    is_read: true,
    sent_at: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    _id: "msg5",
    sender_id: "user456",
    recipient_id: "user123",
    content:
      "I'm building a new chat application with React and Next.js. It's been really fun!",
    attachments: [],
    is_read: false,
    sent_at: new Date(Date.now() - 600000).toISOString(),
  },
];

export function ChatInterface({ friend }) {
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const user = {};
  useEffect(() => {
    // loadMessages()
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const sentMessage = {
      _id: "msg" + Date.now(),
      sender_id: user?._id,
      recipient_id: friend._id,
      content: newMessage.trim(),
      attachments: [],
      is_read: false,
      sent_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, sentMessage]);
    setNewMessage("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sentMessage),
      });

      if (!response.ok) {
        console.error("Failed to send message:", await response.text());
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
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

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <CardHeader className="border-b">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={"/placeholder.svg"} />
              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(
                friend.status
              )}`}
            />
          </div>
          <div>
            <CardTitle className="text-lg">{friend.name}</CardTitle>
            <p className="text-sm text-muted-foreground capitalize">
              {friend.status}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => {
            const isOwn = message.sender_id === user?._id;
            return (
              <div
                key={message._id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div
                    className={`flex items-center justify-between mt-1 ${
                      isOwn
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-xs">
                      {formatTime(message.sent_at)}
                    </span>
                    {isOwn && (
                      <span className="text-xs ml-2">
                        {message.is_read ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <CardContent className="border-t p-4">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <Button type="button" variant="outline" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
