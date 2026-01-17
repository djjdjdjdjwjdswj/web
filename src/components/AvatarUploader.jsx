import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AvatarUploader({ userId, onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const upload = async (file) => {
    try {
      setErr("");
      if (!file) return;
      if (!file.type.startsWith("image/")) { setErr("Нужна картинка"); return; }
      if (file.size > 3 * 1024 * 1024) { setErr("Макс 3MB"); return; }
      setBusy(true);

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl;
      onUploaded(url);
    } catch (e) {
      console.error(e);
      setErr(e?.message || "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="text-xs text-slate-400">Аватар (загрузить файл)</div>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={(e) => upload(e.target.files?.[0])}
        className="mt-2 block w-full text-sm text-slate-300 file:mr-3 file:rounded-xl file:border file:border-white/10 file:bg-[#0b1014] file:px-3 file:py-2 file:text-slate-200 hover:file:bg-white/5"
      />
      {err && <div className="mt-2 text-sm text-red-300">{err}</div>}
    </div>
  );
}
