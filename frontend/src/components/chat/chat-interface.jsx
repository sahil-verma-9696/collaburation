import { useState, memo, useCallback } from "react";
import { Send, Paperclip } from "lucide-react";

import { useChatSocketContext } from "@/contexts/ChatSocket";
import { useGlobalContext } from "@/contexts/Global";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Header from "./chat-interface-header";
import MessageArea from "./message-area";

const ChatInterface = ({ friend }) => {
  const [newMessage, setNewMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [messages, setMessages] = useState([]);

  const { socket } = useChatSocketContext();
  const { user } = useGlobalContext();

  

  const memoSetMessages = useCallback(setMessages, []);

  /**
   * Sends a chat message to the recipient via WebSocket and updates local state.
   *
   * - Prevents sending empty messages.
   * - Creates a temporary message object with a unique ID and current timestamp.
   * - Emits a "stop typing" event before sending the message.
   * - Emits the "message" event to the server.
   * - Updates the local message list optimistically.
   * - Clears the input field after sending.
   *
   * @function sendMessage
   * @param {function} setMessages - React state setter function to update the messages list.
   * @returns {function} An `async` event handler `(e: Event) => Promise<void>` to be used
   *                     in a form submit or button click.
   */
  const sendMessage = (setMessages) => async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const sentMessage = {
      // _id: "msg" + Date.now(),
      sender_id: user?._id,
      recipient_id: friend._id,
      content: newMessage.trim(),
      attachments: [],
      is_read: false,
      sent_at: new Date().toISOString(),
    };

    // Emit stop typing
    socket.emit("typing", {
      sender_id: user._id,
      recipient_id: friend._id,
      status: "stop",
    });

    // Emit message
    socket.emit("message", sentMessage);

    setNewMessage("");
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (value.trim()) {
      socket.emit("typing", {
        sender_id: user._id,
        recipient_id: friend._id,
        status: "start",
      });

      // Stop typing after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        socket.emit("typing", {
          sender_id: user._id,
          recipient_id: friend._id,
          status: "stop",
        });
      }, 2000);

      setTypingTimeout(timeout);
    } else {
      socket.emit("typing", {
        sender_id: user._id,
        recipient_id: friend._id,
        status: "stop",
      });
    }
  };

  const handleKeyDown = (setMessages) => (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(setMessages)(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Header
        name={friend.name}
        avatar={friend.avatar}
        friendId={friend._id}
        status={friend.status}
      />

      {/* Messages */}
      <MessageArea
        friendId={friend._id}
        messages={messages}
        setMessages={memoSetMessages}
      />

      {/* Message Input */}
      <CardContent className="border-t p-4">
        <form onSubmit={sendMessage(setMessages)} className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={handleTyping}
            onKeyDown={handleKeyDown(setMessages)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={1000}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </div>
  );
};

export default memo(ChatInterface);
