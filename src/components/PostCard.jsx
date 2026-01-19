import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import CommentsThread from "./CommentsThread.jsx";
import { useI18n } from "../lib/i18n";

export default function PostCard({ post, onReload }) {
  const nav = useNavigate();
  const { t } = useI18n();
  const [me, setMe] = useState(null);
  const [openComments, setOpenComments] = useState(false);
  const [likes, setLikes] = useState(post?.likes_count || 0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      setMe(ud?.user || null);
    })();
  }, []);

  const authorName = post?.profiles?.display_name || "User";
  const authorAva = post?.profiles?.avatar_url || "";
  const authorLetter = (authorName?.[0] || "U").toUpperCase();

  const toggleLike = async () => {
    // TODO: сделаем нормально через post_likes (сохранение в базе)
    setLiked(v => !v);
    setLikes(x => (liked ? Math.max(0, x - 1) : x + 1));
  };

  const hasMedia = !!post?.media_url;
  const isVideo = String(post?.media_mime || "").startsWith("video/");

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}}
      className="rounded-3xl ring-soft bg-[#0e141b] p-4">

      <div className="flex items-center gap-3">
        <button onClick={() => nav(`/u/${post.user_id}`)} className="h-11 w-11 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold hover:opacity-90">
          {authorAva ? <img src={authorAva} className="h-full w-full object-cover" /> : authorLetter}
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => nav(`/u/${post.user_id}`)} className="text-sm font-semibold hover:opacity-90 truncate">{authorName}</button>
          <div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</div>
        </div>
      </div>

      {post.content && <div className="mt-3 text-[15px] text-slate-100 whitespace-pre-wrap break-words">{post.content}</div>}

      {hasMedia && (
        <div className="mt-3">
          {isVideo ? (
            <video controls src={post.media_url} className="w-full rounded-3xl ring-soft max-h-[60vh]" />
          ) : (
            <img src={post.media_url} className="w-full rounded-3xl ring-soft max-h-[60vh] object-cover" />
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
        <button onClick={toggleLike} className={"btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition " + (liked ? "text-red-300" : "")}>❤ {likes}</button>
        <button onClick={() => setOpenComments(v=>!v)} className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition">💬 {t("comments")}</button>
        <button onClick={() => navigator.clipboard?.writeText(window.location.href)} className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition">↗</button>
      </div>

      <AnimatePresence>
        {openComments && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}} transition={{duration:0.14}}>
            <CommentsThread
              postId={post.id}
              onOpenProfile={(uid) => nav(`/u/${uid}`)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
