import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="bg-ink text-paper">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo tone="light" />
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-muted-dark">
            Administration
          </span>
        </div>
      </header>
      <main id="contenu" className="flex-1 bg-mist">
        {children}
      </main>
    </>
  );
}
