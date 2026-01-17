import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const rx = /^[a-z]{5,16}$/;

export default function Onboarding() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);

  const usernameOk = useMemo(() => rx.test(username.trim()), [username]);

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) { nav("/login", { replace: true }); return; }
      const { data: p } = await supabase.from("profiles").select("display_name,username").eq("id", ud.user.id).maybeSingle();
      if (p?.display_name) setName(p.display_name);
      if (p?.username) setUsername(p.username);
      setBusy(false);
    })();
  }, [nav]);

  const checkUsername = async () => {
    const u = username.trim();
    if (!rx.test(u)) { setStatus("Username недоступен: только a-z, 5–16 символов"); return false; }
    const { data } = await supabase.from("profiles").select("id").eq("username", u).limit(1);
    if ((data || []).length > 0) { setStatus("Username занят"); return false; }
    setStatus("Username свободен ✅");
    return true;
  };

  const save = async () => {
    const dn = name.trim();
    const un = username.trim();
    if (dn.length < 2) return;
    setBusy(true);
    const ok = await checkUsername();
    if (!ok) { setBusy(false); return; }

    const { data: ud } = await supabase.auth.getUser();
    await supabase.from("profiles").upsert({ id: ud.user.id, display_name: dn, username: un });
    setBusy(false);
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0b1014] text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e141b] p-6">
        <div className="text-lg font-semibold">Настройка профиля</div>
        <div className="text-sm text-slate-400 mt-1">Имя + username обязательны.</div>

        <div className="mt-4 text-xs text-slate-400">Имя</div>
        <input value={name} onChange={(e)=>setName(e.target.value)} onFocus={(e)=>e.target.select()}
          className="mt-1 w-full rounded-2xl bg-[#0b1014] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />

        <div className="mt-4 text-xs text-slate-400">Username (a-z, 5–16)</div>
        <input value={username} onChange={(e)=>setUsername(e.target.value.replace(/[^a-z]/g, ""))} onBlur={checkUsername}
          placeholder="например: sashaqq"
          className="mt-1 w-full rounded-2xl bg-[#0b1014] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
        <div className="mt-2 text-sm text-slate-400">{status}</div>

        <button onClick={save} disabled={busy || name.trim().length<2 || !usernameOk}
          className="mt-4 w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 disabled:opacity-40">Продолжить</button>
      </div>
    </div>
  );
}
