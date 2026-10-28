import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";
import { testModeEnabled } from "@/server/test-mode";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <main className="auth-screen mobile-auth">
      <div className="auth-card">
        <Link href="/demo" className="brand">
          ✦ dentora.
        </Link>
        <span className="eyebrow">DEIN WISSEN. DEIN TEMPO.</span>
        <h1>
          Dein nächster
          <br />
          Aha-Moment wartet.
        </h1>
        <p>
          Lerne Zahnmedizin in kleinen Schritten. Starte mit deiner
          E-Mail-Adresse.
        </p>
        <LoginForm testMode={testModeEnabled()} />
        <Link href="/demo">Erst einmal umsehen →</Link>
      </div>
    </main>
  );
}
