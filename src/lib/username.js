export function usernameError(u) {
  const v = (u || "").trim();
  if (!/^[a-z]+$/.test(v)) return "Недоступно: только a-z";
  if (v.length < 5) return "Недоступно: минимум 5 букв";
  if (v.length > 16) return "Недоступно: максимум 16 букв";
  return "";
}
