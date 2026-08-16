import Link from "next/link";
import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "מדיניות פרטיות — Kept",
};

export default function PrivacyPage() {
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
          מדיניות פרטיות
        </h1>
        <p className="mt-2 text-sm text-ink-faint">
          עודכן לאחרונה: 16 באוגוסט 2026
        </p>

        <div className="mt-8 flex flex-col gap-6 text-[0.9375rem] leading-relaxed text-ink-muted">
          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              איזה מידע אנחנו אוספים
            </h2>
            <p>
              כתובת האימייל שאיתה נרשמתם, כתובת האימייל של PayPal שאליה
              משולם הכסף, ופרטי העסקאות שאתם יוצרים — כותרות, תיאורים,
              סכומים, וסטטוסים.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              איך אנחנו משתמשים במידע
            </h2>
            <p>
              כדי להפעיל את השירות: זיהוי החשבון שלכם, עיבוד תשלומים דרך
              PayPal, תקשורת לגבי בקשות תשלום, ומניעת שימוש לרעה בשירות.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              שיתוף מידע
            </h2>
            <p>
              אנחנו לא מוכרים מידע אישי לצדדים שלישיים. מידע משותף רק עם
              הגורמים הדרושים להפעלת השירות עצמו — PayPal (לעיבוד
              תשלומים) ו-Supabase (ספק תשתית מסד הנתונים והאימות שלנו).
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              אבטחה
            </h2>
            <p>
              כל תנועת הכסף מתבצעת ומאובטחת על ידי PayPal — Kept אף פעם
              לא רואה או שומרת פרטי כרטיס אשראי או חשבון בנק.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              שמירת מידע
            </h2>
            <p>
              אנחנו שומרים את המידע כל עוד החשבון פעיל. ניתן לבקש מחיקת
              החשבון והמידע הנלווה בכל שלב.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              הזכויות שלכם
            </h2>
            <p>
              ניתן לבקש לראות, לתקן, או למחוק את המידע שלכם בכל שלב על
              ידי פנייה אלינו.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              שינויים במדיניות
            </h2>
            <p>
              ייתכנו עדכונים למדיניות זו מעת לעת. נעדכן אתכם דרך האתר או
              במייל במקרה של שינוי מהותי.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-semibold text-ink">
              יצירת קשר
            </h2>
            <p>
              לשאלות בנוגע לפרטיות, ניתן לפנות אלינו ב-
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
