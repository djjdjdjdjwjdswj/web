import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n";
import { motion } from "framer-motion";

export default function RequireAuth({ children }) {
  const loc = useLocation();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setAuthed(!!data.session);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:0.16}}
          className="rounded-2xl border border-white/10 bg-[#0e141b] px-5 py-4 text-sm text-slate-300">
          Loading…
        </motion.div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
