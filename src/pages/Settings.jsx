import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

function MBtn({ className="", children, ...props }) {
  return (
    <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.95}} transition={{duration:0.12}} className={className} {...props}>
      {children}
    </motion.button>
  );
}

export default function Settings(){
  const nav = useNavigate();
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Настройки</div>
          <MBtn onClick={() => nav(-1)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</MBtn>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4 space-y-3">
          <div className="text-sm text-slate-300">Пока тут базовые настройки</div>
          <MBtn onClick={() => nav("/profile")} className="w-full rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 text-left">Мой профиль</MBtn>
          <MBtn onClick={() => nav("/chats")} className="w-full rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 text-left">Чаты</MBtn>
        </div>
      </div>
    </motion.div>
  );
}
