import Link from "next/link";

export default function Commencer() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5">
      <h1 className="text-3xl font-bold [font-family:var(--font-titre),system-ui,sans-serif]">
        Les trois questions arrivent bientôt.
      </h1>
      <p className="mt-4 text-lg">
        Cette page est en construction. Reviens très vite !
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex w-fit rounded-lg bg-[#FFD84D] px-6 py-3 font-bold"
      >
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
