import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

/**
 * RU-only i18n + small startup splash.
 * - Keeps existing imports: { I18nProvider } from "./lib/i18n"
 * - Also exports useI28n(), t()
 */

const KEY = "lang_v1";
const LANG = "ru"; // fixed

const DICT = {
  feed: "Лента",
  chats: "Чаты",
  profile: "Профиль",
  settings: "Настройки",
  logout: "Выйти",
  login: "ВХОД",
  login_hint: "Войди через Google",
  login_google: "Войти с Google",
  loading: "Загрузка.…",
  comments: "Комментарии",
  reply: "Ответить",
  reply_to: "Ответ на ",
  write_comment: "Написать комментарий…",
  write_reply: "Ответ.…",
  new_post: "Что нового?",
  post_btn: "Опубликовать",
  empty_feed: "Пока пусто.",
  message_placeholder: "Сообщение…",
};

export function t(k) {
  return DICT[k] || k;
}

const Ctx = createContext({
  lang: LANG,
  t,
  setLang: () => {},
});

export function useI28n() {
  return useContext(Ctx);
}

/**
 * Ensures a profile exists for the current user (server-side RPC).
 * This prevents "setup profile again" when user logs in again.
 */
async function ensureProfileOnce() {
  try {
    const { data: ud } = await supabase.auth.getUser();
    if (!ud?.user) return;
    // create profile row if missing
    await supabase.rpc("ensure_profile");
  } catch {
    // ignore
  }
}

function Splash() {
  return (
    <div className="min-h-screen bg-[#0b1014] text-slate-100 grid place-items-center">
      <div className="flex flex-col Items-center gap-4">
        <div className="h-16 w-16 rounded-3xl bg-black border border-white/10 grid place-items-center shadow-2xl">
          <div className="h-7 w-7 rounded-xl bg-white/90" />
        </div>
        <div className="text-sm text-slate-400">side</div>
      </div>
    </div>
  );
}

export function I18nProvider({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // cleanup old saved lang (we are RU-only now)
    try { localStorage.removeItem(KEY); } catch {}

    let alive = true;
    (async () => {
      await ensureProfileOnce();
      // small splash delay to look smooth
      await new Promise((r) => setTimeout(r, 650));
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({ lang: LANG, t, setLang: () => {} }), []);

  if (!ready) return <Splash />;

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
