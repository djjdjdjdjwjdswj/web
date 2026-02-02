import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import FatalEnv from "./components/FatalEnv";
import "./index.css";

function Splash() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#000",
      display: "grid",
      placeItems: "center",
      color: "#fff",
      fontWeight: 800,
      letterSpacing: 2
    }}>
      SIDE
    </div>
  );
}

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!ready) return <Splash />;

  return (
    <BrowserRouter>
      <FatalEnv />
      <App />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Root />);
