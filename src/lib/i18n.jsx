import { useEffect, useState } from "react";

const KEY = "lang_v1";
const saved = (() => { try { return localStorage.getItem(KEY); } catch { return null; } })();
let LANG = saved || "ru";

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
    message: "Сообщение…",
    notifications: "Уведомления",
    notif_on: "Уведомления включены ✅",
    notif_off: "Уведомления запрещены",
    notif_unsupported: "Уведомления не поддерживаются",
  },
  en: {
    feed: "Feed",
    chats: "Chats",
    profile: "Profile",
    settings: "Settings",
    logout: "Log out",
    login: "Login",
    login_hint: "Sign in with Google",
    login_google: "Continue with Google",
    loading: "Loading…",
    comments: "Comments",
    reply: "Reply",
    reply_to: "Reply to",
    write_comment: "Write a comment…",
    write_reply: "Reply…",
    message: "Message…",
    notifications: "Notifications",
    notif_on: "Notifications enabled ✅",
    notif_off: "Notifications blocked",
    notif_unsupported: "Notifications not supported",
  },
  uk: {
    feed: "Стрічка",
    chats: "Чати",
    profile: "Профіль",
    settings: "Налаштування",
    logout: "Вийти",
    login: "Вхід",
    login_hint: "Увійди через Google",
    login_google: "Увійти з Google",
    loading: "Завантаження…",
    comments: "Коментарі",
    reply: "Відповісти",
    reply_to: "Відповідь на",
    write_comment: "Написати коментар…",
    write_reply: "Відповідь…",
    message: "Повідомлення…",
    notifications: "Сповіщення",
    notif_on: "Сповіщення увімкнено ✅",
    notif_off: "Сповіщення вимкнено",
    notif_unsupported: "Сповіщення не підтримуються",
  }
};

const listeners = new Set();

export function setLang(v){
  LANG = v;
  try { localStorage.setItem(KEY, v); } catch {}
  for (const fn of listeners) { try { fn(LANG); } catch {} }
}

export function getLang(){ return LANG; }

export function t(k){
  const d = DICT[LANG] || DICT.ru;
  return d[k] || (DICT.ru[k] || k);
}

export function useI18n(){
  const [lang, setLangState] = useState(getLang());
  useEffect(() => {
    const fn = (v) => setLangState(v);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return { lang, t, setLang };
}
