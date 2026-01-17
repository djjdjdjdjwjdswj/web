export default function Post({ post, onLike }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e141b] p-4 hover:bg-white/[0.03] transition">
      <div className="flex gap-3">
        <div className="h-11 w-11 rounded-full bg-[#1f2a36] grid place-items-center font-bold">
          {(post.name || post.user || "?")[0].toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold truncate">{post.name || post.user}</div>
            <div className="text-sm text-slate-500 truncate">@{post.user}</div>
            <div className="text-sm text-slate-600">·</div>
            <div className="text-sm text-slate-500">now</div>
          </div>

          <div className="mt-2 text-[15px] leading-relaxed text-slate-100">{post.text}</div>

          <div className="mt-3 flex items-center gap-6 text-sm text-slate-400">
            <button className="hover:text-blue-400">💬 {post.comments ?? 0}</button>
            <button onClick={onLike} className="hover:text-red-400">❤ {post.likes ?? 0}</button>
            <button className="hover:text-emerald-400">↗ {post.shares ?? 0}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
