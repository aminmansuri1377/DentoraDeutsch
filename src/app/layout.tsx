import type { Metadata } from "next";
import { Providers } from "@/trpc/provider";
import { FirstVisitOpening } from "@/components/layout/first-visit-opening";
import "./globals.css";
import "./mobile.css";
import "./panel.css";
export const metadata: Metadata = {
  title: "Zahn Uni · Jeden Tag ein Stück besser",
  description: "Dein Lernraum für Zahnmedizin.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>
        <Providers><FirstVisitOpening />{children}</Providers>
      </body>
    </html>
  );
}
