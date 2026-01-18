import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

function MBtn({ className="", children, ...props }) {
  return (
    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.95}} transition={{duration:0.12}} className={className} {...props}>
      {children}
    </motion.button>
  );
}

export default function UserProfile(){
  const { id } = useParams();
  const uid = String(id);
  const nav = useNavigate();

  const [me, setMe] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [p, setP] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);

  const amAdmin = useMemo(() => (myProfile?.username || "") === "xxxxx", [myProfile]);
  const targetIsAdmin = useMemo(() => (p?.username || "") === "xxxxx", [p]);

  useEffect(() => {
    (async () => {
      setBusy(true); setStatus("");
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) { nav("/login", { replace: true }); return; }
      setMe(ud.user);

      const { data: mp } = await supabase.from("profiles").select("id,display_name,username,avatar_url,public_id").eq("id", ud.user.id).maybeSingle();
      setMyProfile(mp || null);

      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,bio,public_id")
        .eq("id", uid)
        .maybeSingle();

      if (error) { setStatus("Ошибка: " + error.message); setBusy(false); return; }
      if (!data) { setStatus("Профиль не найден"); setBusy(false); return; }
      setP(data);
      setBusy(false);
    })();
  }, [uid, nav]);

  const startDM = async () => {
    if (!p?.id) return;
    setStatus("");
    try {
      const { data, error } = await supabase.rpc("get_or_create_dm", { other_user: p.id });
      if (error) throw error;
      nav(`/chat/${data}`);
    } catch (e) {
      console.error(e);
      setStatus("Не удалось открыть чат: " + (e?.message || String(e)));
    }
  };

  const banUser = async () => {
    if (!amAdmin) return;
    if (!p?.id) return;
    if (targetIsAdmin) { setStatus("Нельзя банить администратора"); return; }
    const reason = prompt("Причина бана (необязательно):", "");
    if (reason === null) return;
    setStatus("");
    try {
      const { error } = await supabase.from("bans").insert({ user_id: p.id, banned_by: me.id, reason: String(reason || "") });
      if (error) throw error;
      setStatus("Пользователь забанен ✅");
    } catch (e) {
      console.error(e);
      setStatus("Не удалось забанить: " + (e?.message || String(e)));
    }
  };

  const name = p?.display_name || "User";
  const ava = p?.avatar_url || "";
  const letter = (name?.[0] || "U").toUpperCase();

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Профиль</div>
          <MBtn onClick={() => nav(-1)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</MBtn>
        </div>

        {status && <div className="mb-3 text-sm text-slate-400">{status}</div>}

        <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4">

          {(((profile?.username)||"")==="xxxxx") && (
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
              <div><span className="text-slate-400">number:</span> 2211</div>
              <div><span className="text-slate-400">adres:</span> idk</div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold text-xl">
              {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
            </div>
            <div className="min-w-0 flex-1">
              <div className={"text-lg font-semibold truncate " + (targetIsAdmin ? "rainbow-text" : "")}>{name}</div>
              <div className="text-sm text-slate-400 truncate">@{p?.username || "—"} • id {p?.public_id ?? "—"}</div>
            </div>
          </div>

          {p?.bio && <div className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{p.bio}</div>}

          <div className="mt-4 flex gap-2">
            <MBtn onClick={startDM} className="flex-1 rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2">Написать</MBtn>
            {amAdmin && !targetIsAdmin && (
              <MBtn onClick={banUser} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-red-200 hover:bg-red-500/20">Бан</MBtn>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
