import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function Login(){
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) nav("/feed", { replace: true });
    })();
  }, [nav]);

  const loginGoogle = async () => {
    setBusy(true);
    setStatus("");
    try {
      // Важно: редирект обратно в твой сайт (Vercel) или localhost
      const redirectTo = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo }
      });
      if (error) throw error;
    } catch (e) {
      setStatus(e?.message || String(e));
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0d] text-slate-100 flex items-center justify-center p-4">
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1014] p-5">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-black border border-white/10 grid place-items-center">
            <div className="text-white font-black text-lg">S</div>
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight">side</div>
            <div className="text-xs text-slate-500">Вход в аккаунт</div>
          </div>
        </div>

        <button
          onClick={loginGoogle}
          disabled={busy}
          className="w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold px-4 py-3 disabled:opacity-40 active:scale-[0.99] transition"
        >
          {busy ? "Открываю Google…" : "Войти с Google"}
        </button>

        {status && <div className="mt-3 text-sm text-red-200">{status}</div>}

        <div className="mt-4 text-xs text-slate-500">
          Если после входа снова кидает на эту страницу — значит редирект/URL в Supabase настроен неправильно.
        </div>
      </motion.div>
    </div>
  );
}
