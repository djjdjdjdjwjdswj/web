import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Onboarding from "./pages/Onboarding";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Chats from "./pages/Chats";
import Chat from "./pages/Chat";
import GroupInfo from "./pages/GroupInfo";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
        <Route path="/" element={<RequireAuth><Feed /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/u/:id" element={<RequireAuth><UserProfile /></RequireAuth>} />
        <Route path="/chats" element={<RequireAuth><Chats /></RequireAuth>} />
        <Route path="/chat/:id" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/group/:id" element={<RequireAuth><GroupInfo /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
