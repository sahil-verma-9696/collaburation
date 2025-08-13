import { useRef, useState } from "react";
import { Search, UserPlus, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGlobalContext } from "@/contexts/Global";

export function FriendsList({ onSelectFriend, selectedFriendId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const { user } = useGlobalContext();

  // get all friends ✅
  const friendsRef = useRef(null);

  /**
   * @description get all friends
   * @param {function} setFriends
   */
  async function getFriends(setFriends) {
    const res = await fetch("http://localhost:8000/friendship", {
      credentials: "include",
    });
    const data = await res.json();
    const friends = data
      .filter((friendship) => friendship.status === "accepted")
      .map((friendship) => {
        const requester = friendship.requester_id;
        const recipient = friendship.recipient_id;
        if (requester._id === user._id) {
          return recipient;
        }
        if (recipient._id === user._id) {
          return requester;
        }
        return null;
      });

    setFriends(friends);
  }
  if (!friendsRef.current) {
    getFriends(setFriends);
    friendsRef.current = true;
  }

  const friendReqRef = useRef(null);
  /**
   * @description get all received friend requests
   * @param {function} setReceivedRequests
   */
  async function getFriendRequests(setReceivedRequests) {
    const res = await fetch(
      "http://localhost:8000/friendship/requests/received",
      {
        credentials: "include",
      }
    );
    const data = await res.json();
    setReceivedRequests(data);
  }
  if (!friendReqRef.current) {
    getFriendRequests(setReceivedRequests);
    friendReqRef.current = true;
  }

  const sentReqRef = useRef(null);
  /**
   * @description get all sent friend requests
   * @param {function} setSentRequests
   */
  async function getSentRequests(setSentRequests) {
    const res = await fetch("http://localhost:8000/friendship/requests/sent", {
      credentials: "include",
    });
    const data = await res.json();
    setSentRequests(data);
  }
  if (!sentReqRef.current) {
    getSentRequests(setSentRequests);
    sentReqRef.current = true;
  }

  /**
   * @description search user by name ✅
   * @param {string} searchQuery
   */
  const searchUsers = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const filtered = await getSearchResults(searchQuery);
    setSearchResults(filtered);
  };

  /**
   * @description send friend request to user ✅
   * @param {string} userId
   */
  const sendFriendRequest = async (userId) => {
    await fetch("http://localhost:8000/friendship/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient_id: userId }),
      credentials: "include",
    });
    setSearchResults([]);
    setSearchQuery("");
  };

  /**
   * @description handle friend request accept or reject ✅
   * @param {string} friendshipId
   * @param {"accept" | "reject"} action
   */
  const handleFriendRequest = async (friendshipId, action) => {
    if (action === "accept") {
      await fetch(`http://localhost:8000/friendship/${friendshipId}/accept`, {
        method: "PUT",
        credentials: "include",
      });
    }

    if (action === "reject") {
      await fetch(`http://localhost:8000/friendship/${friendshipId}/reject`, {
        method: "PUT",
        credentials: "include",
      });
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
    <div className="w-80 border-r bg-muted/10">
      <div className="p-4">
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {receivedRequests.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-1 h-5 w-5 p-0 text-xs"
                >
                  {receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-2">
            {friends.map((friend) => (
              <Card
                onClick={() =>
                  selectedFriendId
                    ? onSelectFriend(null)
                    : onSelectFriend(friend)
                }
                key={friend._id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                style={{
                  backgroundColor:
                    selectedFriendId === friend._id ? "#f3f4f6" : "",
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={friend.profile_picture || "/placeholder.svg"}
                        />
                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div
                        className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(
                          friend.status
                        )}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{friend.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {friend.status}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Search */}
          <TabsContent value="search" className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && searchUsers(searchQuery)
                }
              />
              <Button onClick={() => searchUsers(searchQuery)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.map((user) => (
              <Card key={user._id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.profile_picture || "/placeholder.svg"}
                        />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(user._id)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Requests */}
          <TabsContent value="requests" className="space-y-4">
            {receivedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Received Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {receivedRequests.map((request) => (
                    <div
                      key={request.requester_id._id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              request.requester_id.profile_picture ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {request.requester_id.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm">
                          {request.requester_id.name}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleFriendRequest(request._id, "accept")
                          }
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleFriendRequest(request._id, "reject")
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {sentRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sent Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sentRequests.map((request) => (
                    <div
                      key={request.recipient_id._id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              request.recipient_id.profile_picture ||
                              "/placeholder.svg"
                            }
                          />
                          <AvatarFallback>
                            {request.recipient_id.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <p className="font-medium text-sm">
                          {request.recipient_id.name}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

async function getSearchResults(query) {
  console.log("search query ", query);
  const response = await fetch(`http://localhost:8000/user/search?q=${query}`, {
    credentials: "include",
  });
  const data = await response.json();
  return data;
}
