import { createContext, useContext, useEffect, useMemo, useState } from "react";

const KEY = "app_lang";

const dict = {
  ru: {
    menu: "Меню", feed: "Лента", chats: "Чаты", profile: "Профиль", settings: "Настройки", back: "Назад",
    new_post: "Что нового?", post_btn: "Пост", empty_feed: "Пока пусто.",
    search_by_username: "Поиск по username", search_hint: "Можно вводить часть — ищет внутри", search_ph: "например: alex", find: "Найти",
    my_chats: "Мои чаты", results: "Результаты поиска", no_chats: "Пока нет чатов", not_found: "Не найдено",
    profile_not_found: "Профиль не найден", write: "Написать",
    comments: "Комментарии", reply: "Ответить", reply_to: "Ответ на:", write_comment: "Написать комментарий…", write_reply: "Ответ…",
    logout: "Выйти",
    search_error: "Ошибка поиска:", open_chat_error: "Не удалось открыть чат:",
  },
  en: {
    menu: "Menu", feed: "Feed", chats: "Chats", profile: "Profile", settings: "Settings", back: "Back",
    new_post: "What's new?", post_btn: "Post", empty_feed: "Nothing here yet.",
    search_by_username: "Search by username", search_hint: "You can type a part — it matches inside", search_ph: "e.g.: alex", find: "Find",
    my_chats: "My chats", results: "Search results", no_chats: "No chats yet", not_found: "Not found",
    profile_not_found: "Profile not found", write: "Message",
    comments: "Comments", reply: "Reply", reply_to: "Reply to:", write_comment: "Write a comment…", write_reply: "Reply…",
    logout: "Log out",
    search_error: "Search error:", open_chat_error: "Could not open chat:",
  },
  uk: {
    menu: "Меню", feed: "Стрічка", chats: "Чати", profile: "Профіль", settings: "Налаштування", back: "Назад",
    new_post: "Що нового?", post_btn: "Пост", empty_feed: "Поки порожньо.",
    search_by_username: "Пошук за username", search_hint: "Можна ввести частину — шукає всередині", search_ph: "наприклад: alex", find: "Знайти",
    my_chats: "Мої чати", results: "Результати пошуку", no_chats: "Поки немає чатів", not_found: "Не знайдено",
    profile_not_found: "Профіль не знайдено", write: "Написати",
    comments: "Коментарі", reply: "Відповісти", reply_to: "Відповідь на:", write_comment: "Написати коментар…", write_reply: "Відповідь…",
    logout: "Вийти",
    search_error: "Помилка пошуку:", open_chat_error: "Не вдалося відкрити чат:",
  },
};

function getLang(){
  const v = (localStorage.getItem(KEY) || "ru").toLowerCase();
  return (v === "en" || v === "uk" || v === "ru") ? v : "ru";
}

function setLangValue(lang){
  localStorage.setItem(KEY, lang);
  window.dispatchEvent(new Event("app_lang_change"));
}

const Ctx = createContext({ lang: "ru", setLang: () => {}, t: (k) => k });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getLang());

  useEffect(() => {
    const on = () => setLangState(getLang());
    window.addEventListener("app_lang_change", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("app_lang_change", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const api = useMemo(() => ({
    lang,
    setLang: (l) => setLangValue(l),
    t: (k) => (dict[lang]?.[k] ?? dict.ru[k] ?? k),
  }), [lang]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useI18n(){
  return useContext(Ctx);
}
