import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const GIFTS = [
  { id: "rose", title: "Rose", src: "/models/rose.glb" },
  { id: "star", title: "Star", src: "/models/star.glb" },
  { id: "bear", title: "Bear", src: "/models/bear.glb" },
  { id: "diamond", title: "Diamond", src: "/models/diamond.glb" },
];

export default function Gifts() {
  const nav = useNavigate();
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:0.18}} className="min-h-screen bg-[#0b1014] text-slate-100">
      <div className="mx-auto max-w-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">🎁 Подарки (3D)</div>
          <button onClick={() => nav(-1)} className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">Назад</button>
        </div>

        <div className="text-sm text-slate-400 mb-3">
          Чтобы было реально “как NFT”, закинь .glb модели в public/models (rose.glb, star.glb, bear.glb, diamond.glb).
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GIFTS.map(g => (
            <div key={g.id} className="rounded-2xl border border-white/10 bg-[#0e141b] p-3">
              <div className="text-sm font-semibold mb-2">{g.title}</div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0b1014]">
                <model-viewer src={g.src} camera-controls auto-rotate rotation-per-second="25deg"
                  style={{ width: "100%", height: 240 }} exposure="1.1"></model-viewer>
              </div>
              <button className="mt-3 w-full rounded-2xl bg-[#2ea6ff] text-[#071018] font-semibold py-2 active:scale-95 transition">
                Подарить
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
