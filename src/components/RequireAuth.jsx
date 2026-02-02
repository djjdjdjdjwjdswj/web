import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RequireAuth({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [status, setStatus] = useState("checking"); // checking | authed | guest

  useEffect(() => {
    let alive = true;

    const go = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      if (!alive) return;

      if (user) setStatus("authed");
      else setStatus("guest");
    };

    go();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      go();
    });

    return () => {
      alive = false;
      try { sub?.subscription?.unsubscribe?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    if (status !== "guest") return;
    // не редиректим если уже на /login или /auth/callback
    if (loc.pathname.startsWith("/login") || loc.pathname.startsWith("/auth/callback")) return;
    nav("/login", { replace: true });
  }, [status, loc.pathname, nav]);

  if (status === "checking") {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#070a0d",
        color: "#e5e7eb",
        display: "grid",
        placeItems: "center"
      }}>
        <div style={{ opacity: 0.85 }}>Загрузка…</div>
      </div>
    );
  }

  if (status === "guest") return null;

  return children;
}
