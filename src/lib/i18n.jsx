import { useEffect, useState } from "react";

/**
 * Только русский язык.
 * ВАЖНО: экспортируем useI18n и I18nProvider, чтобы сборка не падала.
 */

const KEY = "lang_v1";
let LANG = "ru";

const DICT = {
  feed: "Лента",
  chats: "Чаты",
  profile: "Профиль",
  settings: "Настройки",
  logout: "Выйти",
  login: "Вход",
  login_hint: "Войди через Google",
  login_google: "Войти с Google",
  loading: "Загрузка…",
  comments: "Комментарии",
  reply: "Ответить",
  reply_to: "Ответ на",
  write_comment: "Написать комментарий…",
  write_reply: "Ответ…",
  new_post: "Что нового?",
  post_btn: "Опубликовать",
  empty_feed: "Пока пусто"
};

const listeners = new Set();

export function setLang(_) {
  LANG = "ru";
  try { localStorage.setItem(KEY, "ru"); } catch {}
  for (const fn of listeners) { try { fn("ru"); } catch {} }
}

export function getLang() {
  return "ru";
}

export function t(k) {
  return DICT[k] || k;
}

export function useI18n() {
  const [lang, setLangState] = useState("ru");

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s !== "ru") localStorage.setItem(KEY, "ru");
    } catch {}

    const fn = () => setLangState("ru");
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  return { lang, t, setLang };
}

// если где-то импортят Provider — пусть будет
export function I18nProvider({ children }) {
  return children;
}
