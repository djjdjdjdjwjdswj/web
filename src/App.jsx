import { Routes, Route, Navigate } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";

import Feed from "./pages/Feed";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import GroupInfo from "./pages/GroupInfo";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <Feed />
          </RequireAuth>
        }
      />

      <Route
        path="/feed"
        element={
          <RequireAuth>
            <Feed />
          </RequireAuth>
        }
      />

      <Route
        path="/chats"
        element={
          <RequireAuth>
            <Chats />
          </RequireAuth>
        }
      />

      <Route
        path="/chat/:id"
        element={
          <RequireAuth>
            <Chat />
          </RequireAuth>
        }
      />

      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />

      <Route
        path="/u/:id"
        element={
          <RequireAuth>
            <UserProfile />
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />

      <Route
        path="/group/:id"
        element={
          <RequireAuth>
            <GroupInfo />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
