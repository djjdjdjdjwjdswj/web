import { supabase } from "./supabase";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

// Call once on app start
export function initNativeAuth() {
  if (!(window && window.Capacitor)) return;

  App.addListener("appUrlOpen", async ({ url }) => {
    try {
      if (!url) return;
      if (!url.startsWith("chatweb://auth")) return;

      // Close in-app browser if still open
      try { await Browser.close(); } catch {}

      // Supabase чаще возвращает ?code=...
      // URL() не дружит с кастомной схемой, поэтому подменяем на http
      const safe = url.replace("chatweb://auth", "http://localhost");
      const u = new URL(safe);
      const code = u.searchParams.get("code");

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    } catch (e) {
      console.error("OAuth finish error", e);
    }
  });
}
