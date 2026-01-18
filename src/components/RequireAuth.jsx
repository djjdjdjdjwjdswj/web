import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RequireAuth({ children }) {
  const loc = useLocation();
  const [state, setState] = useState({ loading: true, authed: false, banned: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      const user = ud.user;
      if (!alive) return;
      if (!user) { setState({ loading: false, authed: false, banned: false }); return; }

      // проверка бана
      const { data: banRow, error: banErr } = await supabase
        .from("bans")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!alive) return;

      if (banErr) {
        // если bans таблицы ещё нет/нет прав — просто пускаем
        setState({ loading: false, authed: true, banned: false });
        return;
      }

      if (banRow?.user_id) {
        setState({ loading: false, authed: true, banned: true });
        return;
      }

      setState({ loading: false, authed: true, banned: false });
    })();
    return () => { alive = false; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">
        Загружаем…
      </div>
    );
  }

  if (!state.authed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (state.banned) {
    return (
      <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0e141b] p-5">
          <div className="text-lg font-semibold">Доступ ограничен</div>
          <div className="mt-2 text-sm text-slate-400">Вы забанены администратором.</div>
          <button
            className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5"
            onClick={async () => { await supabase.auth.signOut(); location.href = \"/login\"; }}
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return children;
}
