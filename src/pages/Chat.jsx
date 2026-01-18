import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, Eraser, UserPlus, Pencil, Paperclip, Send, ArrowLeft, Shield } from "lucide-react";

function IconBtn({ children, className="", ...props }){
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12 }}
      className={"btn-press rounded-2xl ring-soft bg-white/0 hover:bg-white/5 px-3 py-2 " + className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Pill({ children, className="" }){
  return <span className={"text-xs text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded-full " + className}>{children}</span>;
}

export default function Chat(){
  const { id } = useParams();
  const cid = Number(id);
  const nav = useNavigate();
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const [me, setMe] = useState(null);
  const [myRole, setMyRole] = useState("member");
  const [membersCount, setMembersCount] = useState(0);
  const [conv, setConv] = useState(null);
  const [dmPeer, setDmPeer] = useState(null);

  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = useMemo(() => myRole === "owner" || myRole === "admin", [myRole]);

  const loadConv = async () => {
    const { data } = await supabase
      .from("conversations")
      .select("id,is_group,title,avatar_url")
      .eq("id", cid)
      .maybeSingle();
    setConv(data || null);
  };

  const loadMembersCount = async () => {
    const { count } = await supabase
      .from("conversation_members")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", cid);
    setMembersCount(count || 0);
  };

  const loadRoleAndPeer = async (uid) => {
    const { data: mem } = await supabase
      .from("conversation_members")
      .select("user_id,role")
      .eq("conversation_id", cid);
    const mine = (mem || []).find(x => x.user_id === uid);
    setMyRole(mine?.role || "member");
    const other = (mem || []).find(x => x.user_id !== uid);
    if (other) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id,display_name,username,avatar_url,public_id")
        .eq("id", other.user_id)
        .maybeSingle();
      setDmPeer(p || null);
    } else {
      setDmPeer(null);
    }
  };

  const loadMsgs = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("id,user_id,body,created_at,type,media_url,media_mime, profiles (display_name,avatar_url,username,public_id)")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    if (error) { setStatus("Ошибка загрузки: " + error.message); return; }
    setMsgs(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) { nav("/login", { replace: true }); return; }
      setMe(ud.user);
      await loadConv();
      await loadRoleAndPeer(ud.user.id);
      await loadMembersCount();
      await loadMsgs();
    })();
  }, [cid, nav]);

  useEffect(() => {
    const t = setInterval(loadMsgs, 2500);
    return () => clearInterval(t);
  }, [cid]);

  useEffect(() => {
    const t = setInterval(loadMembersCount, 5000);
    return () => clearInterval(t);
  }, [cid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const sendText = async () => {
    if (!me) return;
    const body = text.trim();
    if (!body) return;
    setBusy(true); setStatus("");
    try {
      const { error } = await supabase.from("messages").insert({ conversation_id: cid, user_id: me.id, body, type: "text" });
      if (error) throw error;
      setText("");
      await loadMsgs();
    } catch (e) { setStatus("Не удалось отправить: " + (e?.message || String(e))); }
    finally { setBusy(false); }
  };

  const uploadAndSendMedia = async (file) => {
    if (!me || !file) return;
    const mime = file.type || "";
    const isImg = mime.startsWith("image/");
    const isVid = mime.startsWith("video/");
    if (!isImg && !isVid) { setStatus("Можно только фото или видео"); return; }
    setBusy(true); setStatus("");
    try {
      const ext = (file.name.split(".").pop() || (isImg ? "png" : "mp4")).toLowerCase();
      const path = `${cid}/${me.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const url = data.publicUrl;
      const { error: insErr } = await supabase.from("messages").insert({ conversation_id: cid, user_id: me.id, body: "", type: isImg ? "image" : "video", media_url: url, media_mime: mime });
      if (insErr) throw insErr;
      await loadMsgs();
    } catch (e) { setStatus("Не удалось отправить файл: " + (e?.message || String(e))); }
    finally { setBusy(false); }
  };

  const delMsg = async (mid) => {
    setBusy(true); setStatus("");
    const { error } = await supabase.from("messages").delete().eq("id", mid);
    if (error) setStatus("Не удалось удалить: " + error.message);
    await loadMsgs();
    setBusy(false);
  };

  const editMsg = async (mid, oldBody) => {
    const next = prompt("Изменить сообщение:", oldBody);
    if (next === null) return;
    const body = String(next).trim();
    if (!body) return;
    setBusy(true); setStatus("");
    const { error } = await supabase.from("messages").update({ body }).eq("id", mid);
    if (error) setStatus("Не удалось изменить: " + error.message);
    await loadMsgs();
    setBusy(false);
  };

  const addMember = async () => {
    const u = prompt("Username (без @), кого добавить:");
    if (!u) return;
    const un = u.trim().toLowerCase();
    setBusy(true); setStatus("");
    try {
      const { data: p, error: e1 } = await supabase.from("profiles").select("id").ilike("username", un).maybeSingle();
      if (e1) throw e1;
      if (!p?.id) { setStatus("Не найдено"); setBusy(false); return; }
      const { error: e2 } = await supabase.from("conversation_members").insert({ conversation_id: cid, user_id: p.id, role: "member" });
      if (e2) throw e2;
      setStatus("Добавлен ✅");
      await loadMembersCount();
    } catch (e) { setStatus("Не удалось добавить: " + (e?.message || String(e))); }
    finally { setBusy(false); }
  };

  const renameGroup = async () => {
    const title = prompt("Новое название группы:", conv?.title || "");
    if (title === null) return;
    const t = String(title).trim();
    if (t.length < 2) return;
    setBusy(true); setStatus("");
    const { error } = await supabase.from("conversations").update({ title: t }).eq("id", cid);
    if (error) setStatus("Не удалось переименовать: " + error.message);
    await loadConv();
    setBusy(false);
  };

  const clearHistory = async () => {
    if (!confirm("Очистить историю чата?")) return;
    setBusy(true); setStatus("");
    try {
      const { error } = await supabase.rpc("clear_conversation", { p_conversation_id: cid });
      if (error) throw error;
      await loadMsgs();
      setStatus("История очищена ✅");
    } catch (e) { setStatus("Не удалось очистить: " + (e?.message || String(e))); }
    finally { setBusy(false); setMenuOpen(false); }
  };

  const deleteChatForMe = async () => {
    if (!confirm("Удалить чат у себя (выйти)?")) return;
    setBusy(true); setStatus("");
    try {
      const { error } = await supabase.rpc("leave_conversation", { p_conversation_id: cid });
      if (error) throw error;
      nav("/chats");
    } catch (e) { setStatus("Не удалось удалить: " + (e?.message || String(e))); }
    finally { setBusy(false); setMenuOpen(false); }
  };

  const headerTitle = conv?.is_group ? (conv?.title || "Группа") : (dmPeer?.display_name || "Чат");
  const headerSubtitle = conv?.is_group ? `${membersCount} участник(ов)` : (dmPeer?.username ? "@" + dmPeer.username : "");

  const openTitle = () => {
    if (conv?.is_group) nav(`/group/${cid}`);
    else if (dmPeer?.id) nav(`/u/${dmPeer.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="min-h-screen bg-[#070a0d] text-slate-100">
      <div className="mx-auto max-w-xl p-4 flex flex-col min-h-screen">

        <div className="rounded-3xl glass ring-soft px-3 py-3 mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <IconBtn onClick={() => nav("/chats")} aria-label="back"><ArrowLeft size={18} /></IconBtn>
              <button onClick={openTitle} className={"min-w-0 text-left " + ((conv?.is_group || dmPeer?.id) ? "hover:opacity-90" : "")}>
                <div className="text-base font-semibold truncate">{headerTitle}</div>
                {headerSubtitle && <div className="text-xs text-slate-400 truncate">{headerSubtitle}</div>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {conv?.is_group && isAdmin && <IconBtn onClick={renameGroup} title="Переименовать"><Pencil size={18} /></IconBtn>}
              {conv?.is_group && isAdmin && <IconBtn onClick={addMember} title="Добавить участника"><UserPlus size={18} /></IconBtn>}

              <div className="relative">
                <IconBtn onClick={() => setMenuOpen(v => !v)} title="Меню"><MoreVertical size={18} /></IconBtn>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#0b1014] p-2 shadow-2xl z-50"
                    >
                      <button onClick={clearHistory} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-left">
                        <Eraser size={16} /><span>Очистить историю</span>
                      </button>
                      <button onClick={deleteChatForMe} className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-left text-red-200">
                        <Trash2 size={16} /><span>Удалить чат у себя</span>
                      </button>
                      <div className="px-3 pt-2 text-[11px] text-slate-500">
                        Для группы: это “выйти”.
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-3xl ring-soft bg-[#0b1014] p-3 overflow-auto">
          {msgs.map((m) => {
            const mine = m.user_id === me?.id;
            const authorName = m.profiles?.display_name || "User";
            const authorAva = m.profiles?.avatar_url || "";
            const authorLetter = (authorName?.[0] || "U").toUpperCase();

            return (
              <motion.div key={m.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.14}}
                className={"mb-2 flex " + (mine ? "justify-end" : "justify-start")}>

                <div className={"max-w-[88%] rounded-3xl ring-soft px-3 py-2 " + (mine ? "bg-[#0f2230]" : "bg-[#070a0d]")}>
                  {conv?.is_group && (
                    <div className="mb-1 flex items-center gap-2">
                      <button onClick={() => nav(`/u/${m.user_id}`)} className="h-6 w-6 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center text-xs font-bold hover:opacity-80">
                        {authorAva ? <img src={authorAva} className="h-full w-full object-cover" /> : authorLetter}
                      </button>
                      <div className="text-xs text-slate-200">{authorName}</div>
                    </div>
                  )}

                  {m.type === "text" && <div className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</div>}
                  {m.type === "image" && m.media_url && <img src={m.media_url} className="rounded-2xl ring-soft max-h-[45vh]" />}
                  {m.type === "video" && m.media_url && <video controls src={m.media_url} className="rounded-2xl ring-soft max-h-[45vh] w-full" />}

                  <div className="mt-2 flex items-center gap-2">
                    <Pill>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Pill>
                    {mine && m.type === "text" && <button onClick={() => editMsg(m.id, m.body)} className="text-xs text-slate-300 hover:text-white flex items-center gap-1"><Pencil size={14}/>изменить</button>}
                    {mine && <button onClick={() => delMsg(m.id)} className="text-xs text-red-200 hover:text-red-100 flex items-center gap-1"><Trash2 size={14}/>удалить</button>}
                  </div>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {status && <div className="mt-2 text-sm text-slate-400">{status}</div>}

        <div className="mt-3 rounded-3xl glass ring-soft p-2 flex gap-2 items-center">
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
            placeholder="Сообщение…"
            className="flex-1 rounded-2xl bg-[#070a0d] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => uploadAndSendMedia(e.target.files?.[0])} />
          <IconBtn onClick={() => fileRef.current?.click()} disabled={busy} title="Файл"><Paperclip size={18} /></IconBtn>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
            disabled={busy}
            onClick={sendText}
            className="btn-press rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold px-4 py-3 disabled:opacity-40 flex items-center gap-2"
          >
            <Send size={18} />
          </motion.button>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">
          Авто-обновление: сообщения 2.5с • участники 5с
        </div>
      </div>
    </motion.div>
  );
}
