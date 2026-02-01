export default function FatalEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && key) return null;

  return (
    <div style={{minHeight:"100vh",background:"#070a0d",color:"#e5e7eb",display:"grid",placeItems:"center",padding:"24px"}}>
      <div style={{maxWidth:520,width:"100%",border:"1px solid rgba(255,255,255,0.10)",borderRadius:24,padding:18,background:"#0b1014"}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:8}}>Ошибка конфигурации</div>
        <div style={{opacity:0.85,lineHeight:1.45}}>
          На Vercel не заданы переменные окружения для Supabase.
          <br/><br/>
          Нужно добавить:
          <div style={{marginTop:10,fontFamily:"monospace",fontSize:12,opacity:0.9}}>
            VITE_SUPABASE_URL<br/>
            VITE_SUPABASE_ANON_KEY
          </div>
          <br/>
          Потом сделать Redeploy.
        </div>
      </div>
    </div>
  );
}
