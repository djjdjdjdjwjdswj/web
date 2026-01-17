import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

export default function PostCard({ post, onOpenUser, onReload }) {
  const [me, setMe] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");

  const loadMeta = async () => {
    const { data: ud } = await supabase.auth.getUser();
    const user = ud.user;
    setMe(user);
    const { count: lc } = await supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id);
    setLikes(lc || 0);
    const { count: cc } = await supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("post_id", post.id);
    setCommentsCount(cc || 0);
    if (user) {
      const { data: mine } = await supabase.from("post_likes").select("post_id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle();
      setLiked(!!mine);
    } else setLiked(false);
  };

  const loadComments = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from("post_comments")
      .select("id, user_id, body, created_at")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(50);
    if (error) { console.error(error); setComments([]); setLoading(false); return; }
    const ids = [...new Set((rows || []).map(r => r.user_id))];
    let map = new Map();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name,avatar_url,username").in("id", ids);
      map = new Map((profs || []).map(p => [p.id, p]));
    }
    setComments((rows || []).map(r => ({ ...r, profile: map.get(r.user_id) || null })));
    setLoading(false);
  };

  useEffect(() => { loadMeta(); }, [post.id]);

  const toggleLike = async () => {
    if (!me) return;
    if (!liked) await supabase.from("post_likes").insert({ post_id: post.id, user_id: me.id });
    else await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", me.id);
    await loadMeta();
  };

  const addComment = async () => {
    const t = text.trim();
    if (!t || !me) return;
    setText("");
    await supabase.from("post_comments").insert({ post_id: post.id, user_id: me.id, body: t });
    await loadMeta();
    await loadComments();
  };

  const deletePost = async () => {
    if (!me || me.id !== post.user_id) return;
    await supabase.from("posts").delete().eq("id", post.id).eq("user_id", me.id);
    onReload?.();
  };

  const prof = post.profiles || {};
  const name = prof.display_name || "User";
  const ava = prof.avatar_url || "";
  const username = prof.username ? `@${prof.username}` : "@—";
  const letter = (name[0] || "U").toUpperCase();
  const mine = me?.id === post.user_id;

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}}
      className="rounded-2xl border border-white/10 bg-[#0e141b] p-4">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onOpenUser(post.user_id)} className="flex items-center gap-3 text-left hover:opacity-90">
          <div className="h-10 w-10 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold">
            {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
          </div>
          <div>
            <div className="font-semibold leading-tight">{name}</div>
            <div className="text-xs text-slate-400">{username} · {new Date(post.created_at).toLocaleString()}</div>
          </div>
        </button>
        {mine && <button onClick={deletePost} className="text-sm text-slate-400 hover:text-red-300 active:scale-95 transition">🗑</button>}
      </div>

      <div className="mt-3 whitespace-pre-wrap">{post.content}</div>

      <div className="mt-3 flex items-center gap-5 text-sm text-slate-400">
        <button onClick={toggleLike} className={"hover:text-red-300 active:scale-95 transition " + (liked ? "text-red-300" : "")}>❤ {likes}</button>
        <button onClick={async()=>{const next=!show; setShow(next); if(next) await loadComments();}}
          className="hover:text-blue-300 active:scale-95 transition">💬 {commentsCount}</button>
      </div>

      <AnimatePresence>
        {show && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:0.18}}
            className="mt-3 border-t border-white/10 pt-3 overflow-hidden">
            {loading ? (
              <div className="text-sm text-slate-400">Загрузка…</div>
            ) : (
              <div className="space-y-2">
                {comments.length===0 && <div className="text-sm text-slate-400">Комментариев пока нет.</div>}
                {comments.map(c => {
                  const p = c.profile || {};
                  const n = p.display_name || "User";
                  const a = p.avatar_url || "";
                  const l = (n[0] || "U").toUpperCase();
                  return (
                    <div key={c.id} className="flex gap-2">
                      <button onClick={() => onOpenUser(c.user_id)} className="h-8 w-8 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold text-xs">
                        {a ? <img src={a} className="h-full w-full object-cover" /> : l}
                      </button>
                      <div className="flex-1">
                        <div className="text-xs text-slate-400">{n} · {new Date(c.created_at).toLocaleString()}</div>
                        <div className="text-sm">{c.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {me && (
              <div className="mt-3 flex gap-2">
                <input value={text} onChange={(e)=>setText(e.target.value)} placeholder="Комментарий…"
                  className="flex-1 rounded-xl bg-[#0b1014] border border-white/10 px-3 py-2 outline-none focus:border-white/20" />
                <button onClick={addComment} disabled={!text.trim()}
                  className="rounded-xl bg-[#2ea6ff] text-[#071018] font-semibold px-3 py-2 disabled:opacity-40 active:scale-95 transition">Отпр</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
