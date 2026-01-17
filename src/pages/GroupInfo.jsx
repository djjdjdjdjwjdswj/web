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

export default function GroupInfo() {
  const { id } = useParams();
  const cid = Number(id);
  const nav = useNavigate();

  const [me, setMe] = useState(null);
  const [conv, setConv] = useState(null);
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);

  const count = members.length;

  const load = async () => {
    setBusy(true); setStatus("");
    try {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) { nav("/login", { replace: true }); return; }
      setMe(ud.user);

      const { data: c, error: e1 } = await supabase
        .from("conversations")
        .select("id,is_group,title,avatar_url")
        .eq("id", cid)
        .maybeSingle();
      if (e1) throw e1;
      if (!c) { setStatus("Группа не найдена"); setBusy(false); return; }
      setConv(c);
      if (!c.is_group) { setStatus("Это не группа"); setBusy(false); return; }

      const { data: ms, error: e2 } = await supabase
        .from("conversation_members")
        .select("user_id,role, profiles (id,display_name,username,avatar_url,public_id)")
        .eq("conversation_id", cid);
      if (e2) throw e2;

      const list = (ms || []).map(r => ({
        user_id: r.user_id,
        role: r.role,
        profile: r.profiles || null
      }));

      // owner/admin сверху
      const pr = { owner: 0, admin: 1, member: 2 };
      list.sort((a,b) => (pr[a.role] ?? 9) - (pr[b.role] ?? 9));

      setMembers(list);
    } catch (e) {
      console.error(e);
      setStatus("Ошибка: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { load(); }, [cid]);

  const title = conv?.title || "Группа";

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="min-w-0">
            <div className="text-lg font-semibold truncate">{title}</div>
            <div className="text-xs text-slate-400">{count} участник(ов)</div>
          </div>
          <div className="flex gap-2">
            <MBtn onClick={() => nav(`/chat/${cid}`)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</MBtn>
          </div>
        </div>

        {status && <div className="mb-3 text-sm text-slate-400">{status}</div>}

        <div className="space-y-2">
          {members.map((m) => {
            const p = m.profile;
            const name = p?.display_name || "User";
            const ava = p?.avatar_url || "";
            const letter = (name?.[0] || "U").toUpperCase();
            const badge = m.role === "owner" ? "Владелец" : (m.role === "admin" ? "Админ" : "");
            return (
              <MBtn
                key={m.user_id}
                onClick={() => nav(`/u/${m.user_id}`)}
                className="w-full text-left rounded-2xl border border-white/10 bg-[#0e141b] p-4 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold">
                    {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{name}</div>
                    <div className="text-xs text-slate-400 truncate">id {p?.public_id ?? "—"} {badge ? "• " + badge : ""}</div>
                  </div>
                </div>
              </MBtn>
            );
          })}
          {!busy && members.length === 0 && <div className="text-sm text-slate-500">Пока пусто</div>}
        </div>
      </div>
    </motion.div>
  );
}
