"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { analyserReleve, type Prelevement } from "@/lib/detecter";

const titres = "[font-family:var(--font-titre),system-ui,sans-serif]";
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const boutonJaune =
  "flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#FFD84D] px-6 py-4 text-lg font-bold text-[#14284B] focus-within:ring-4 focus-within:ring-[#14284B]/40 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40";

function exempleCsv(): string {
  const lignes = ["Date;Libellé;Montant"];
  const courses = ["-47,30", "-63,12", "-52,80", "-71,05", "-44,60"];
  ["06", "07", "08", "09", "10"].forEach((m, i) => {
    lignes.push(`05/${m}/2026;PRLV SEPA STREAMFLIX REF 4471;-9,99`);
    lignes.push(`08/${m}/2026;PRLV SEPA ZENAPP MEDITATION;-7,99`);
    lignes.push(`12/${m}/2026;PAIEMENT CB NUAGE STOCKAGE;-2,99`);
    lignes.push(`15/${m}/2026;PRLV SEPA SALLE FITNESS CENTRE;-29,90`);
    lignes.push(`20/${m}/2026;CARTE SUPERMARCHE LECLERC;${courses[i]}`);
    lignes.push(`28/${m}/2026;VIR SALAIRE;1500,00`);
  });
  return lignes.join("\n");
}

