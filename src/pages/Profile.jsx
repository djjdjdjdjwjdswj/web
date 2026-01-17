import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "../lib/cropImage";

const rx = /^[a-z]{5,16}$/;

export default function Profile() {
  const nav = useNavigate();
  const fileRef = useRef(null);
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ display_name: "", username: "", bio: "", avatar_url: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(true);

  // crop modal
  const [cropOpen, setCropOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState(null);

  const usernameOk = useMemo(() => rx.test(form.username.trim()), [form.username]);

  useEffect(() => {
    (async () => {
      const { data: ud } = await supabase.auth.getUser();
      const u = ud.user;
      if (!u) { nav("/login", { replace: true }); return; }
      setMe(u);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      setForm({
        display_name: p?.display_name || "",
        username: p?.username || "",
        bio: p?.bio || "",
        avatar_url: p?.avatar_url || "",
      });
      setBusy(false);
    })();
  }, [nav]);

  const checkUsername = async () => {
    const u = form.username.trim();
    if (!rx.test(u)) { setStatus("Username недоступен: только a-z, 5–16 символов"); return false; }
    const { data } = await supabase.from("profiles").select("id").eq("username", u).limit(1);
    const taken = (data || []).some(r => r.id !== me?.id);
    if (taken) { setStatus("Username занят"); return false; }
    setStatus("Username свободен ✅");
    return true;
  };

  const uploadAvatarBlob = async (blob) => {
    if (!me || !blob) return;
    setBusy(true);
    setStatus("");
    const path = `${me.id}/avatar.png`;
    const file = new File([blob], "avatar.png", { type: "image/png" });
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setStatus("Ошибка загрузки авы: " + upErr.message); setBusy(false); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl || "";
    setForm(f => ({ ...f, avatar_url: url }));
    await supabase.from("profiles").upsert({ id: me.id, avatar_url: url });
    setBusy(false);
    setStatus("Аватар обновлён ✅");
  };

  const onPickFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setStatus("Нужна картинка"); return; }
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setCropPixels(null);
    setPreviewOpen(false);
    setCropOpen(true);
  };

  const save = async () => {
    const dn = form.display_name.trim();
    const un = form.username.trim();
    if (dn.length < 2) return;
    setBusy(true);
    const ok = await checkUsername();
    if (!ok) { setBusy(false); return; }
    await supabase.from("profiles").upsert({
      id: me.id,
      display_name: dn,
      username: un,
      bio: form.bio.trim(),
      avatar_url: form.avatar_url || "",
    });
    setBusy(false);
    setStatus("Сохранено ✅");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  };

  const name = form.display_name || "User";
  const letter = (name[0] || "U").toUpperCase();
  const usernameView = form.username.trim() ? `@${form.username.trim()}` : "@—";

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Профиль</div>
          <div className="flex gap-2">
            <button onClick={() => nav("/")} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 active:scale-95 transition">Назад</button>
            <button onClick={logout} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 active:scale-95 transition">Выйти</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e141b] overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { if (form.avatar_url) setPreviewOpen(true); else fileRef.current?.click(); }}
                className="h-16 w-16 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold text-xl hover:opacity-90 active:scale-95 transition">
                {form.avatar_url ? <img src={form.avatar_url} className="h-full w-full object-cover" /> : letter}
              </button>
              <div className="min-w-0">
                <div className="text-lg font-semibold truncate">{name}</div>
                <div className="text-sm text-slate-400 truncate">{usernameView}</div>
                <button onClick={() => fileRef.current?.click()} className="mt-1 text-sm text-[#2ea6ff] hover:opacity-90 active:scale-95 transition">Изменить фото</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e)=>onPickFile(e.target.files?.[0])} />
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <div className="text-xs text-slate-400">Имя</div>
              <input value={form.display_name} onChange={(e)=>setForm(f=>({...f,display_name:e.target.value}))} onFocus={(e)=>e.target.select()}
                className="mt-1 w-full rounded-2xl bg-[#0b1014] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
            </div>

            <div>
              <div className="text-xs text-slate-400">Username (a-z, 5–16)</div>
              <input value={form.username} onChange={(e)=>setForm(f=>({...f,username:e.target.value.toLowerCase().replace(/[^a-z]/g,"")}))} onBlur={checkUsername} maxLength={16}
                className="mt-1 w-full rounded-2xl bg-[#0b1014] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
            </div>

            <div>
              <div className="text-xs text-slate-400">Bio</div>
              <textarea rows={3} value={form.bio} onChange={(e)=>setForm(f=>({...f,bio:e.target.value}))}
                className="mt-1 w-full resize-none rounded-2xl bg-[#0b1014] border border-white/10 px-4 py-3 outline-none focus:border-white/20" />
            </div>

            {status && <div className="text-sm text-slate-400">{status}</div>}

            <button onClick={save} disabled={busy || form.display_name.trim().length<2 || !usernameOk}
              className="w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 disabled:opacity-40 active:scale-95 transition">Сохранить</button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <AnimatePresence>
        {previewOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
            <motion.div initial={{scale:0.96}} animate={{scale:1}} exit={{scale:0.96}} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0e141b] overflow-hidden">
              <div className="p-3 flex items-center justify-between border-b border-white/10">
                <div className="font-semibold">Фото</div>
                <button onClick={()=>setPreviewOpen(false)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 active:scale-95 transition">Закрыть</button>
              </div>
              <div className="p-4 grid place-items-center">
                {form.avatar_url && <img src={form.avatar_url} className="max-h-[70vh] rounded-2xl border border-white/10" />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crop modal */}
      <AnimatePresence>
        {cropOpen && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 bg-black/70 p-4">
            <div className="mx-auto max-w-md h-full flex flex-col">
              <motion.div initial={{y:10,opacity:0}} animate={{y:0,opacity:1}} exit={{y:10,opacity:0}} className="rounded-2xl border border-white/10 bg-[#0e141b] overflow-hidden flex-1 flex flex-col">
                <div className="p-3 flex items-center justify-between border-b border-white/10">
                  <div className="font-semibold">Обрезка фото</div>
                  <button onClick={()=>{setCropOpen(false); if (imgSrc) URL.revokeObjectURL(imgSrc);}} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5 active:scale-95 transition">Отмена</button>
                </div>
                <div className="relative flex-1 bg-[#0b1014]">
                  <Cropper
                    image={imgSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, p)=>setCropPixels(p)}
                  />
                </div>
                <div className="p-4 border-t border-white/10">
                  <div className="text-xs text-slate-400 mb-2">Зум</div>
                  <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e)=>setZoom(Number(e.target.value))} className="w-full" />
                  <button
                    onClick={async()=>{
                      try {
                        if (!cropPixels) return;
                        const blob = await getCroppedBlob(imgSrc, cropPixels);
                        setCropOpen(false);
                        await uploadAvatarBlob(blob);
                        if (imgSrc) URL.revokeObjectURL(imgSrc);
                      } catch (e) {
                        setStatus("Ошибка обрезки: " + (e?.message || e));
                      }
                    }}
                    className="mt-3 w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 active:scale-95 transition">
                    Сохранить фото
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
