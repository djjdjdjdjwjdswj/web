import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function UserProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [u, setU] = useState(null);
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) { nav("/login", { replace: true }); return; }
      setMe(ud.user);
      const { data: p, error } = await supabase.from("profiles").select("id,display_name,username,bio,avatar_url").eq("id", id).maybeSingle();
      if (error) console.error(error);
      setU(p || null);
      setBusy(false);
    })();
  }, [id, nav]);

  const startChat = async () => {
    if (!me || !u) return;
    setStatus("");
    try {
      // создаем беседу
      const { data: conv, error: e1 } = await supabase.from("conversations").insert({}).select("id").single();
      if (e1) throw e1;
      const cid = conv.id;

      // добавляем себя
      const { error: e2 } = await supabase.from("conversation_members").insert({ conversation_id: cid, user_id: me.id });
      if (e2) throw e2;

      // добавляем второго
      const { error: e3 } = await supabase.from("conversation_members").insert({ conversation_id: cid, user_id: u.id });
      if (e3) throw e3;

      nav(`/chat/${cid}`);
    } catch (e) {
      console.error(e);
      setStatus("Не удалось создать чат: " + (e?.message || String(e)));
    }
  };

  if (busy) return <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">Загрузка…</div>;
  if (!u) return <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">Пользователь не найден</div>;

  const name = u.display_name || "User";
  const username = u.username ? `@${u.username}` : "@—";
  const ava = u.avatar_url || "";
  const letter = (name[0] || "U").toUpperCase();

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Профиль</div>
          <button onClick={() => nav(-1)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 active:scale-95 transition">Назад</button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold text-xl">
              {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold truncate">{name}</div>
              <div className="text-sm text-slate-400 truncate">{username}</div>
            </div>
          </div>

          {u.bio && <div className="mt-3 text-slate-200 whitespace-pre-wrap">{u.bio}</div>}

          {me?.id !== u.id && (
            <button onClick={startChat} className="mt-4 w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 active:scale-95 transition">
              Написать
            </button>
          )}

          {status && <div className="mt-2 text-sm text-slate-400">{status}</div>}
        </div>
      </div>
    </motion.div>
  );
}
