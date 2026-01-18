import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useI18n } from "../lib/i18n";
import { Send, CornerUpLeft } from "lucide-react";

function Avatar({ url, name }) {
  const letter = (name?.[0] || "U").toUpperCase();
  return (
    <div className="h-7 w-7 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center text-xs font-bold">
      {url ? <img src={url} className="h-full w-full object-cover" /> : letter}
    </div>
  );
}

function Row({ c, onReply, onOpenProfile, indent = false }) {
  const name = c.profiles?.display_name || "User";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.14 }}
      className={"rounded-2xl border border-white/10 bg-[#070a0d] p-3 " + (indent ? "ml-8" : "")}>
      <div className="flex items-start gap-2">
        <button onClick={() => onOpenProfile(c.user_id)} className="shrink-0 hover:opacity-80">
          <Avatar url={c.profiles?.avatar_url} name={name} />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => onOpenProfile(c.user_id)} className="text-sm font-semibold hover:opacity-90 truncate">{name}</button>
          <div className="text-[11px] text-slate-500">{new Date(c.created_at).toLocaleString()}</div>
          <div className="mt-1 text-sm text-slate-200 whitespace-pre-wrap break-words">{c.body}</div>
          <button onClick={() => onReply(c)} className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
            <CornerUpLeft size={14} /> Ответить
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function CommentsThread({ postId, onOpenProfile }) {
  const { t } = useI18n();
  const [me, setMe] = useState(null);
  const [list, setList] = useState([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("post_comments")
      .select("id,post_id,user_id,body,created_at,parent_id, profiles(display_name,avatar_url,username,public_id)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    if (error) { setStatus(error.message); return; }
    setList(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      setMe(ud?.user || null);
      await load();
    })();
  }, [postId]);

  useEffect(() => {
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [postId]);

  const tree = useMemo(() => {
    const roots = [];
    const byParent = new Map();
    for (const c of list) {
      const key = c.parent_id || 0;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(c);
    }
    roots.push(...(byParent.get(0) || []));
    return { roots, byParent };
  }, [list]);

  const send = async () => {
    const body = text.trim();
    if (!me) { setStatus("Нужно войти"); return; }
    if (!body) return;
    setBusy(true); setStatus("");
    try {
      const payload = { post_id: postId, user_id: me.id, body, parent_id: replyTo?.id || null };
      const { error } = await supabase.from("post_comments").insert(payload);
      if (error) throw error;
      setText("");
      setReplyTo(null);
      await load();
    } catch (e) {
      setStatus(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="text-sm text-slate-300 mb-2">Комментарии</div>

      <div className="space-y-2">
        {tree.roots.map((c) => (
          <div key={c.id} className="space-y-2">
            <Row c={c} onReply={setReplyTo} onOpenProfile={onOpenProfile} />
            {(tree.byParent.get(c.id) || []).map((r) => (
              <Row key={r.id} c={r} indent onReply={setReplyTo} onOpenProfile={onOpenProfile} />
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            Ответ на: <span className="text-slate-100 font-semibold">{replyTo.profiles?.display_name || "User"}</span>
            <button onClick={() => setReplyTo(null)} className="ml-2 text-slate-400 hover:text-slate-200">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? t("write_reply") : t("write_comment")}
          className="flex-1 rounded-2xl bg-[#070a0d] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
        <button disabled={busy} onClick={send}
          className="btn-press rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold px-4 py-3 disabled:opacity-40 inline-flex items-center gap-2">
          <Send size={18} />
        </button>
      </div>

      {status && <div className="mt-2 text-xs text-slate-500">{status}</div>}
    </div>
  );
}
