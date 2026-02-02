import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Завершаем вход…");

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // Supabase сам вытаскивает токены из URL если detectSessionInUrl=true
        const { data: sessData, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) throw sessErr;

        const session = sessData?.session;
        if (session?.user) {
          // Успешный вход — чистим URL от мусора и идём в ленту
          try { window.history.replaceState({}, document.title, "/"); } catch {}
          if (alive) nav("/", { replace: true });
          return;
        }

        // Если вдруг сессии нет — отправим на логин
        if (alive) {
          setMsg("Сессия не найдена. Вернись и войди ещё раз.");
          setTimeout(() => nav("/login", { replace: true }), 600);
        }
      } catch (e) {
        if (!alive) return;
        setMsg("Ошибка входа: " + (e?.message || String(e)));
        setTimeout(() => nav("/login", { replace: true }), 900);
      }
    })();

    return () => { alive = false; };
  }, [nav]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a0d",
      color: "#e5e7eb",
      display: "grid",
      placeItems: "center",
      padding: 24
    }}>
      <div style={{
        maxWidth: 420,
        width: "100%",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 24,
        padding: 18,
        background: "#0b1014",
        textAlign: "center"
      }}>
        <div style={{ fontWeight: 900, letterSpacing: 1, marginBottom: 10 }}>SIDE</div>
        <div style={{ opacity: 0.9 }}>{msg}</div>
      </div>
    </div>
  );
}
