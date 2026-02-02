import { useEffect, useState } from "react";

/**
 * Оставляем только русский.
 * Чтобы сборка не падала и компоненты могли:
 *   import { useI18n } from "../lib/i18n";
 */

const KEY = "lang_v1";
let LANG = "ru";

const DICT = {
  ru: {
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
    empty_feed: "Пока пусто",

    search_ph: "username (только a-z)",
    find: "Найти",
    write: "Написать",
    not_found: "Ничего не найдено",
    search_error: "Ошибка поиска:",
    open_chat_error: "Не удалось открыть чат:",
    search: "Поиск"
  }
};

const listeners = new Set();

export function setLang(_) {
  LANG = "ru";
  try { localStorage.setItem(KEY, "ru"); } catch {}
  for (const fn of listeners) { try { fn(LANG); } catch {} }
}

export function getLang() { return LANG; }

export function t(k) {
  return (DICT.ru && DICT.ru[k]) ? DICT.ru[k] : k;
}

export function useI18n() {
  const [lang, setLangState] = useState("ru");

  useEffect(() => {
    LANG = "ru";
    try {
      const s = localStorage.getItem(KEY);
      if (s !== "ru") localStorage.setItem(KEY, "ru");
    } catch {}

    const fn = (v) => setLangState(v || "ru");
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  return { lang, t, setLang };
}

// чтобы не падало, если где-то импортят Provider:
export function I18nProvider({ children }) {
  return children;
}
