export function validateUsername(u) {
  const v = (u || "").trim();
  if (!/^[a-z]+$/.test(v)) return "Только английские буквы a-z";
  if (v.length < 5) return "Минимум 5 букв";
  if (v.length > 16) return "Максимум 16 букв";
  return "";
}
