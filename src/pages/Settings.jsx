import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, Shield, LayoutGrid } from "lucide-react";
import { useI18n } from "../lib/i18n";

function Card({ title, icon, children }){
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1014] p-4">
      <div className="flex items-center gap-2 text-slate-200 mb-3">
        <span className="h-8 w-8 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">{icon}</span>
        <div className="font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, value, onChange, hint }){
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/0 hover:bg-white/5 px-4 py-3 transition"
    >
      <div className="text-left">
        <div className="text-sm text-slate-100">{label}</div>
        {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
      </div>
      <div className={"h-6 w-10 rounded-full border border-white/10 p-1 transition " + (value ? "bg-[#2ea6ff]/30" : "bg-white/5")}>
        <div className={"h-4 w-4 rounded-full transition " + (value ? "translate-x-4 bg-[#2ea6ff]" : "translate-x-0 bg-slate-300")}></div>
      </div>
    </button>
  );
}

export default function Settings(){
  const nav = useNavigate();
  const { t } = useI18n();

  const [notifs, setNotifs] = useState(false);
  const [safeMode, setSafeMode] = useState(true);
  const [compactUI, setCompactUI] = useState(false);

  useEffect(() => {
    try {
      setNotifs(localStorage.getItem("set_notifs_v1") === "1");
      setSafeMode(localStorage.getItem("set_safe_v1") !== "0");
      setCompactUI(localStorage.getItem("set_compact_v1") === "1");
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem("set_notifs_v1", notifs ? "1" : "0"); } catch {} }, [notifs]);
  useEffect(() => { try { localStorage.setItem("set_safe_v1", safeMode ? "1" : "0"); } catch {} }, [safeMode]);
  useEffect(() => { try { localStorage.setItem("set_compact_v1", compactUI ? "1" : "0"); } catch {} }, [compactUI]);

  const enableBrowserNotifs = async () => {
    try {
      if (!("Notification" in window)) return alert("Уведомления не поддерживаются");
      const p = await Notification.requestPermission();
      if (p === "granted") setNotifs(true);
      else alert("Разрешение на уведомления не выдано");
    } catch {
      alert("Не получилось включить уведомления");
    }
  };

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#070a0d] text-slate-100">
      <div className="mx-auto max-w-xl p-3 sm:p-4">
        <div className="rounded-3xl border border-white/10 bg-[#0b1014]/80 backdrop-blur px-3 py-3 mb-3 flex items-center justify-between">
          <button onClick={() => nav(-1)} className="rounded-2xl border border-white/10 bg-white/0 hover:bg-white/5 px-3 py-2">
            <ArrowLeft size={18} />
          </button>
          <div className="font-semibold">{t("settings")}</div>
          <div className="w-10" />
        </div>

        <div className="space-y-3">
          <Card title="Уведомления" icon={<Bell size={18} />}>
            <div className="space-y-2">
              <ToggleRow
                label="Показывать уведомления (браузер)"
                value={notifs}
                onChange={(v) => { setNotifs(v); if (v) enableBrowserNotifs(); }}
                hint="Работает в браузере/пва. Для пушей в фоне нужен отдельный сервис (позже сделаем)."
              />
            </div>
          </Card>

          <Card title="Безопасность" icon={<Shield size={18} />}>
            <div className="space-y-2">
              <ToggleRow
                label="Безопасный режим"
                value={safeMode}
                onChange={setSafeMode}
                hint="Скрывает лишние действия/опасные кнопки в интерфейсе."
              />
            </div>
          </Card>

          <Card title="Интерфейс" icon={<LayoutGrid size={18} />}>
            <div className="space-y-2">
              <ToggleRow
                label="Компактный режим"
                value={compactUI}
                onChange={setCompactUI}
                hint="Чуть плотнее карточки и отступы (удобнее на телефоне)."
              />
            </div>
          </Card>

          <div className="text-xs text-slate-500 px-1">
            Языки убраны — интерфейс теперь только на русском.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
