import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import FatalEnv from "./components/FatalEnv";

function Splash() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      color: "#fff",
      gap: 14
    }}>
      <div style={{
        width: 92,
        height: 92,
        borderRadius: 26,
        background: "#000",
        border: "1px solid rgba(255,255,255,0.10)",
        display: "grid",
        placeItems: "center"
      }}>
        <div style={{
          width: 54,
          height: 54,
          background: "#fff",
          clipPath: "polygon(12% 30%, 30% 12%, 50% 32%, 70% 12%, 88% 30%, 68% 50%, 88% 70%, 70% 88%, 50% 68%, 30% 88%, 12% 70%, 32% 50%)",
          transform: "rotate(12deg)"
        }} />
      </div>

      <div style={{ fontWeight: 800, letterSpacing: 1 }}>SIDE</div>

      <div style={{
        width: 180,
        height: 10,
        borderRadius: 999,
        background: "rgba(255,255,255,0.10)",
        overflow: "hidden"
      }}>
        <div style={{
          width: "60%",
          height: "100%",
          background: "#fff",
          opacity: 0.7,
          animation: "sidebar 0.9s ease-in-out infinite alternate"
        }} />
      </div>

      <style>{`@keyframes sidebar { from { transform: translateX(-30%); } to { transform: translateX(40%); } }`}</style>
    </div>
  );
}

function Root() {
  const [phase, setPhase] = useState("splash"); // splash -> loading -> app
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("loading"), 3000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const t2 = setTimeout(() => setReady(true), 700);
    return () => clearTimeout(t2);
  }, [phase]);

  if (!ready) return <Splash />;

  return (
    <BrowserRouter>
      <FatalEnv />
      <App />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
