import { supabase } from "../lib/supabase";

export default function Login() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" }
    });
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#070a0d",
      display: "grid",
      placeItems: "center",
      color: "#fff"
    }}>
      <div style={{
        width: 320,
        padding: 24,
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#0b1014",
        textAlign: "center"
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1, marginBottom: 16 }}>
          SIDE
        </div>

        <button
          onClick={signIn}
          style={{
            width: "100%",
            padding: "14px 16px",
            borderRadius: 16,
            border: "none",
            background: "#fff",
            color: "#000",
            fontWeight: 800,
            cursor: "pointer"
          }}
        >
          Войти через Google
        </button>
      </div>
    </div>
  );
}
