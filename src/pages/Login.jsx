import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Browser } from "@capacitor/browser";
import { motion } from "framer-motion";
import MBtn from "../components/MBtn";
import { t } from "../lib/i18n";
import { initNativeAuth } from "../lib/nativeAuth";
import { App as CapApp } from "@capacitor/app";

export default function Login(){
  const nav = useNavigate();
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    initNativeAuth();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) nav("/", { replace: true });
    })();
  }, [nav]);

  // If the OAuth flow returns while app is open, close browser ASAP
  useEffect(() => {
    if (!(window && window.Capacitor)) return;
    const sub = CapApp.addListener("appUrlOpen", async ({ url }) => {
      try {
        if (url && url.startsWith("chatweb://auth")) {
          try { await Browser.close(); } catch {}
        }
      } catch {}
    });
    return () => { try { sub.remove(); } catch {} };
  }, []);

  const loginGoogle = async () => {
    setBusy(true);
    setStatus("");
    try {
      const isNative = !!(window && window.Capacitor);
      const redirectTo = isNative ? "chatweb://auth" : (window.location.origin + "/auth/callback");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: isNative
        }
      });
      if (error) throw error;

      if (isNative) {
        // Open OAuth page in in-app browser
        await Browser.open({ url: data.url });
      } else {
        // Web fallback
        window.location.href = data.url;
      }
    } catch (e) {
      setStatus((e && e.message) ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="rounded-3xl border border-white/10 bg-[#0e141b] p-5">
          <div className="text-xl font-semibold">{t("login")}</div>
          <div className="text-sm text-slate-400 mt-1">{t("login_hint")}</div>

          <div className="mt-4">
            <MBtn disabled={busy} onClick={loginGoogle} className="w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-3 disabled:opacity-40">
              {busy ? t("loading") : t("login_google")}
            </MBtn>
          </div>

          {status && <div className="mt-3 text-sm text-red-200">{status}</div>}
        </div>
      </div>
    </motion.div>
  );
}
