import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 1) если сессия уже есть — уходим
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        const name = (localStorage.getItem("display_name") || "").trim();
        nav(name ? "/" : "/onboarding", { replace: true });
      }
    });

    // 2) если сессия появится после OAuth — тоже уходим
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const name = (localStorage.getItem("display_name") || "").trim();
        nav(name ? "/" : "/onboarding", { replace: true });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [nav]);

  const signInGoogle = async () => {
    setBusy(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-[#0b1014] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e141b] p-6">
        <div className="text-lg font-semibold">Вход</div>
        <div className="text-sm text-slate-400 mt-1">Используй Google</div>

        <button
          onClick={signInGoogle}
          disabled={busy}
          className="mt-5 w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 disabled:opacity-40">
          {busy ? "Открываю Google…" : "Войти через Google"}
        </button>
      </div>
    </div>
  );
}
