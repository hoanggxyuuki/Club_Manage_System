import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ForumProvider } from "./context/ForumContext";
import { ChatProvider } from "./context/ChatContext";
import { MatchProvider } from "./context/MatchContext";
import { registerServiceWorker } from "./utils/notificationUtils";
import "./index.css";


if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <ForumProvider>
          <ChatProvider>
            <MatchProvider>
              <App />
            </MatchProvider>
          </ChatProvider>
        </ForumProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>,
);
