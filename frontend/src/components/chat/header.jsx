import { LogOut, MessageCircle } from "lucide-react";
import React, { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Notifications } from "@/components/chat/notifications";
import { Button } from "@/components/ui/button";
import { useChatSocketContext } from "@/contexts/ChatSocket";

export default function Header({ name, handleLogout }) {
  const { socket } = useChatSocketContext();


  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">ChatApp</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Notifications />

          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{name}</span>
          </div>

          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
