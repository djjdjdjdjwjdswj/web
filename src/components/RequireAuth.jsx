import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function RequireAuth({ children }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const loc = useLocation();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">Загрузка…</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return children;
}
