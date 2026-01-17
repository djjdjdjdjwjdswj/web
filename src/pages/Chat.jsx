import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

function MBtn({ className = "", children, ...props }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.12 }} className={className} {...props}>
      {children}
    </motion.button>
  );
}

export default function Chat() {
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

  const isAdmin = useMemo(() => myRole === "owner" || myRole === "admin", [myRole]);

  const loadConv = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("id,is_group,title,avatar_url")
      .eq("id", cid)
      .maybeSingle();
    if (error) console.error(error);
    setConv(data || null);
  };

  const loadMembersCount = async () => {
    const { count, error } = await supabase
      .from("conversation_members")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", cid);
    if (!error) setMembersCount(count || 0);
  };

  const loadRoleAndPeer = async (uid) => {
    const { data: mem, error: e1 } = await supabase
      .from("conversation_members")
      .select("user_id,role")
      .eq("conversation_id", cid);
    if (e1) { console.error(e1); return; }
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
      .select("id,user_id,body,created_at,type,media_url,media_mime, profiles (display_name,avatar_url,public_id)")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });
    if (error) { console.error(error); setStatus("Ошибка загрузки: " + error.message); return; }
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
    const t = setInterval(loadMsgs, 3000);
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
    } catch (e) {
      console.error(e);
      setStatus("Не удалось отправить: " + (e?.message || String(e)));
    } finally { setBusy(false); }
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
      const { error: insErr } = await supabase.from("messages").insert({
        conversation_id: cid, user_id: me.id, body: "", type: isImg ? "image" : "video", media_url: url, media_mime: mime
      });
      if (insErr) throw insErr;
      await loadMsgs();
    } catch (e) {
      console.error(e);
      setStatus("Не удалось отправить файл: " + (e?.message || String(e)));
    } finally { setBusy(false); }
  };

  const delMsg = async (mid) => {
    setBusy(true); setStatus("");
    const { error } = await supabase.from("messages").delete().eq("id", mid);
    if (error) { setStatus("Не удалось удалить: " + error.message); setBusy(false); return; }
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
    if (error) { setStatus("Не удалось изменить: " + error.message); setBusy(false); return; }
    await loadMsgs();
    setBusy(false);
  };

  const addMember = async () => {
    const u = prompt("Username (без @), кого добавить:");
    if (!u) return;
    const un = u.trim().toLowerCase();
    setBusy(true); setStatus("");
    try {
      const { data: p, error: e1 } = await supabase.from("profiles").select("id").eq("username", un).maybeSingle();
      if (e1) throw e1;
      if (!p?.id) { setStatus("Не найдено"); setBusy(false); return; }
      const { error: e2 } = await supabase.from("conversation_members").insert({ conversation_id: cid, user_id: p.id, role: "member" });
      if (e2) throw e2;
      setStatus("Добавлен ✅");
      await loadMembersCount();
    } catch (e) {
      console.error(e);
      setStatus("Не удалось добавить: " + (e?.message || String(e)));
    } finally { setBusy(false); }
  };

  const renameGroup = async () => {
    const title = prompt("Новое название группы:", conv?.title || "");
    if (title === null) return;
    const t = String(title).trim();
    if (t.length < 2) return;
    setBusy(true); setStatus("");
    const { error } = await supabase.from("conversations").update({ title: t }).eq("id", cid);
    if (error) { setStatus("Не удалось переименовать: " + error.message); setBusy(false); return; }
    await loadConv();
    setBusy(false);
  };

  const headerTitle = conv?.is_group ? (conv?.title || "Группа") : (dmPeer?.display_name || "Чат");
  const headerSubtitle = conv?.is_group ? `${membersCount} участник(ов)` : (dmPeer?.username ? "@" + dmPeer.username : "");

  const openTitle = () => {
    if (conv?.is_group) nav(`/group/${cid}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4 flex flex-col min-h-screen">
        <div className="flex items-center justify-between mb-4">
          <button onClick={openTitle} className={"min-w-0 text-left " + (conv?.is_group ? "hover:opacity-80" : "")}>
            <div className="text-lg font-semibold truncate">{headerTitle}</div>
            {headerSubtitle && <div className="text-xs text-slate-400 truncate">{headerSubtitle}</div>}
          </button>
          <div className="flex gap-2">
            {conv?.is_group && isAdmin && <MBtn onClick={renameGroup} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">✎</MBtn>}
            {conv?.is_group && isAdmin && <MBtn onClick={addMember} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">+👤</MBtn>}
            <MBtn onClick={() => nav("/chats")} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</MBtn>
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-white/10 bg-[#0e141b] p-3 overflow-auto">
          {msgs.map((m) => {
            const mine = m.user_id === me?.id;
            const authorName = m.profiles?.display_name || "User";
            const authorAva = m.profiles?.avatar_url || "";
            const authorLetter = (authorName?.[0] || "U").toUpperCase();
            return (
              <div key={m.id} className={"mb-2 flex " + (mine ? "justify-end" : "justify-start")}>
                <div className={"max-w-[85%] rounded-2xl border border-white/10 px-3 py-2 " + (mine ? "bg-[#102333]" : "bg-[#0b1014]")}>
                  {conv?.is_group && (
                    <div className="mb-1 flex items-center gap-2">
                      <button onClick={() => nav(`/u/${m.user_id}`)} className="h-6 w-6 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center text-xs font-bold hover:opacity-80">
                        {authorAva ? <img src={authorAva} className="h-full w-full object-cover" /> : authorLetter}
                      </button>
                      <div className="text-xs text-slate-300">{authorName}</div>
                    </div>
                  )}

                  {m.type === "text" && <div className="whitespace-pre-wrap break-words">{m.body}</div>}
                  {m.type === "image" && m.media_url && <img src={m.media_url} className="rounded-xl border border-white/10 max-h-[45vh]" />}
                  {m.type === "video" && m.media_url && <video controls src={m.media_url} className="rounded-xl border border-white/10 max-h-[45vh] w-full" />}

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {mine && m.type === "text" && <button onClick={() => editMsg(m.id, m.body)} className="hover:text-slate-200">✎</button>}
                    {mine && <button onClick={() => delMsg(m.id)} className="hover:text-red-300">🗑</button>}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {status && <div className="mt-2 text-sm text-slate-400">{status}</div>}

        <div className="mt-3 flex gap-2 items-center">
          <input value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } }}
            placeholder="Сообщение…"
            className="flex-1 rounded-2xl bg-[#0e141b] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => uploadAndSendMedia(e.target.files?.[0])} />
          <MBtn onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 disabled:opacity-40">📎</MBtn>
          <MBtn onClick={sendText} disabled={busy} className="rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold px-4 py-3 disabled:opacity-40">➤</MBtn>
        </div>
        <div className="mt-2 text-xs text-slate-500">Авто-обновление: сообщения 3с, участники 5с</div>
      </div>
    </motion.div>
  );
}
