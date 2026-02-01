export default function FatalEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a0d",
      color: "#e5e7eb",
      display: "grid",
      placeItems: "center",
      padding: 24
    }}>
      <div style={{
        maxWidth: 560,
        width: "100%",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 24,
        padding: 18,
        background: "#0b1014"
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
          Ошибка конфигурации (Vercel)
        </div>

        <div style={{ opacity: 0.9, lineHeight: 1.45 }}>
          Не заданы переменные окружения Supabase.
          <br /><br />
          Добавь на Vercel:
          <div style={{
            marginTop: 10,
            fontFamily: "monospace",
            fontSize: 12,
            padding: 12,
            borderRadius: 14,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            VITE_SUPABASE_URL<br />
            VITE_SUPABASE_ANON_KEY
          </div>
          <br />
          Потом сделай Redeploy.
        </div>
      </div>
    </div>
  );
}
