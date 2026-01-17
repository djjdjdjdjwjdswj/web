import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Входим…");

  useEffect(() => {
    (async () => {
      try {
        const url = window.location.href;
        if (url.includes("?code=")) {
          const { error } = await supabase.auth.exchangeCodeForSession(url);
          if (error) throw error;
        }

        const { data: ud } = await supabase.auth.getUser();
        const user = ud.user;
        if (!user) { nav("/login", { replace: true }); return; }

        // создаём/обновляем профайл в БД один раз
        const fullName = (user.user_metadata?.full_name || user.user_metadata?.name || "").trim();
        const avatar = (user.user_metadata?.avatar_url || user.user_metadata?.picture || "").trim();

        const { data: existing } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        if (!existing) {
          await supabase.from("profiles").insert({
            id: user.id,
            display_name: fullName || "User",
            avatar_url: avatar || "",
            bio: ""
          });
        } else if (!existing.display_name && fullName) {
          await supabase.from("profiles").update({ display_name: fullName }).eq("id", user.id);
        }

        const { data: prof } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        if (!prof?.display_name || prof.display_name.trim().length < 2) {
          nav("/onboarding", { replace: true });
        } else {
          nav("/", { replace: true });
        }
      } catch (e) {
        console.error(e);
        setMsg("Ошибка: " + (e?.message || e));
      }
    })();
  }, [nav]);

  return (
    <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">
      {msg}
    </div>
  );
}
