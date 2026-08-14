// Supabase's auth errors come back in English regardless of app locale —
// this maps the ones we're actually likely to hit to Hebrew, with a
// generic fallback so raw English never leaks through to the client.
const MESSAGE_MAP: Record<string, string> = {
  "Invalid login credentials": "האימייל או הסיסמה שגויים.",
  "User already registered": "כבר קיים חשבון עם כתובת האימייל הזו.",
  "Email not confirmed":
    "יש לאשר את כתובת האימייל לפני ההתחברות — בדקו את תיבת הדואר שלכם.",
  "Password should be at least 6 characters":
    "הסיסמה חייבת להכיל לפחות 6 תווים.",
  "Unable to validate email address: invalid format":
    "כתובת האימייל אינה תקינה.",
  "Email rate limit exceeded": "יותר מדי בקשות. נסו שוב בעוד כמה דקות.",
};

export function translateAuthError(message: string): string {
  if (MESSAGE_MAP[message]) return MESSAGE_MAP[message];

  const matchedKey = Object.keys(MESSAGE_MAP).find((key) =>
    message.includes(key),
  );
  if (matchedKey) return MESSAGE_MAP[matchedKey];

  return "משהו השתבש. נסו שוב.";
}
