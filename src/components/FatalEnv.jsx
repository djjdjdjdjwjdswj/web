import React from "react";
import { supabaseUrl, supabaseAnonKey } from "../lib/supabase";

export default function FatalEnv({ children }) {
  const ok = Boolean(supabaseUrl && supabaseAnonKey);

  if (!ok) {
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
          maxWidth: 560,
          width: "100%",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 24,
          padding: 18,
          background: "#0b1014"
        }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 8 }}>
            Ошибка конфигурации (Vercel)
          </div>

          <div style={{ opacity: 0.9, lineHeight: 1.45 }}>
            Supabase env НЕ задан на Vercel, поэтому сайт запускается пустым.
            <br/><br/>
            Добавь на Vercel переменные:
            <div style={{
              marginTop: 10,
              fontFamily: "monospace",
              fontSize: 12,
              padding: 12,
              borderRadius: 14,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)"
            }}>
              VITE_SUPABASE_URL<br/>
              VITE_SUPABASE_ANON_KEY
            </div>

            <div style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
              Сейчас у тебя:
              <div style={{ marginTop: 8, fontFamily: "monospace" }}>
                VITE_SUPABASE_URL = {String(supabaseUrl || "(empty)")}<br/>
                VITE_SUPABASE_ANON_KEY = {supabaseAnonKey ? "(set)" : "(empty)"}
              </div>
            </div>

            <br/>
            Потом нажми Redeploy.
          </div>
        </div>
      </div>
    );
  }

  return children;
}
