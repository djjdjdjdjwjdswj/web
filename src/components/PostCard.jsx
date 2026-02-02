import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import CommentsThread from "./CommentsThread.jsx";
import { useI18n } from "../lib/i18n";
import { Trash2, Share2, Heart, MessageCircle } from "lucide-react";

export default function PostCard({ post, onReload }) {
  const nav = useNavigate();
  const { t } = useI18n();
  const [me, setMe] = useState(null);
  const [openComments, setOpenComments] = useState(false);

  const [likes, setLikes] = useState(post?.likes_count || 0);
  const [liked, setLiked] = useState(false);
  const [busyLike, setBusyLike] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      const u = ud?.user || null;
      setMe(u);

      if (u?.id && post?.id) {
        const { data } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("post_id", post.id)
          .eq("user_id", u.id)
          .maybeSingle();
        setLiked(!!data);
      }
    })();
  }, [post?.id]);

  const authorName = post?.profiles?.display_name || "User";
  const authorAva = post?.profiles?.avatar_url || "";
  const authorLetter = (authorName?.[0] || "U").toUpperCase();

  const toggleLike = async () => {
    if (busyLike) return;
    if (!me) { alert("Нужно войти"); return; }
    setBusyLike(true);
    try {
      const { data, error } = await supabase.rpc("toggle_post_like", { p_post_id: post.id });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setLiked(!!row?.liked);
      setLikes(Number(row?.likes_count || 0));
    } catch (e) {
      console.log("like err", e?.message || e);
      alert("Не удалось поставить лайк");
    } finally {
      setBusyLike(false);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "SIDE", url });
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url);
      alert("Ссылка скопирована ✅");
    } catch {
      prompt("Скопируй ссылку:", url);
    }
  };

  const deleteMyPost = async () => {
    if (!me || me.id !== post.user_id) return;
    if (!confirm("Удалить пост?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id).eq("user_id", me.id);
    if (error) {
      alert("Не удалось удалить: " + error.message);
      return;
    }
    onReload?.();
  };

  return (
    <motion.div
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="rounded-3xl ring-soft bg-[#0e141b] p-4"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => nav(`/u/${post.user_id}`)}
          className="h-11 w-11 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold hover:opacity-90"
        >
          {authorAva ? <img src={authorAva} className="h-full w-full object-cover" /> : authorLetter}
        </button>

        <div className="min-w-0 flex-1">
          <button onClick={() => nav(`/u/${post.user_id}`)} className="text-sm font-semibold hover:opacity-90 truncate">
            {authorName}
          </button>
          <div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={sharePost}
            title="Поделиться"
            className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition"
          >
            <Share2 size={16} />
          </button>

          {me?.id === post.user_id && (
            <button
              onClick={deleteMyPost}
              title="Удалить"
              className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition text-red-200"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {post.content && (
        <div className="mt-3 text-[15px] text-slate-100 whitespace-pre-wrap break-words">{post.content}</div>
      )}

      {post.media_url && (
        <div className="mt-3">
          {String(post.media_mime || "").startsWith("video/") ? (
            <video controls src={post.media_url} className="w-full rounded-3xl ring-soft max-h-[55vh]" />
          ) : String(post.media_mime || "").startsWith("audio/") ? (
            <audio controls src={post.media_url} className="w-full" />
          ) : (
            <img src={post.media_url} className="w-full rounded-3xl ring-soft max-h-[55vh] object-cover" />
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
        <button
          onClick={toggleLike}
          disabled={busyLike}
          className={
            "btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition inline-flex items-center gap-2 " +
            (liked ? "text-red-300" : "")
          }
        >
          <Heart size={16} />
          {likes}
        </button>

        <button
          onClick={() => setOpenComments((v) => !v)}
          className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition inline-flex items-center gap-2"
        >
          <MessageCircle size={16} />
          {t("comments")}
        </button>
      </div>

      <AnimatePresence>
        {openComments && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.14 }}>
            <CommentsThread postId={post.id} onOpenProfile={(uid) => nav(`/u/${uid}`)} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
