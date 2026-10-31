import Link from "next/link";

const lignes = [
  { nom: "Essai streaming jamais résilié", mois: "9,99", an: "119,88" },
  { nom: "Appli de méditation", mois: "7,99", an: "95,88" },
  { nom: "Stockage en ligne oublié", mois: "2,99", an: "35,88" },
];

const benefices = [
  {
    titre: "Tout est repéré pour toi",
    texte:
      "Tu déposes ton relevé. On retrouve chaque prélèvement qui revient, mois après mois.",
  },
  {
    titre: "Classé par ce que ça coûte par an",
    texte:
      "Un abonnement à 3 € par mois paraît dérisoire. À l'année, tu vois ce qu'il pèse vraiment.",
  },
  {
    titre: "La lettre pour arrêter, déjà écrite",
    texte:
      "Pour chaque abonnement, une lettre de résiliation prête à envoyer. Tu n'as rien à rédiger.",
  },
];

const titres = "[font-family:var(--font-titre),system-ui,sans-serif]";

export default function Accueil() {
  return (
    <main className="mx-auto max-w-xl px-5 pb-32 pt-10 md:max-w-3xl md:pb-24 md:pt-20">
      <h1
        className={`${titres} text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl`}
      >
        Des petits prélèvements. Des centaines d&apos;euros par an.
      </h1>
      <p className="mt-5 max-w-prose text-lg leading-relaxed md:text-xl">
        Dépose ton relevé : on repère les abonnements que tu paies sans
        t&apos;en servir, et on te prépare la lettre pour les arrêter.
      </p>

      <div className="mt-6 hidden md:block">
        <Link
          href="/commencer"
          className="inline-flex items-center rounded-lg bg-[#FFD84D] px-8 py-4 text-lg font-bold text-[#14284B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
        >
          Commencer, c&apos;est gratuit
        </Link>
        <p className="mt-3 text-sm text-[#14284B]/70">
          Trois questions, puis ton résultat.
        </p>
      </div>

      <section
        aria-label="Exemple de relevé"
        className="mt-10 rounded-md border border-[#14284B]/20 bg-white p-4 md:p-6"
      >
        <div className="flex items-baseline justify-between text-sm text-[#14284B]/70">
          <span>Exemple de relevé</span>
          <span>Par an</span>
        </div>
        <ul className="mt-3 divide-y divide-[#14284B]/10">
          {lignes.map((l) => (
            <li
              key={l.nom}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <span className="bg-[#FFD84D] px-1 font-medium [box-decoration-break:clone]">
                  {l.nom}
                </span>
                <div className="mt-1 text-sm tabular-nums text-[#14284B]/70">
                  {l.mois} € par mois
                </div>
              </div>
              <div className="shrink-0 text-lg font-bold tabular-nums">
                {l.an} €
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-1 flex items-baseline justify-between border-t-2 border-[#14284B] pt-3">
          <span className="font-medium">Perdu sur l&apos;année</span>
          <span
            className={`${titres} text-2xl font-bold tabular-nums md:text-3xl`}
          >
            251,64 €
          </span>
        </div>
      </section>

      <section className="mt-14">
        <h2 className={`${titres} text-2xl font-bold md:text-3xl`}>
          Ce que tu obtiens
        </h2>
        <dl className="mt-6 space-y-7">
          {benefices.map((b) => (
            <div key={b.titre} className="border-l-4 border-[#FFD84D] pl-4">
              <dt className="text-lg font-bold">{b.titre}</dt>
              <dd className="mt-1 leading-relaxed text-[#14284B]/85">
                {b.texte}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#14284B]/15 bg-[#F2F4F5] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:hidden">
        <Link
          href="/commencer"
          className="flex w-full items-center justify-center rounded-lg bg-[#FFD84D] px-6 py-4 text-lg font-bold text-[#14284B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
        >
          Commencer, c&apos;est gratuit
        </Link>
        <p className="mt-2 text-center text-xs text-[#14284B]/70">
          Trois questions, puis ton résultat.
        </p>
      </div>
    </main>
  );
}