export default function AvantGout() {
  const [liste, setListe] = useState<Prelevement[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [coches, setCoches] = useState<Record<string, boolean>>({});

  function analyser(texte: string) {
    try {
      setListe(analyserReleve(texte));
      setErreur(null);
      setCoches({});
    } catch (e) {
      setListe(null);
      setErreur(
        e instanceof Error ? e.message : "Ce fichier n'a pas pu être lu.",
      );
    }
  }

  async function surFichier(e: ChangeEvent<HTMLInputElement>) {
    const champ = e.target;
    const fichier = champ.files?.[0];
    if (!fichier) return;
    const buf = await fichier.arrayBuffer();
    let texte: string;
    try {
      texte = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch {
      texte = new TextDecoder("windows-1252").decode(buf);
    }
    analyser(texte);
    champ.value = "";
  }

  if (liste === null) {
    return (
      <main className="mx-auto max-w-xl px-5 pb-12 pt-8 md:pt-16">
        <Link
          href="/commencer"
          className="-ml-2 inline-block rounded px-2 py-2 text-sm font-medium underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
        >
          Retour
        </Link>
        <h1
          className={`${titres} mt-4 text-3xl font-bold leading-tight [text-wrap:balance] md:text-4xl`}
        >
          Dépose ton relevé, on débusque tes abonnements.
        </h1>

        <ol className="mt-6 space-y-3 leading-relaxed">
          <li>
            Connecte-toi à l&apos;espace en ligne de ta banque, dans
            l&apos;historique de ton compte.
          </li>
          <li>
            Cherche « Exporter » ou « Télécharger » et choisis le format
            <strong> CSV</strong>.
          </li>
          <li>Prends au moins 3 mois, idéalement 6 à 12.</li>
        </ol>

        <p className="mt-6 rounded-md border-l-4 border-[#14284B] bg-white p-4 leading-relaxed">
          Ton fichier reste sur ton appareil. Il est lu directement dans ton
          navigateur et n&apos;est envoyé nulle part.
        </p>

        {erreur && (
          <p
            role="alert"
            className="mt-6 rounded-md border-2 border-[#14284B] bg-[#FFD84D]/40 p-4 leading-relaxed"
          >
            {erreur}
          </p>
        )}

        <div className="mt-8 space-y-3">
          <label className={boutonJaune}>
            Choisir mon fichier CSV
            <input
              type="file"
              accept=".csv,.txt,text/csv,text/plain"
              onChange={surFichier}
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={() => analyser(exempleCsv())}
            className="w-full rounded-lg border-2 border-[#14284B] bg-white px-6 py-4 text-lg font-medium focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
          >
            Essayer avec un relevé d&apos;exemple
          </button>
        </div>
      </main>
    );
  }

  const detecte = liste.reduce((s, p) => s + p.annuel, 0);
  const nbCoches = liste.filter((p) => coches[p.id]).length;
  const economise = liste.reduce((s, p) => (coches[p.id] ? s + p.annuel : s), 0);

  if (liste.length === 0) {
    return (
      <main className="mx-auto max-w-xl px-5 pb-12 pt-8 md:pt-16">
        <h1
          className={`${titres} text-3xl font-bold leading-tight [text-wrap:balance] md:text-4xl`}
        >
          Aucun prélèvement régulier trouvé.
        </h1>
        <p className="mt-4 leading-relaxed">
          Pour repérer un abonnement, il faut qu&apos;il apparaisse au moins 3
          fois, avec le même montant, à peu près tous les mois. Essaie avec un
          relevé plus long (6 à 12 mois).
        </p>
        <button
          type="button"
          onClick={() => setListe(null)}
          className={`${boutonJaune} mt-8`}
        >
          Essayer un autre fichier
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-5 pb-48 pt-8 md:pb-40 md:pt-16">
      <h1
        className={`${titres} text-3xl font-bold leading-tight [text-wrap:balance] md:text-4xl`}
      >
        {liste.length === 1
          ? "On a trouvé 1 prélèvement régulier."
          : `On a trouvé ${liste.length} prélèvements réguliers.`}
      </h1>
      <p className="mt-3 leading-relaxed">
        Ils pèsent{" "}
        <span className="bg-[#FFD84D] px-1 font-bold [box-decoration-break:clone]">
          {eur.format(detecte)} par an
        </span>
        , classés du plus coûteux au moins coûteux. Coche ceux dont tu n&apos;as
        plus besoin.
      </p>

      <ul className="mt-6 space-y-3">
        {liste.map((p) => (
          <li key={p.id}>
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-lg border-2 border-[#14284B] p-4 ${
                coches[p.id] ? "bg-[#FFD84D]" : "bg-white"
              }`}
            >
              <input
                type="checkbox"
                checked={!!coches[p.id]}
                onChange={() =>
                  setCoches({ ...coches, [p.id]: !coches[p.id] })
                }
                className="h-7 w-7 shrink-0 accent-[#14284B]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold">{p.nom}</span>
                <span className="mt-0.5 block text-sm tabular-nums text-[#14284B]/75">
                  {eur.format(p.montant)} par mois · vu {p.occurrences} fois ·
                  dernier le {p.dernier}
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xl font-bold tabular-nums">
                  {eur.format(p.annuel)}
                </span>
                <span className="block text-xs text-[#14284B]/75">par an</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setListe(null)}
        className="mt-6 rounded py-2 text-sm underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40"
      >
        Analyser un autre fichier
      </button>

      <div
        aria-live="polite"
        className="fixed inset-x-0 bottom-0 border-t-2 border-[#14284B] bg-[#F2F4F5] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      >
        <div className="mx-auto flex max-w-xl items-baseline justify-between gap-3">
          <span className="font-medium">
            {nbCoches === 0
              ? "Économisé sur l'année"
              : nbCoches === 1
                ? "Économisé sur l'année (1 abonnement)"
                : `Économisé sur l'année (${nbCoches} abonnements)`}
          </span>
          <span
            className={`${titres} text-3xl font-bold tabular-nums`}
          >
            {eur.format(economise)}
          </span>
        </div>
        <p className="mx-auto mt-1 max-w-xl text-sm text-[#14284B]/75">
          {nbCoches === 0
            ? "Coche un abonnement pour voir ce que tu gagnes en l'arrêtant."
            : "Les lettres de résiliation arrivent à la prochaine étape."}
        </p>
      </div>
    </main>
  );
}
