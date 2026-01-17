import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

function MBtn({ className="", children, ...props }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.12 }} className={className} {...props}>
      {children}
    </motion.button>
  );
}

export default function Chats() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const [myChats, setMyChats] = useState([]);
  const [dmPeers, setDmPeers] = useState({}); // cid -> profile

  const [groupOpen, setGroupOpen] = useState(false);
  const [groupTitle, setGroupTitle] = useState("");

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) { nav("/login", { replace: true }); return; }
      setMe(ud.user);
    })();
  }, [nav]);

  const loadMyChats = async () => {
    if (!me) return;
    const { data: mem, error: e1 } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", me.id);
    if (e1) { console.error(e1); return; }
    const ids = (mem || []).map(x => x.conversation_id);
    if (ids.length === 0) { setMyChats([]); setDmPeers({}); return; }

    const { data: convs, error: e2 } = await supabase
      .from("conversations")
      .select("id,is_group,title,avatar_url,created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (e2) { console.error(e2); return; }
    setMyChats(convs || []);

    const dmIds = (convs || []).filter(c => !c.is_group).map(c => c.id);
    if (dmIds.length === 0) { setDmPeers({}); return; }

    const { data: allM, error: e3 } = await supabase
      .from("conversation_members")
      .select("conversation_id,user_id")
      .in("conversation_id", dmIds);
    if (e3) { console.error(e3); return; }

    const otherIds = new Set();
    const mapCidOther = {};
    for (const row of (allM || [])) {
      if (row.user_id !== me.id) {
        mapCidOther[row.conversation_id] = row.user_id;
        otherIds.add(row.user_id);
      }
    }
    const idsArr = Array.from(otherIds);
    if (idsArr.length === 0) { setDmPeers({}); return; }

    const { data: ps, error: e4 } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,public_id")
      .in("id", idsArr);
    if (e4) { console.error(e4); return; }

    const byId = {};
    for (const p of (ps || [])) byId[p.id] = p;

    const next = {};
    for (const cidStr of Object.keys(mapCidOther)) {
      const oid = mapCidOther[cidStr];
      next[cidStr] = byId[oid] || null;
    }
    setDmPeers(next);
  };

  useEffect(() => {
    if (!me) return;
    loadMyChats();
    const t = setInterval(loadMyChats, 5000);
    return () => clearInterval(t);
  }, [me]);

  const search = async () => {
    const v = q.trim().toLowerCase();
    setStatus(""); setFound([]);
    if (!v) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url,public_id")
      .ilike("username", "%" + v + "%")
      .order("username", { ascending: true })
      .limit(10);
    setBusy(false);
    if (error) { console.error(error); setStatus("Ошибка поиска: " + error.message); return; }
    const list = (data || []).filter(x => x.id !== me?.id);
    setFound(list);
    if (list.length === 0) setStatus("Не найдено");
  };

  const startDM = async (otherId) => {
    if (!me) return;
    setBusy(true); setStatus("");
    try {
      const { data, error } = await supabase.rpc("get_or_create_dm", { other_user: otherId });
      if (error) throw error;
      nav(`/chat/${data}`);
    } catch (e) {
      console.error(e);
      setStatus("Не удалось открыть чат: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  const openGroup = () => { setGroupTitle(""); setGroupOpen(true); };

  const createGroup = async () => {
    if (!me) return;
    const title = groupTitle.trim();
    if (title.length < 2) { setStatus("Название группы слишком короткое"); return; }
    setBusy(true); setStatus("");
    try {
      const { data: conv, error: e1 } = await supabase
        .from("conversations")
        .insert({ is_group: true, title })
        .select("id")
        .single();
      if (e1) throw e1;
      const cid = conv.id;
      const { error: e2 } = await supabase
        .from("conversation_members")
        .insert({ conversation_id: cid, user_id: me.id, role: "owner" });
      if (e2) throw e2;
      setGroupOpen(false);
      nav(`/chat/${cid}`);
    } catch (e) {
      console.error(e);
      setStatus("Не удалось создать группу: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Чаты</div>
          <div className="flex gap-2">
            <MBtn onClick={openGroup} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">+ Группа</MBtn>
            <MBtn onClick={() => nav("/")} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</MBtn>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4">
          <div className="text-sm text-slate-300">Поиск по username</div>
          <div className="text-xs text-slate-500 mt-1">Можно вводить часть — ищет внутри</div>
          <div className="mt-3 flex gap-2">
            <input value={q} onChange={(e)=>setQ(e.target.value.toLowerCase().replace(/[^a-z]/g,""))} maxLength={16} placeholder="например: alex"
              className="flex-1 rounded-xl bg-[#0b1014] border border-white/10 px-3 py-2 outline-none focus:border-white/20" />
            <MBtn onClick={search} disabled={busy} className="rounded-xl bg-[#2ea6ff] text-[#071018] font-semibold px-3 py-2 disabled:opacity-40">Найти</MBtn>
          </div>
          {status && <div className="mt-2 text-sm text-slate-400">{status}</div>}
        </div>

        <div className="mt-4">
          <div className="text-sm text-slate-400 mb-2">Мои чаты</div>
          <div className="space-y-2">
            {myChats.map((c) => {
              const peer = dmPeers[String(c.id)];
              const title = c.is_group ? (c.title || "Группа") : (peer?.display_name || "Чат");
              const sub = c.is_group ? "Группа" : (peer?.username ? "@" + peer.username : "");
              const ava = c.is_group ? (c.avatar_url || "") : (peer?.avatar_url || "");
              const letter = (title?.[0] || "C").toUpperCase();
              return (
                <MBtn key={c.id} onClick={() => nav(`/chat/${c.id}`)} className="w-full text-left rounded-2xl border border-white/10 bg-[#0e141b] p-4 hover:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold">
                      {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{title}</div>
                      <div className="text-xs text-slate-400 truncate">{sub}</div>
                    </div>
                  </div>
                </MBtn>
              );
            })}
            {myChats.length === 0 && <div className="text-sm text-slate-500">Пока нет чатов</div>}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm text-slate-400 mb-2">Результаты поиска</div>
          <div className="space-y-3">
            {found.map((u) => {
              const ava = u.avatar_url || "";
              const letter = (u.display_name?.[0] || "U").toUpperCase();
              return (
                <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0e141b] p-4 flex items-center gap-3">
                  <button onClick={() => nav(`/u/${u.id}`)} className="h-10 w-10 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold">
                    {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{u.display_name}</div>
                    <div className="text-xs text-slate-400 truncate">@{u.username || "—"} • id {u.public_id ?? "—"}</div>
                  </div>
                  <MBtn onClick={() => startDM(u.id)} disabled={busy} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-40">Написать</MBtn>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {groupOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/70 p-4 grid place-items-center">
            <motion.div initial={{scale:0.97}} animate={{scale:1}} exit={{scale:0.97}} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e141b] overflow-hidden">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <div className="font-semibold">Создать группу</div>
                <MBtn onClick={() => setGroupOpen(false)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Закрыть</MBtn>
              </div>
              <div className="p-4">
                <div className="text-xs text-slate-400">Название</div>
                <input value={groupTitle} onChange={(e)=>setGroupTitle(e.target.value)} placeholder="например: Друзья"
                  className="mt-1 w-full rounded-xl bg-[#0b1014] border border-white/10 px-3 py-2 outline-none focus:border-white/20" />
                <div className="mt-3 text-sm text-slate-400">Участников можно добавить уже внутри группы</div>
                <MBtn onClick={createGroup} disabled={busy} className="mt-3 w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 disabled:opacity-40">Создать</MBtn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
