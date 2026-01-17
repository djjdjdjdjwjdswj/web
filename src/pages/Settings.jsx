import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Settings() {
  const nav = useNavigate();
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Настройки</div>
          <button onClick={() => nav(-1)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</button>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4 text-slate-300">
          Тут добавим: приватность, уведомления, безопасность, тема.
        </div>
      </div>
    </motion.div>
  );
}
