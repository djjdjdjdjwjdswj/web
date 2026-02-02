import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Trash2, Eraser, UserPlus, Pencil, Paperclip, Send, ArrowLeft, Mic } from "lucide-react";

function IconBtn({ children, className = "", ...props }) {
  const openMsgMenu = (e, m) => {
    try { e?.preventDefault?.(); } catch {}
    const mine = m.user_id === me?.id;
    const x = (e?.clientX ?? 0);
    const y = (e?.clientY ?? 0);
    setEditText(m.body || "");
    setMsgMenu({ id: m.id, mine, x, y, body: m.body || "", type: m.type || "text" });
  };

  const openMsgMenuTap = (e, m) => {
    // На телефоне: обычный тап открывает меню (кроме кликов по видео/аудио/картинке/кнопкам)
    const tag = String(e?.target?.tagName || "").toLowerCase();
    if (["button","a","video","audio","img","input","textarea"].includes(tag)) return;
    const r = e.currentTarget?.getBoundingClientRect?.();
    const x = r ? (r.left + r.width / 2) : 16;
    const y = r ? (r.top + r.height / 2) : 16;
    setEditText(m.body || "");
    setMsgMenu({ id: m.id, mine: m.user_id === me?.id, x, y, body: m.body || "", type: m.type || "text" });
  };

  const closeMsgMenu = () => setMsgMenu(null);

  const copyMsg = async () => {
    if (!msgMenu) return;
    try {
      await navigator.clipboard?.writeText(msgMenu.body || "");
      setStatus("Скопировано ✅");
    } catch {
      setStatus("Не удалось скопировать");
    }
    closeMsgMenu();
  };

  const deleteMsg = async () => {
    if (!msgMenu) return;
    if (!msgMenu.mine) { setStatus("Можно удалить только своё сообщение"); closeMsgMenu(); return; }
    if (!confirm("Удалить сообщение?") ) return;
    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.from("messages").delete().eq("id", msgMenu.id);
      if (error) throw error;
      await loadMsgs();
      setStatus("Удалено ✅");
    } catch (e) {
      setStatus("Не удалось удалить: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
      closeMsgMenu();
    }
  };

  const saveEditMsg = async () => {
    if (!msgMenu) return;
    if (!msgMenu.mine) { setStatus("Можно редактировать только своё"); closeMsgMenu(); return; }
    const v = (editText || "").trim();
    if (!v) { setStatus("Нельзя сохранить пустое"); return; }
    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.from("messages").update({ body: v }).eq("id", msgMenu.id);
      if (error) throw error;
      await loadMsgs();
      setStatus("Изменено ✅");
    } catch (e) {
      setStatus("Не удалось изменить: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
      closeMsgMenu();
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: 0.12 }}
      className={"rounded-2xl border border-white/10 bg-white/0 hover:bg-white/5 px-3 py-2 " + className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Pill({ children }) {
  return (
    <span className="text-[11px] text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
      {children}
    </span>
  );
}

async function uploadToMedia(file, path) {
  const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
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
  const [menuOpen, setMenuOpen] = useState(false);

  const [msgMenu, setMsgMenu] = useState(null); // { id, mine, x, y, body, type }
  const [editText, setEditText] = useState("");

  // voice
  const [recOn, setRecOn] = useState(false);
  const [recMs, setRecMs] = useState(0);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

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

    const mine = (mem || []).find((x) => x.user_id === uid);
    setMyRole(mine?.role || "member");

    const other = (mem || []).find((x) => x.user_id !== uid);
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
    // ВАЖНО: если supabase ругается на embed profiles из-за нескольких FK — оставь без embed и подгружай отдельно.
    // Но сейчас у тебя чаще всего уже норм.
    const { data, error } = await supabase
      .from("messages")
      .select("id,user_id,body,created_at,type,media_url,media_mime, profiles(display_name,avatar_url,username,public_id)")
      .eq("conversation_id", cid)
      .order("created_at", { ascending: true });

    if (error) {
      setStatus("Ошибка загрузки: " + error.message);
      return;
    }
    setMsgs(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      if (!ud.user) {
        nav("/login", { replace: true });
        return;
      }
      setMe(ud.user);
      await loadConv();
      await loadRoleAndPeer(ud.user.id);
      await loadMembersCount();
      await loadMsgs();
    })();
  }, [cid, nav]);

  // realtime messages
  useEffect(() => {
    let channel;
    (async () => {
      channel = supabase
        .channel("msgs-" + cid)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages", filter: "conversation_id=eq." + cid },
          async () => {
            try {
              await loadMsgs();
              if (document.hidden && ("Notification" in window) && Notification.permission === "granted") {
                new Notification("New message", { body: "Open the app" });
              }
            } catch {}
          }
        )
        .subscribe();
    })();

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {}
    };
  }, [cid]);

  useEffect(() => {
    const t = setInterval(loadMembersCount, 6000);
    return () => clearInterval(t);
  }, [cid]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const headerTitle = conv?.is_group ? (conv?.title || "Группа") : (dmPeer?.display_name || "Чат");
  const headerSubtitle = conv?.is_group ? `${membersCount} участник(ов)` : (dmPeer?.username ? "@" + dmPeer.username : "");

  const openTitle = () => {
    if (conv?.is_group) nav(`/group/${cid}`);
    else if (dmPeer?.id) nav(`/u/${dmPeer.id}`);
  };

  const sendTextReal = async () => {
    if (!me) return;
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.from("messages").insert({
        conversation_id: cid,
        user_id: me.id,
        body,
        type: "text",
      });
      if (error) throw error;
      setText("");
      await loadMsgs();
    } catch (e) {
      setStatus("Не удалось отправить: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  const uploadAndSendMedia = async (file) => {
    if (!me || !file) return;
    const mime = file.type || "";
    const isImg = mime.startsWith("image/");
    const isVid = mime.startsWith("video/");
    const isAud = mime.startsWith("audio/");
    if (!isImg && !isVid && !isAud) {
      setStatus("Можно только фото, видео или аудио");
      return;
    }
    setBusy(true);
    setStatus("");
    try {
      const ext = (file.name.split(".").pop() || (isImg ? "png" : isVid ? "mp4" : "webm")).toLowerCase();
      const path = `${cid}/${me.id}/${Date.now()}.${ext}`;

      const url = await uploadToMedia(file, path);

      const { error: insErr } = await supabase.from("messages").insert({
        conversation_id: cid,
        user_id: me.id,
        body: "",
        type: isImg ? "image" : isVid ? "video" : "audio",
        media_url: url,
        media_mime: mime,
      });
      if (insErr) throw insErr;

      await loadMsgs();
    } catch (e) {
      setStatus("Не удалось отправить файл: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  const startRec = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("Запись голоса не поддерживается");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        try { stream.getTracks().forEach((t) => t.stop()); } catch {}
      };

      mr.start();
      setRecOn(true);
      setRecMs(0);
      timerRef.current = setInterval(() => setRecMs((v) => v + 200), 200);
    } catch (e) {
      setStatus("Не удалось включить микрофон: " + (e?.message || String(e)));
    }
  };

  const stopRec = async () => {
    try {
      if (!recRef.current) return;
      recRef.current.stop();
      recRef.current = null;
    } catch {}

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecOn(false);

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];

    const f = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
    await uploadAndSendMedia(f);
  };

  const clearHistory = async () => {
    if (!confirm("Очистить историю чата?")) return;
    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.rpc("clear_conversation", { p_conversation_id: cid });
      if (error) throw error;
      await loadMsgs();
      setStatus("История очищена ✅");
    } catch (e) {
      setStatus("Не удалось очистить: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  const deleteChatForMe = async () => {
    if (!confirm("Удалить чат у себя (выйти)?")) return;
    setBusy(true);
    setStatus("");
    try {
      const { error } = await supabase.rpc("leave_conversation", { p_conversation_id: cid });
      if (error) throw error;
      nav("/chats");
    } catch (e) {
      setStatus("Не удалось удалить: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  const requestNotifs = async () => {
    try {
      if (!("Notification" in window)) {
        setStatus("Уведомления не поддерживаются");
        return;
      }
      const p = await Notification.requestPermission();
      setStatus(p === "granted" ? "Уведомления включены ✅" : "Уведомления запрещены");
    } catch {
      setStatus("Не получилось включить уведомления");
    } finally {
      setMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a0d] text-slate-100">
      <div className="mx-auto max-w-xl flex flex-col min-h-screen">
        <div className="sticky top-0 z-40 px-3 pt-3">
          <div className="rounded-3xl border border-white/10 bg-[#0b1014]/80 backdrop-blur px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <IconBtn onClick={() => nav("/chats")} aria-label="back">
                  <ArrowLeft size={18} />
                </IconBtn>
                <button onClick={openTitle} className="min-w-0 text-left hover:opacity-90">
                  <div className="text-base font-semibold truncate">{headerTitle}</div>
                  {headerSubtitle && <div className="text-xs text-slate-400 truncate">{headerSubtitle}</div>}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {conv?.is_group && isAdmin && (
                  <IconBtn onClick={() => {}} title="Переименовать (в группе)">
                    <Pencil size={18} />
                  </IconBtn>
                )}
                {conv?.is_group && isAdmin && (
                  <IconBtn onClick={() => {}} title="Добавить (в группе)">
                    <UserPlus size={18} />
                  </IconBtn>
                )}

                <div className="relative">
                  <IconBtn onClick={() => setMenuOpen((v) => !v)} title="Меню">
                    <MoreVertical size={18} />
                  </IconBtn>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 mt-2 w-60 rounded-2xl border border-white/10 bg-[#0b1014] p-2 shadow-2xl z-50"
                      >
                        <button
                          onClick={requestNotifs}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-left"
                        >
                          🔔 Уведомления
                        </button>
                        <button
                          onClick={clearHistory}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-left"
                        >
                          <Eraser size={16} />
                          Очистить историю
                        </button>
                        <button
                          onClick={deleteChatForMe}
                          className="w-full flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 text-left text-red-200"
                        >
                          <Trash2 size={16} />
                          Удалить чат у себя
                        </button>
                        <div className="px-3 pt-2 text-[11px] text-slate-500">Для группы: это “выйти”.</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 pt-3 pb-28 overflow-auto">
          <div className="rounded-3xl border border-white/10 bg-[#0b1014] p-3">
            {msgs.map((m) => {
              const mine = m.user_id === me?.id;
              const authorName = m.profiles?.display_name || "User";
              const authorAva = m.profiles?.avatar_url || "";
              const authorLetter = (authorName?.[0] || "U").toUpperCase();

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.14 }}
                  className={"mb-2 flex " + (mine ? "justify-end" : "justify-start")}
                >
                  <div className={"max-w-[88%] rounded-3xl border border-white/10 px-3 py-2 " + (mine ? "bg-[#0f2230]" : "bg-[#070a0d]")}>
                    {conv?.is_group && (
                      <div className="mb-1 flex items-center gap-2">
                        <button
                          onClick={() => nav(`/u/${m.user_id}`)}
                          className="h-6 w-6 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center text-xs font-bold hover:opacity-80"
                        >
                          {authorAva ? <img src={authorAva} className="h-full w-full object-cover" /> : authorLetter}
                        </button>
                        <button onClick={() => nav(`/u/${m.user_id}`)} className="text-xs text-slate-200 hover:opacity-90">
                          {authorName}
                        </button>
                      </div>
                    )}

                    {m.type === "text" && <div className="whitespace-pre-wrap break-words text-[15px] leading-snug">{m.body}</div>}
                    {m.type === "image" && m.media_url && <img src={m.media_url} className="rounded-2xl border border-white/10 max-h-[45vh]" />}
                    {m.type === "video" && m.media_url && (
                      <video controls src={m.media_url} className="rounded-2xl border border-white/10 max-h-[45vh] w-full" />
                    )}
                    {m.type === "audio" && m.media_url && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[11px] text-slate-400 mb-1">Голосовое</div>
                        <audio controls src={m.media_url} className="w-full" />
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <Pill>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Pill>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {status && <div className="mt-2 text-sm text-slate-400">{status}</div>}

        <AnimatePresence>
          {msgMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={closeMsgMenu}
            >
              <motion.div
                initial={{ scale: 0.98, y: 6 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98, y: 6 }}
                transition={{ duration: 0.12 }}
                onClick={(e)=>e.stopPropagation()}
                style={{ position: "fixed", left: Math.max(12, msgMenu.x - 140), top: Math.max(12, msgMenu.y - 10), width: 280 }}
                className="rounded-2xl border border-white/10 bg-[#0b1014] p-2 shadow-2xl"
              >
                <div className="px-2 py-1 text-xs text-slate-400">Сообщение</div>

                <button onClick={copyMsg} className="w-full text-left rounded-xl px-3 py-2 hover:bg-white/5">📋 Копировать</button>

                {msgMenu.mine && msgMenu.type === "text" && (
                  <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2">
                    <div className="text-xs text-slate-400 mb-1">Редактировать</div>
                    <textarea
                      value={editText}
                      onChange={(e)=>setEditText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl bg-[#070a0d] border border-white/10 px-3 py-2 text-sm outline-none focus:border-white/20"
                    />
                    <div className="mt-2 flex gap-2">
                      <button onClick={saveEditMsg} className="flex-1 rounded-xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 disabled:opacity-40" disabled={busy}>Сохранить</button>
                      <button onClick={closeMsgMenu} className="rounded-xl border border-white/10 px-3 py-2 hover:bg-white/5">Отмена</button>
                    </div>
                  </div>
                )}

                {msgMenu.mine && (
                  <button onClick={deleteMsg} className="mt-2 w-full text-left rounded-xl px-3 py-2 hover:bg-red-500/10 text-red-200">🗑 Удалить</button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <div className="fixed left-0 right-0 bottom-0 z-40">
          <div className="mx-auto max-w-xl px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            <div className="rounded-3xl border border-white/10 bg-[#0b1014]/80 backdrop-blur p-2 flex gap-2 items-center">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTextReal();
                  }
                }}
                placeholder="Сообщение…"
                className="flex-1 rounded-2xl bg-[#070a0d] border border-white/10 px-4 py-3 outline-none focus:border-white/20"
              />

              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => uploadAndSendMedia(e.target.files?.[0])}
              />

              <IconBtn onClick={() => fileRef.current?.click()} disabled={busy} title="Файл">
                <Paperclip size={18} />
              </IconBtn>

              {!recOn ? (
                <IconBtn onClick={startRec} disabled={busy} title="Голосовое">
                  <Mic size={18} />
                </IconBtn>
              ) : (
                <IconBtn onClick={stopRec} disabled={busy} title="Стоп запись" className="border-red-500/40 bg-red-500/10">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="ml-2 text-xs">{Math.round(recMs / 1000)}с</span>
                </IconBtn>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                disabled={busy}
                onClick={sendTextReal}
                className="rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold px-4 py-3 disabled:opacity-40 flex items-center gap-2"
              >
                <Send size={18} />
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
