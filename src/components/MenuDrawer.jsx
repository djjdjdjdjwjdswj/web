import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MenuDrawer({ open, onClose, onGo }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          <button
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-label="close"
          />

          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute left-3 top-3 bottom-3 w-[320px] max-w-[90vw] rounded-3xl border border-white/10 bg-[#0e141b] p-3 shadow-2xl"
          >
            <div className="px-3 py-2">
              <div className="text-lg font-semibold">Меню</div>
              <div className="text-xs text-slate-400">быстрые действия</div>
            </div>

            <div className="mt-2 space-y-2">
              <button
                onClick={() => { onGo?.("/"); onClose?.(); }}
                className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition"
              >
                📰 Лента
              </button>

              <button
                onClick={() => { onGo?.("/chats"); onClose?.(); }}
                className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition"
              >
                💬 Чаты
              </button>

              <button
                onClick={() => { onGo?.("/profile"); onClose?.(); }}
                className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition"
              >
                👤 Мой профиль
              </button>

              <button
                onClick={() => { onGo?.("/settings"); onClose?.(); }}
                className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition"
              >
                ⚙️ Настройки
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => { onGo?.("/profile"); onClose?.(); }}
                className="w-full text-left rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/5 active:scale-[0.99] transition"
              >
                🚪 Выйти (в профиле)
              </button>
              <div className="mt-2 text-xs text-slate-500 px-1">Выход сейчас сделан в профиле, чтобы не путаться.</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
