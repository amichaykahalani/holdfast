import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "תנאי שימוש — Kept",
};

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-ink"
          >
            Kept
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          תנאי שימוש
        </h1>
        <p className="mt-2 text-sm text-ink-faint">
          עודכן לאחרונה: 16 באוגוסט 2026
        </p>

        <div className="mt-8 flex flex-col gap-6 text-[0.9375rem] leading-relaxed text-ink-muted">
          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              מה זה Kept
            </h2>
            <p>
              Kept הוא שירות שמחבר בין פרילנסרים ללקוחות שלהם, ומחזיק
              תשלומים בנאמנות עד לאישור העבודה. כל תנועת הכסף בפועל מתבצעת
              דרך PayPal — Kept עצמה אף פעם לא נוגעת בכסף ולא שומרת פרטי
              תשלום.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              איך זה עובד
            </h2>
            <p>
              פרילנסר יוצר בקשת תשלום עם כותרת, סכום, ותקופת בדיקה. הלקוח
              מקבל קישור ומשלם דרך PayPal — בלי צורך ליצור חשבון. הכסף
              מוחזק עד שהלקוח מאשר את העבודה, או עד שתקופת הבדיקה מסתיימת
              ואז הוא משוחרר אוטומטית.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              עמלת פלטפורמה
            </h2>
            <p>
              Kept גובה עמלה של 1% מסכום הבקשה, עם מינימום שמשתנה לפי
              הגודל: ₪1 לבקשות מתחת ל-₪100, ₪3 לבקשות בין ₪100–500, ₪7
              לבקשות בין ₪500–1000, וללא מינימום מעל ₪1000. העמלה מנוכה
              מהתשלום לפרילנסר — הלקוח משלם את הסכום המלא שסוכם. סכום
              מינימלי לבקשה: ₪20.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              מחלוקות
            </h2>
            <p>
              אם הלקוח מדווח על בעיה, הכספים מוקפאים באופן מיידי ועוברים
              בדיקה ידנית על ידי צוות Kept. אין כרגע תהליך אוטומטי לפתרון
              מחלוקות — כל מקרה נבדק לגופו. אנחנו עובדים על שיפור התהליך
              הזה ככל שהשירות גדל.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              אחריות
            </h2>
            <p>
              Kept היא פלטפורמה שמתווכת בין הצדדים ואינה צד להסכם העבודה
              עצמו. איננו יכולים להבטיח את איכות העבודה שסופקה, ואיננו
              אחראים למחלוקות על היקף או תוכן העבודה מעבר לתהליך הבדיקה
              הידנית המתואר לעיל.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              שינויים בתנאים
            </h2>
            <p>
              בשלב הזה של השירות ייתכנו שינויים בתנאים אלו מעת לעת. נעדכן
              אתכם דרך האתר או במייל במקרה של שינוי מהותי.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              יצירת קשר
            </h2>
            <p>
              לשאלות בנוגע לתנאים אלו, ניתן לפנות אלינו ב-
              <a
                href="mailto:support@kept.co.il"
                dir="ltr"
                className="text-accent underline decoration-line underline-offset-2 hover:text-accent-hover"
              >
                support@kept.co.il
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-faint">
        <SiteFooter />
      </footer>
    </div>
  );
}
