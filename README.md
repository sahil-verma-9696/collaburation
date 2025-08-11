## Functional Requirements

1. User Authentication.
2. Search User by name.
3. Friend Request accept/reject by user.
4. Messaging with Friend.
5. Notification of friend request/unseen message.

## Core Entities.

1. **User**
```js
User: {
 _id: string,
 name: string,
 email: string,
 password: string,
 profile_picture?: string,
 status: enum['online', 'offline', 'away'],
 created_at: timestamp,
 updated_at: timestamp
}
```

2. **Friendship**
```js
Friendship: {
  _id: string,
  requester_id: ref(User),
  recipient_id: ref(User),
  status: enum['pending', 'accepted', 'rejected', 'blocked'],
  requested_at: timestamp,
  responded_at?: timestamp
}
```

3. **Message** : 
```js
Message: {
  _id: string,
  sender_id: ref(User),
  recipient_id: ref(User),
  content: string,
  attachments: [ref(Attachment)],
  is_read: boolean,
  sent_at: timestamp,
  read_at?: timestamp
}
```
4. **Attachment** 

```js
Attachment: {
  _id: string,
  url: string,
  filename: string,
  file_size: number,
  mime_type: string,
  uploaded_at: timestamp
}
```

5. **Notification**
```js
Notification: {
  _id: string,
  user_id: ref(User),
  type: enum['friend_request', 'message', 'friend_accepted'],
  related_id: string, // friend_request_id or message_id
  is_read: boolean,
  created_at: timestamp
}
```

## REST API Endpoints

1. **Authentication** ✅

```plain
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

2. **User Management**
```plain
GET    /api/users/search?q={name}
GET    /api/users/profile/{user_id}
PUT    /api/users/profile
```

3. **Friend Management** ✅
```plain
POST   /api/friends/request
PUT    /api/friends/{friendship_id}/accept
PUT    /api/friends/{friendship_id}/reject
DELETE /api/friends/{friendship_id}
GET    /api/friends
GET    /api/friends/requests/sent
GET    /api/friends/requests/received
```

4. **Messagin(for reliability)**
```plain
POST   /api/messages
GET    /api/messages/{user_id}?page={n}&limit={n}
PUT    /api/messages/{message_id}/read
DELETE /api/messages/{message_id}
```

5. **Attachments**
```plain
POST   /api/attachments/upload
GET    /api/attachments/{attachment_id}
DELETE /api/attachments/{attachment_id}
```

6. **Notifications**
```plain
GET    /api/notifications
PUT    /api/notifications/{notification_id}/read
PUT    /api/notifications/mark-all-read
DELETE /api/notifications/{notification_id}
```

