import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Shield, Languages, LayoutGrid, ArrowLeft } from "lucide-react";
import { useI18n } from "../lib/i18n";

function Card({ title, icon, children }){
  return (
    <div className="rounded-3xl ring-soft bg-[#0b1014] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-2xl bg-white/5 ring-soft grid place-items-center">{icon}</div>
        <div className="font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange, label, hint }){
  return (
    <button onClick={() => onChange(!value)} className="w-full flex items-center justify-between rounded-2xl border border-white/10 bg-white/0 hover:bg-white/5 px-4 py-3 transition">
      <div className="text-left">
        <div className="text-sm">{label}</div>
        {hint && <div className="text-xs text-slate-400">{hint}</div>}
      </div>
      <div className={"h-6 w-11 rounded-full border border-white/10 relative " + (value ? "bg-[#2ea6ff]/30" : "bg-white/5")}>
        <div className={"absolute top-1 h-4 w-4 rounded-full bg-white transition " + (value ? "left-6" : "left-1")}></div>
      </div>
    </button>
  );
}

export default function Settings(){
  const nav = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [s, setS] = useState({ compact:false, sounds:true, notify:true, blur:true, animations:true, privacyHideOnline:false, lang:"ru" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("app_settings");
      if (raw) setS(x => ({...x, ...JSON.parse(raw)}));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("app_settings", JSON.stringify(s)); } catch {}
  }, [s]);

  const setLangBoth = (v) => {
    setS(o => ({ ...o, lang: v }));
    setLang(v);
  };

  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#070a0d] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="rounded-3xl glass ring-soft px-3 py-3 mb-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">{t("settings")}</div>
            <div className="text-xs text-slate-400">lang: {lang}</div>
          </div>
          <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.95}} onClick={() => nav(-1)} className="btn-press rounded-2xl ring-soft hover:bg-white/5 px-3 py-2">
            <ArrowLeft size={18} />
          </motion.button>
        </div>

        <div className="space-y-3">
          <Card title="Интерфейс" icon={<LayoutGrid size={18} />}>
            <div className="space-y-2">
              <Toggle value={s.compact} onChange={(v)=>setS(o=>({...o,compact:v}))} label="Компактный режим" hint="меньше отступы" />
              <Toggle value={s.blur} onChange={(v)=>setS(o=>({...o,blur:v}))} label="Стекло/blur" hint="красивые панели" />
              <Toggle value={s.animations} onChange={(v)=>setS(o=>({...o,animations:v}))} label="Анимации" hint="плавные нажатия" />
            </div>
          </Card>

          <Card title="Уведомления" icon={<Bell size={18} />}>
            <div className="space-y-2">
              <Toggle value={s.notify} onChange={(v)=>setS(o=>({...o,notify:v}))} label="Уведомления" hint="позже можно push" />
              <Toggle value={s.sounds} onChange={(v)=>setS(o=>({...o,sounds:v}))} label="Звуки" hint="клик/отправка" />
            </div>
          </Card>

          <Card title="Приватность" icon={<Shield size={18} />}>
            <div className="space-y-2">
              <Toggle value={s.privacyHideOnline} onChange={(v)=>setS(o=>({...o,privacyHideOnline:v}))} label="Скрывать онлайн" hint="позже сделаем реально" />
            </div>
          </Card>

          <Card title={t("settings") + " • Language"} icon={<Languages size={18} />}>
            <div className="flex gap-2">
              <button onClick={()=>setLangBoth("ru")} className={"flex-1 rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 " + (lang==="ru" ? "bg-white/5" : "")}>Рус</button>
              <button onClick={()=>setLangBoth("ua")} className={"flex-1 rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 " + (lang==="ua" ? "bg-white/5" : "")}>Укр</button>
              <button onClick={()=>setLangBoth("en")} className={"flex-1 rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 " + (lang==="en" ? "bg-white/5" : "")}>Eng</button>
            </div>
            <div className="mt-2 text-xs text-slate-500">Теперь язык реально влияет на интерфейс (меню/кнопки/плейсхолдеры).</div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
