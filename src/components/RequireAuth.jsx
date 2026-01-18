import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RequireAuth({ children }) {
  const loc = useLocation();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [banned, setBanned] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: ud } = await supabase.auth.getUser();
        const user = ud?.user;
        if (!alive) return;
        if (!user) {
          setAuthed(false);
          setBanned(false);
          setLoading(false);
          return;
        }

        // Проверка бана (если таблицы bans нет — просто пустим)
        const { data: banRow, error: banErr } = await supabase
          .from("bans")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;
        setAuthed(true);
        setBanned(!banErr && !!banRow?.user_id);
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setAuthed(false);
        setBanned(false);
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">
        Загружаем…
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (banned) {
    return (
      <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0e141b] p-5">
          <div className="text-lg font-semibold">Доступ ограничен</div>
          <div className="mt-2 text-sm text-slate-400">Вы забанены администратором.</div>
          <button
            className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            Выйти
          </button>
        </div>
      </div>
    );
  }

  return children;
}
