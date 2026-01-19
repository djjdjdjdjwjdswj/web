import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PostCard from "../components/PostCard";
import MenuDrawer from "../components/MenuDrawer";
import { motion } from "framer-motion";
import { useI18n } from "../lib/i18n";

export default function Feed() {
  const nav = useNavigate();
  const { t } = useI18n();

  const [me, setMe] = useState(null);
  const [meProfile, setMeProfile] = useState(null);

  const [text, setText] = useState("");
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const postingRef = useRef(false);

  const load = async () => {
    setBusy(true);
    const { data: ud } = await supabase.auth.getUser();
    if (!ud.user) { nav("/login", { replace: true }); return; }
    setMe(ud.user);

    const { data: mp } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url")
      .eq("id", ud.user.id)
      .maybeSingle();
    setMeProfile(mp || null);

    const { data, error } = await supabase
      .from("posts")
      .select("id,content,created_at,user_id,media_url,media_mime, profiles!posts_user_id_fkey(display_name,avatar_url,username)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) setPosts(data || []);
    setBusy(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const i = setInterval(load, 5000); return () => clearInterval(i); }, []);

  const createPost = async () => {
    const tt = text.trim();
    if (!tt || !me || postingRef.current) return;
    postingRef.current = true;
    setText("");
    await supabase.from("posts").insert({ user_id: me.id, content: tt });
    await load();
    postingRef.current = false;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="min-h-screen bg-[#0b1014] text-slate-100">
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onGo={(p) => nav(p)} meProfile={meProfile} />
      <div className="mx-auto max-w-xl p-3 sm:p-4">
        <div className="sticky top-0 z-10 bg-[#0b1014]/80 backdrop-blur border-b border-white/5 py-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setMenuOpen(true)} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 active:scale-95 transition">☰</button>
              <div className="text-lg font-semibold">{t("feed")}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => nav("/chats")} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 active:scale-95 transition">{t("chats")}</button>
              <button onClick={() => nav("/profile")} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 active:scale-95 transition">{t("profile")}</button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t("new_post")} rows={3}
            className="w-full resize-none rounded-2xl bg-[#070a0d] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
          <div className="mt-3 flex justify-end">
            <button onClick={createPost} disabled={!text.trim()}
              className="rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold px-4 py-2 disabled:opacity-40 active:scale-95 transition">
              {t("post_btn")}
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onOpenUser={(id) => nav(`/u/${id}`)} onReload={load} />
          ))}
          {!busy && posts.length === 0 && <div className="text-slate-400">{t("empty_feed")}</div>}
        </div>
      </div>
    </motion.div>
  );
}
