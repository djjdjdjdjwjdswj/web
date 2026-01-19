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
  const fileRef = useRef(null);

  const [me, setMe] = useState(null);
  const [meProfile, setMeProfile] = useState(null);

  const [text, setText] = useState("");
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [attach, setAttach] = useState(null); // File
  const [attachLabel, setAttachLabel] = useState("");

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

    const { data } = await supabase
      .from("posts")
      .select("id,content,created_at,user_id,media_url,media_mime, profiles(display_name,avatar_url,username)")
      .order("created_at", { ascending: false })
      .limit(100);

    setPosts(data || []);
    setBusy(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const i = setInterval(load, 7000); return () => clearInterval(i); }, []);

  const pickFile = () => fileRef.current?.click();

  const onFile = (f) => {
    if (!f) return;
    const mime = f.type || "";
    const ok = mime.startsWith("image/") || mime.startsWith("video/");
    if (!ok) return;
    setAttach(f);
    setAttachLabel(f.name || (mime.startsWith("video/") ? "video" : "image"));
  };

  const clearAttach = () => {
    setAttach(null);
    setAttachLabel("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadToMedia = async (file, uid) => {
    const mime = file.type || "";
    const isImg = mime.startsWith("image/");
    const isVid = mime.startsWith("video/");
    const ext = (file.name.split(".").pop() || (isImg ? "png" : "mp4")).toLowerCase();
    const path = `posts/${uid}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { url: data.publicUrl, mime };
  };

  const createPost = async () => {
    if (!me) return;
    const tt = text.trim();
    if (!tt && !attach) return;

    setBusy(true);
    try {
      let media_url = null;
      let media_mime = null;

      if (attach) {
        const up = await uploadToMedia(attach, me.id);
        media_url = up.url;
        media_mime = up.mime;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: me.id,
        content: tt || "",
        media_url,
        media_mime
      });
      if (error) throw error;

      setText("");
      clearAttach();
      await load();
    } finally {
      setBusy(false);
    }
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

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              <button onClick={pickFile} className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5 active:scale-95 transition">
                + Фото/Видео
              </button>
              {attach && (
                <div className="text-xs text-slate-300 border border-white/10 bg-white/5 px-3 py-2 rounded-2xl flex items-center gap-2">
                  <span className="truncate max-w-[140px]">{attachLabel}</span>
                  <button onClick={clearAttach} className="text-slate-400 hover:text-slate-200">×</button>
                </div>
              )}
            </div>

            <button onClick={createPost} disabled={busy || (!text.trim() && !attach)}
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
