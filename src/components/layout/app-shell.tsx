"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Users,
  Trophy,
  Target,
  UserRound,
  Gem,
  Heart,
  Flame,
  Bell,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
const navigation = [
  ["/lernen", "Lernen", BookOpen],
  ["/community", "Community", Users],
  ["/liga", "Rangliste", Trophy],
  ["/ziele", "Ziele", Target],
  ["/profil", "Profil", UserRound],
] as const;
export function AppShell({
  children,
  demo = false,
}: {
  children: React.ReactNode;
  demo?: boolean;
}) {
  const path = usePathname(),
    api = useTRPC();
  const me = useQuery({ ...api.profile.me.queryOptions(), enabled: !demo });
  const game = demo ? { streak: 7, gems: 125, hearts: 5 } : me.data?.game;
  const href = (route: string) =>
    demo ? `/demo${route === "/lernen" ? "" : route}` : route;
  return (
    <div className="app-shell mobile-shell">
      <a className="skip" href="#main">
        Zum Inhalt springen
      </a>
      <header className="mobile-topbar">
        <Link
          className="mobile-brand"
          href={href("/lernen")}
          aria-label="Dentora Startseite"
        >
          ✦<span>dentora.</span>
        </Link>
        <div className="mobile-counters">
          <Link
            href={href("/ziele")}
            className="fire"
            aria-label={`${game?.streak ?? 0} Tage Lernserie`}
          >
            <Flame size={17} />
            {game?.streak ?? 0}
          </Link>
          <Link
            href={href("/shop")}
            className="purple"
            aria-label={`${game?.gems ?? 0} Diamanten`}
          >
            <Gem size={17} />
            {game?.gems ?? 0}
          </Link>
          <Link
            href={href("/shop")}
            className="rose"
            aria-label={`${game?.hearts ?? 0} Herzen`}
          >
            <Heart size={17} />
            {game?.hearts ?? 0}
          </Link>
          <Link
            href={href("/benachrichtigungen")}
            aria-label="Benachrichtigungen"
          >
            <Bell size={18} />
          </Link>
        </div>
      </header>
      {demo && (
        <div className="demo-notice">
          Vorschau mit Beispieldaten{" "}
          <Link href="/anmelden">Jetzt starten →</Link>
        </div>
      )}
      <main id="main" className="main-content">
        {children}
      </main>
      <nav className="mobile-navigation" aria-label="Hauptnavigation">
        {navigation.map(([route, label, Icon]) => (
          <Link
            key={route}
            href={href(route)}
            aria-current={path === href(route) ? "page" : undefined}
            className={path === href(route) ? "active" : ""}
          >
            <span>
              <Icon size={21} />
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
