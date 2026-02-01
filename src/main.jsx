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
        width: 96,
        height: 96,
        borderRadius: 28,
        background: "#000",
        border: "1px solid rgba(255,255,255,0.12)",
        display: "grid",
        placeItems: "center"
      }}>
        <div style={{
          width: 56,
          height: 56,
          background: "#fff",
          clipPath: "polygon(12% 30%, 30% 12%, 50% 32%, 70% 12%, 88% 30%, 68% 50%, 88% 70%, 70% 88%, 50% 68%, 30% 88%, 12% 70%, 32% 50%)",
          transform: "rotate(12deg)"
        }} />
      </div>

      <div style={{ fontWeight: 900, letterSpacing: 2, fontSize: 14, opacity: 0.95 }}>
        SIDE
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "grid",
      placeItems: "center",
      color: "#fff"
    }}>
      <div style={{
        width: 180,
        height: 10,
        borderRadius: 999,
        background: "rgba(255,255,255,0.12)",
        overflow: "hidden"
      }}>
        <div style={{
          width: "60%",
          height: "100%",
          background: "#fff",
          opacity: 0.75,
          animation: "side_load 0.9s ease-in-out infinite alternate"
        }} />
      </div>

      <style>{`
        @keyframes side_load {
          from { transform: translateX(-35%); }
          to   { transform: translateX(55%); }
        }
      `}</style>
    </div>
  );
}

function Root() {
  const [phase, setPhase] = useState("splash");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("loading"), 3000);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const t2 = setTimeout(() => setPhase("app"), 700);
    return () => clearTimeout(t2);
  }, [phase]);

  if (phase === "splash") return <Splash />;
  if (phase === "loading") return <Loading />;

  return (
    <BrowserRouter>
      <FatalEnv>
        <App />
      </FatalEnv>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
