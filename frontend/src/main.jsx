import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router";
import ChatPage from "./pages/chat";
import withAuth from "./hoc/withAuth";
import { GlobalContextProvider } from "./contexts/Global";
import { ChatSocketProvider } from "./contexts/ChatSocket";

const AuthenticatedChatPage = withAuth(ChatPage);

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/chat",
    element: (
      <ChatSocketProvider>
        <AuthenticatedChatPage />
      </ChatSocketProvider>
    ),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalContextProvider>
      <RouterProvider router={router} />
    </GlobalContextProvider>
  </StrictMode>
);
