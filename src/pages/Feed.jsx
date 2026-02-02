import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import PostCard from "../components/PostCard";
import MenuDrawer from "../components/MenuDrawer";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, Video, Mic, Send, X } from "lucide-react";
import { useI18n } from "../lib/i18n";

function GlassCard({ children, className = "" }) {
  return (
    <div className={"rounded-3xl border border-white/10 bg-[#0e141b] shadow-2xl " + className}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="inline-flex items-center gap-2 text-xs text-slate-400"
    >
      <span className="inline-block h-3 w-3 rounded-full border border-white/20 border-t-white/70 animate-spin" />
      Загрузка…
    </motion.div>
  );
}

async function uploadToMedia(file, path) {
  const { error: upErr } = await supabase.storage.from("media").upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export default function Feed() {
  const nav = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  const fileRef = useRef(null);

  const [me, setMe] = useState(null);
  const [meProfile, setMeProfile] = useState(null);

  const [text, setText] = useState("");
  const [posts, setPosts] = useState([]);
  const [busy, setBusy] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // медиа для поста
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [mediaMime, setMediaMime] = useState("");

  // голос для поста
  const [recOn, setRecOn] = useState(false);
  const [recMs, setRecMs] = useState(0);
  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const canPost = useMemo(() => text.trim().length > 0 || !!mediaFile, [text, mediaFile]);

  const load = async () => {
    setBusy(true);

    const { data: ud } = await supabase.auth.getUser();
    if (!ud.user) {
      nav("/login", { replace: true });
      return;
    }
    setMe(ud.user);

    const { data: mp } = await supabase
      .from("profiles")
      .select("id,display_name,username,avatar_url")
      .eq("id", ud.user.id)
      .maybeSingle();
    setMeProfile(mp || null);

    const { data, error } = await supabase
      .from("posts")
      .select("id,content,created_at,user_id,likes_count,media_url,media_mime, profiles(display_name,avatar_url,username)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      // если тут ошибка — почти всегда RLS
      console.log("posts load error:", error);
      setPosts([]);
      setBusy(false);
      return;
    }

    setPosts(data || []);

    try {
      const sp = new URLSearchParams(location.search);
      const pid = sp.get("post");
      if (pid) {
        const one = await supabase
          .from("posts")
          .select("id,content,created_at,user_id,media_url,media_mime, profiles(display_name,avatar_url,username)")
          .eq("id", pid)
          .maybeSingle();
        if (one?.data) {
          setPosts((prev)=>{
            const rest = (prev||[]).filter(x=>String(x.id)!==String(one.data.id));
            return [one.data, ...rest];
          });
        }
      }
    } catch {}

    setBusy(false);
  };

  useEffect(() => { (async () => { await load(); const id = new URLSearchParams(window.location.search).get("post"); if (id) { setTimeout(() => { const el = document.getElementById(`post-`); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 350); } })(); }, []);
  useEffect(() => { const i = setInterval(load, 6000); return () => clearInterval(i); }, []);

  const clearMedia = () => {
    if (mediaPreview) {
      try { URL.revokeObjectURL(mediaPreview); } catch {}
    }
    setMediaFile(null);
    setMediaPreview("");
    setMediaMime("");
  };

  const onPick = (f) => {
    if (!f) return;
    const mime = f.type || "";
    const ok = mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/");
    if (!ok) {
      alert("Можно только фото/видео/аудио");
      return;
    }
    clearMedia();
    setMediaFile(f);
    setMediaMime(mime);
    setMediaPreview(URL.createObjectURL(f));
  };

  const startRec = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Запись голоса не поддерживается");
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
      alert("Не удалось включить микрофон: " + (e?.message || String(e)));
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

    // делаем файл и ставим как медиа поста
    const f = new File([blob], `voice_${Date.now()}.webm`, { type: "audio/webm" });
    onPick(f);
  };

  const createPost = async () => {
    if (!me || !canPost) return;

    const content = text.trim();
    setText("");
    setBusy(true);

    try {
      let media_url = null;
      let media_mime = null;

      if (mediaFile) {
        const ext = (mediaFile.name.split(".").pop() || "bin").toLowerCase();
        const path = `posts/${me.id}/${Date.now()}.${ext}`;
        media_url = await uploadToMedia(mediaFile, path);
        media_mime = mediaMime || mediaFile.type || "";
      }

      const { error } = await supabase.from("posts").insert({
        user_id: me.id,
        content,
        media_url,
        media_mime,
      });

      if (error) throw error;

      clearMedia();
      await load();
    } catch (e) {
      alert("Не удалось опубликовать: " + (e?.message || String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
      className="min-h-screen bg-[#0b1014] text-slate-100"
    >
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} onGo={(p) => nav(p)} meProfile={meProfile} />

      <div className="mx-auto max-w-xl p-3 sm:p-4">
        <div className="sticky top-0 z-10 bg-[#0b1014]/80 backdrop-blur border-b border-white/5 py-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMenuOpen(true)}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 active:scale-95 transition"
              >
                ☰
              </button>
              <div className="text-lg font-extrabold tracking-wide">{t("feed")}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => nav("/chats")} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 active:scale-95 transition">
                {t("chats")}
              </button>
              <button onClick={() => nav("/profile")} className="rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5 active:scale-95 transition">
                {t("profile")}
              </button>
            </div>
          </div>
        </div>

        <GlassCard className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#121b24] border border-white/10 overflow-hidden grid place-items-center font-black">
              {meProfile?.avatar_url ? (
                <img src={meProfile.avatar_url} className="h-full w-full object-cover" />
              ) : (
                <span>{(meProfile?.display_name?.[0] || "S").toUpperCase()}</span>
              )}
            </div>

            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); createPost(); } }}
                placeholder={t("new_post")}
                rows={3}
                className="w-full resize-none rounded-2xl bg-[#070a0d] border border-white/10 px-4 py-3 outline-none focus:border-white/20"
              />

              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0])}
              />

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition inline-flex items-center gap-2 text-sm"
                  >
                    <ImagePlus size={18} /> Медиа
                  </button>

                  {!recOn ? (
                    <button
                      onClick={startRec}
                      className="btn-press rounded-2xl border border-white/10 px-3 py-2 hover:bg-white/5 transition inline-flex items-center gap-2 text-sm"
                    >
                      <Mic size={18} /> Голос
                    </button>
                  ) : (
                    <button
                      onClick={stopRec}
                      className="btn-press rounded-2xl border border-red-500/40 bg-red-500/10 px-3 py-2 hover:bg-red-500/15 transition inline-flex items-center gap-2 text-sm"
                    >
                      <span className="inline-block h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                      Стоп {Math.round(recMs / 1000)}с
                    </button>
                  )}
                </div>

                <button
                  onClick={createPost}
                  disabled={!canPost || busy}
                  className="rounded-2xl bg-[#2ea6ff] text-[#071018] font-extrabold px-4 py-2 disabled:opacity-40 active:scale-95 transition inline-flex items-center gap-2"
                >
                  {busy ? <Spinner /> : <><Send size={18} /> {t("post_btn")}</>}
                </button>
              </div>

              <AnimatePresence>
                {(mediaFile && mediaPreview) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="mt-3 rounded-2xl border border-white/10 bg-[#070a0d] p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-slate-400">Предпросмотр</div>
                      <button onClick={clearMedia} className="text-slate-300 hover:text-white inline-flex items-center gap-1 text-xs">
                        <X size={14} /> убрать
                      </button>
                    </div>

                    {mediaMime.startsWith("image/") && (
                      <img src={mediaPreview} className="w-full rounded-2xl border border-white/10 max-h-[55vh] object-cover" />
                    )}

                    {mediaMime.startsWith("video/") && (
                      <video controls src={mediaPreview} className="w-full rounded-2xl border border-white/10 max-h-[55vh]" />
                    )}

                    {mediaMime.startsWith("audio/") && (
                      <audio controls src={mediaPreview} className="w-full" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </GlassCard>

        <div className="mt-4 space-y-3">
          {!busy && posts.length === 0 && (
            <div className="text-slate-400">{t("empty_feed")}</div>
          )}

          {posts.map((p) => (
            <PostCard key={p.id} post={p} onReload={load} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
