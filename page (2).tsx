"use client";

import Link from "next/link";
import { useState } from "react";

type Option = { label: string; valeur: number };
type Question = { court: string; titre: string; aide: string; options: Option[] };

const titres = "[font-family:var(--font-titre),system-ui,sans-serif]";

const questions: Question[] = [
  {
    court: "Abonnements",
    titre: "Combien d'abonnements as-tu, à peu près ?",
    aide: "Streaming, musique, applis, salle de sport, cloud, presse… tout ce qui se prélève tout seul.",
    options: [
      { label: "1 à 3", valeur: 2 },
      { label: "4 à 6", valeur: 5 },
      { label: "7 à 10", valeur: 8.5 },
      { label: "Plus de 10", valeur: 12 },
    ],
  },
  {
    court: "Peu ou pas utilisés",
    titre: "Combien de ces abonnements utilises-tu à peine, ou plus du tout ?",
    aide: "Un essai jamais résilié, un service remplacé par un autre, une option activée une seule fois.",
    options: [
      { label: "Un seul", valeur: 1 },
      { label: "Deux ou trois", valeur: 2.5 },
      { label: "Quatre ou plus", valeur: 4.5 },
      { label: "Je ne sais pas, justement", valeur: 2 },
    ],
  },
  {
    court: "Prix moyen",
    titre: "Combien coûte un abonnement, en moyenne, chez toi ?",
    aide: "Par mois. Un ordre de grandeur suffit.",
    options: [
      { label: "Moins de 5 €", valeur: 3 },
      { label: "Entre 5 et 10 €", valeur: 7.5 },
      { label: "Entre 10 et 15 €", valeur: 12.5 },
      { label: "Plus de 15 €", valeur: 18 },
    ],
  },
];

const bouton =
  "flex w-full items-center justify-center rounded-lg bg-[#FFD84D] px-6 py-4 text-lg font-bold text-[#14284B] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40";

export default function Commencer() {
  const [etape, setEtape] = useState(0);
  const [reponses, setReponses] = useState<Option[]>([]);

  function choisir(option: Option) {
    setReponses([...reponses.slice(0, etape), option]);
    setEtape(etape + 1);
  }

  function retour() {
    setEtape(etape - 1);
  }

  function recommencer() {
    setReponses([]);
    setEtape(0);
  }

  if (etape < questions.length) {
    const q = questions[etape];
    return (
      <main className="mx-auto flex min-h-screen max-w-xl flex-col px-5 pb-10 pt-6 md:pt-16">
        <div className="flex items-center justify-between text-sm text-[#14284B]/70">
          {etape > 0 ? (
            <button
              type="button"
              onClick={retour}
              className="-ml-2 rounded px-2 py-2 font-medium underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
            >
              Retour
            </button>
          ) : (
            <Link
              href="/"
              className="-ml-2 rounded px-2 py-2 font-medium underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
            >
              Accueil
            </Link>
          )}
          <span>
            Question {etape + 1} sur {questions.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-valuenow={etape + 1}
          className="mt-3 h-2 w-full rounded-full bg-[#14284B]/15"
        >
          <div
            className="h-2 rounded-full bg-[#14284B] transition-all"
            style={{ width: `${((etape + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h1
          className={`${titres} mt-8 text-3xl font-bold leading-tight [text-wrap:balance] md:text-4xl`}
        >
          {q.titre}
        </h1>
        <p className="mt-3 leading-relaxed text-[#14284B]/80">{q.aide}</p>

        <div className="mt-8 space-y-3">
          {q.options.map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => choisir(o)}
              className="flex w-full items-center rounded-lg border-2 border-[#14284B] bg-white px-5 py-4 text-left text-lg font-medium active:bg-[#FFD84D] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40 md:hover:bg-[#FFD84D]"
            >
              {o.label}
            </button>
          ))}
        </div>
      </main>
    );
  }

  const nb = reponses[0].valeur;
  const inutiles = Math.min(reponses[1].valeur, nb);
  const prix = reponses[2].valeur;
  const annuel = Math.max(10, Math.round((inutiles * prix * 12) / 10) * 10);

  return (
    <main className="mx-auto max-w-xl px-5 pb-32 pt-8 md:pb-16 md:pt-16">
      <p className="text-sm text-[#14284B]/70">Ton résultat</p>
      <h1
        className={`${titres} mt-2 text-3xl font-bold leading-tight [text-wrap:balance] md:text-4xl`}
      >
        D&apos;après tes réponses, tu perds environ{" "}
        <span className="bg-[#FFD84D] px-1 [box-decoration-break:clone]">
          {annuel} € par an
        </span>{" "}
        dans des abonnements que tu n&apos;utilises pas.
      </h1>

      <section
        aria-label="Tes réponses"
        className="mt-8 rounded-md border border-[#14284B]/20 bg-white p-4"
      >
        <ul className="divide-y divide-[#14284B]/10">
          {questions.map((q, i) => (
            <li
              key={q.court}
              className="flex items-baseline justify-between gap-3 py-3"
            >
              <span className="text-[#14284B]/70">{q.court}</span>
              <span className="text-right font-bold">{reponses[i].label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t-2 border-[#14284B] pt-3 text-sm text-[#14284B]/70">
          Estimation calculée à partir de tes réponses. Ton relevé donnera le
          montant exact.
        </p>
      </section>

      <section className="mt-10">
        <h2 className={`${titres} text-2xl font-bold`}>
          Ce que Fantômes change
        </h2>
        <ul className="mt-5 space-y-5">
          <li className="border-l-4 border-[#FFD84D] pl-4">
            <p className="font-bold">Tu vois chaque abonnement, avec son vrai coût</p>
            <p className="mt-1 leading-relaxed text-[#14284B]/85">
              Fini le « je crois que j&apos;en ai quelques-uns ». Tu obtiens la
              liste exacte, classée par montant annuel.
            </p>
          </li>
          <li className="border-l-4 border-[#FFD84D] pl-4">
            <p className="font-bold">Tu arrêtes en quelques minutes</p>
            <p className="mt-1 leading-relaxed text-[#14284B]/85">
              Une lettre de résiliation est prête pour chacun. Tu n&apos;as plus
              qu&apos;à l&apos;envoyer.
            </p>
          </li>
        </ul>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-[#14284B]/15 bg-[#F2F4F5] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:static md:mt-10 md:border-0 md:bg-transparent md:p-0">
        <Link href="/avant-gout" className={bouton}>
          Voir mon avant-goût gratuit
        </Link>
        <button
          type="button"
          onClick={recommencer}
          className="mt-2 w-full rounded py-2 text-sm underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
        >
          Refaire le test
        </button>
      </div>
    </main>
  );
}
