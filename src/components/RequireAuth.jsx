import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Splash() {
  return (
    <div className="min-h-screen bg-[#0b1014] text-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 rounded-2xl bg-black border border-white/10 grid place-items-center">
          <div className="text-2xl font-black tracking-tight">S</div>
        </div>
        <div className="text-sm text-slate-400">Загрузка…</div>
      </div>
    </div>
  );
}

export default function RequireAuth({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let unsub = null;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const has = !!data?.session;
        setAuthed(has);
        setReady(true);

        if (!has) {
          nav("/login", { replace: true, state: { from: loc.pathname } });
        }
      } catch {
        setAuthed(false);
        setReady(true);
        nav("/login", { replace: true, state: { from: loc.pathname } });
      }

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const has = !!session;
        setAuthed(has);
        setReady(true);
        if (!has) nav("/login", { replace: true, state: { from: loc.pathname } });
      });

      unsub = sub?.subscription?.unsubscribe ? sub.subscription.unsubscribe : null;
    })();

    return () => {
      try { unsub && unsub(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return <Splash />;
  if (!authed) return <Splash />;

  return children;
}
