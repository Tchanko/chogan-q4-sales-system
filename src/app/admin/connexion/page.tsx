import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion à l'administration",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="container-page max-w-md py-16">
      <div className="rounded-3xl bg-paper p-8">
        <h1 className="text-2xl font-extrabold">Connexion</h1>
        <p className="mt-2 text-sm text-muted">Espace réservé au suivi des prospects et des inscriptions.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
