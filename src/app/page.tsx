import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-paper">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight text-ink">
            Kept
          </span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-ink-muted hover:text-ink">
              התחברות
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-white hover:bg-accent-hover"
            >
              הרשמה
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-20 text-center">
        <p dir="ltr" className="text-lg text-ink-muted">
          Your money is <span className="font-semibold text-accent">Kept</span>.
        </p>
        <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          קבלו תשלום בלי לרדוף אחרי חשבוניות.
        </h1>
        <p className="mt-6 text-lg text-ink-muted">
          Kept מחזיקה את כספי הלקוח בנאמנות עד לאישור העבודה — או משחררת
          אותם אוטומטית כשתקופת הבדיקה מסתיימת. בלי חוזים, בלי טפסי בנק, ובלי
          צורך בחשבון ללקוח.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-accent px-6 py-3 font-semibold text-white hover:bg-accent-hover"
          >
            התחילו בחינם
          </Link>
        </div>

        <dl className="mt-20 grid grid-cols-1 gap-8 text-start sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-ink">1. יצירת בקשה</dt>
            <dd className="mt-1 text-sm text-ink-muted">
              כותרת, היקף העבודה, סכום, וחלון זמן לשחרור אוטומטי.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">2. הלקוח משלם</dt>
            <dd className="mt-1 text-sm text-ink-muted">
              פותחים קישור ומשלמים דרך PayPal — בלי צורך בחשבון.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">3. מקבלים תשלום</dt>
            <dd className="mt-1 text-sm text-ink-muted">
              עם האישור, או אוטומטית כשהזמן נגמר.
            </dd>
          </div>
        </dl>

        <p className="mt-16 text-sm text-ink-muted">
          PayPal מטפל בכל תנועת הכסף בפועל. אנחנו לעולם לא נוגעים בכסף
          בעצמנו ולא שומרים פרטי תשלום.
        </p>

        <section className="mt-16 border-t border-line pt-12 text-start">
          <h2 className="text-xl font-bold tracking-tight text-ink">
            שאלות נפוצות
          </h2>
          <div className="mt-6 flex flex-col divide-y divide-line border-y border-line">
            <details className="py-4">
              <summary className="cursor-pointer font-medium text-ink">
                מה קורה אם הלקוח לא מגיב?
              </summary>
              <p className="mt-2 text-sm text-ink-muted">
                אם הלקוח לא מאשר את העבודה תוך תקופת הבדיקה שנקבעה (24
                שעות, 3 ימים, או 7 ימים), הכסף משוחרר אוטומטית לפרילנסר.
                אין צורך לרדוף אחרי אישור ידני.
              </p>
            </details>
            <details className="py-4">
              <summary className="cursor-pointer font-medium text-ink">
                יש הגבלת סכום לבקשה?
              </summary>
              <p className="mt-2 text-sm text-ink-muted">
                הסכום המינימלי לבקשה הוא ₪20. אין תקרה עליונה — אפשר
                ליצור בקשות בכל סכום מעל המינימום.
              </p>
            </details>
            <details className="py-4">
              <summary className="cursor-pointer font-medium text-ink">
                מה קורה אם יש בעיה בתשלום מול PayPal?
              </summary>
              <p className="mt-2 text-sm text-ink-muted">
                אם התשלום נכשל, אפשר פשוט לנסות שוב — זה קורה מול PayPal
                ולא דורש התערבות שלנו. אם הבעיה נמשכת, ניתן לפנות אלינו
                ונבדוק את המקרה לגופו.
              </p>
            </details>
            <details className="py-4">
              <summary className="cursor-pointer font-medium text-ink">
                למה לא פשוט לבקש מקדמה?
              </summary>
              <p className="mt-2 text-sm text-ink-muted">
                מקדמה מגנה רק מפני אי-תשלום, לא מפני מחלוקת על איכות
                העבודה — ברגע שהכסף עבר, אין עליו יותר שליטה. ב-Kept
                הסכום המלא מוחזק עד לאישור העבודה, כך ששני הצדדים מוגנים.
              </p>
            </details>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-faint">
        <SiteFooter />
        <p className="mt-1">תשלומים מאובטחים על ידי PayPal</p>
      </footer>
    </div>
  );
}
