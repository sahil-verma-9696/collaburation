import { useState } from "react";
import ChatInterface from "@/components/chat/chat-interface";
import { FriendsList } from "@/components/chat/friends-list";

import { Card, CardContent } from "@/components/ui/card";
import { LogOut, MessageCircle } from "lucide-react";
import { useGlobalContext } from "@/contexts/Global";
import { useNavigate } from "react-router";
import Header from "@/components/chat/header";

const ChatPage = () => {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const navigate = useNavigate();

  const { user, setUser } = useGlobalContext();

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
  };

  const handleLogout = async () => {
    const res = await fetch("http://localhost:8000/auth/logout", {
      credentials: "include",
    });
    if (res.ok) {
      navigate("/");
      setUser(null);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header name={user.name} handleLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <FriendsList
          onSelectFriend={handleSelectFriend}
          selectedFriendId={selectedFriend?._id}
        />

        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <ChatInterface friend={selectedFriend} />
          ) : (
            <Card className="flex-1 flex items-center justify-center m-4">
              <CardContent className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Welcome to ChatApp
                </h2>
                <p className="text-muted-foreground">
                  Select a friend from the sidebar to start chatting
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
