import { motion, AnimatePresence } from "framer-motion";

export default function MenuDrawer({ open, onClose, onGo, meProfile }) {
  const name = meProfile?.display_name || "User";
  const username = meProfile?.username ? `@${meProfile.username}` : "@—";
  const ava = meProfile?.avatar_url || "";
  const letter = (name[0] || "U").toUpperCase();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55"
          />
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="absolute left-0 top-0 h-full w-[290px] bg-[#0e141b] border-r border-white/10 overflow-hidden">

            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[#1f2a36] overflow-hidden grid place-items-center font-bold">
                  {ava ? <img src={ava} className="h-full w-full object-cover" /> : letter}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{name}</div>
                  <div className="text-sm text-slate-400 truncate">{username}</div>
                </div>
              </div>
            </div>

            <div className="p-3 space-y-2">
              <button onClick={() => {onGo("/profile"); onClose();}} className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition">
                👤 Мой профиль
              </button>
              <button onClick={() => {onGo("/chats"); onClose();}} className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition">
                💬 Чаты
              </button>
              <button onClick={() => {onGo("/gifts"); onClose();}} className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition">
                🎁 Подарки (3D)
              </button>
              <button onClick={() => {onGo("/settings"); onClose();}} className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition">
                ⚙ Настройки
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
