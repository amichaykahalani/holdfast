// Single source of truth for the release-approval consent statement, shared
// by the client's checkbox UI and the server-side validation that gates
// releaseFunds — so the text a client sees, agrees to, and that ends up
// logged in escrow_events can never drift apart.
export const RELEASE_CONSENT_TEXT =
  "בלחיצה על הכפתור, אני מאשר/ת שקיבלתי את העבודה במלואה, שהיא עומדת בדרישות שסוכמו, ושאני שבע/ה רצון מהתוצאה.";
