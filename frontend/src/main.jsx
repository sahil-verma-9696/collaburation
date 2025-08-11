import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ChatInterface } from "./components/chat/chat-interface";
import ChatPage from "./pages/chat";
import withAuth from "./hoc/withAuth";
import { GlobalContextProvider } from "./contexts/Global";
import { ChatSocketProvider } from "./contexts/ChatSocket";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
  },
  {
    path: "/chat",
    Component: withAuth(ChatPage),
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalContextProvider>
      <ChatSocketProvider>
        <RouterProvider router={router} />
      </ChatSocketProvider>
    </GlobalContextProvider>
  </StrictMode>
);
