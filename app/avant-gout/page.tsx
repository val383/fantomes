"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
import { analyserReleve, type Prelevement } from "@/lib/detecter";

const EMAIL = "fantomes.contact.fr@gmail.com";
const CLE_STOCK = "fantomes-audit";
const CLE_SESSION = "fantomes-session";

const titres = "[font-family:var(--font-titre),system-ui,sans-serif]";
const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const focus =
  "focus:outline-none focus-visible:ring-4 focus-visible:ring-[#14284B]/40";
const boutonJaune = `flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#FFD84D] px-6 py-4 text-lg font-bold text-[#14284B] focus-within:ring-4 focus-within:ring-[#14284B]/40 ${focus}`;
const champ = `mt-1 w-full rounded-lg border-2 border-[#14284B] bg-white px-4 py-3 text-base ${focus}`;

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

function BoutonCopier({ texte }: { texte: string }) {
  const [copie, setCopie] = useState(false);
  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setCopie(true);
      setTimeout(() => setCopie(false), 2000);
    } catch {
      setCopie(false);
    }
  }
  return (
    <button
      type="button"
      onClick={copier}
      className={`mt-3 rounded-lg border-2 border-[#14284B] bg-white px-4 py-2 font-medium ${focus}`}
    >
      {copie ? "Lettre copiée" : "Copier la lettre"}
    </button>
  );
}

export default function AvantGout() {
  const [pret, setPret] = useState(false);
  const [liste, setListe] = useState<Prelevement[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [session, setSession] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [lettres, setLettres] = useState<Record<string, string> | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreurLettres, setErreurLettres] = useState<string | null>(null);
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  const [erreurPaiement, setErreurPaiement] = useState<string | null>(null);

  useEffect(() => {
    try {
      const brut = localStorage.getItem(CLE_STOCK);
      if (brut) {
        const d = JSON.parse(brut);
        if (Array.isArray(d.liste)) setListe(d.liste);
      }
    } catch {}
    const params = new URLSearchParams(window.location.search);
    const deUrl = params.get("session_id");
    try {
      if (deUrl) {
        localStorage.setItem(CLE_SESSION, deUrl);
        setSession(deUrl);
      } else {
        const stocke = localStorage.getItem(CLE_SESSION);
        if (stocke) setSession(stocke);
      }
    } catch {
      if (deUrl) setSession(deUrl);
    }
    if (params.get("paiement") === "annule") {
      setErreurPaiement(
        "Le paiement a été annulé. Rien n'a été débité, tu peux réessayer quand tu veux.",
      );
    }
    setPret(true);
  }, []);

  function analyser(texte: string) {
    try {
      const r = analyserReleve(texte);
      setListe(r);
      setErreur(null);
      setCoches({});
      setLettres(null);
      try {
        localStorage.setItem(CLE_STOCK, JSON.stringify({ liste: r }));
      } catch {}
    } catch (e) {
      setListe(null);
      setErreur(
        e instanceof Error ? e.message : "Ce fichier n'a pas pu être lu.",
      );
    }
  }

  async function surFichier(e: ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const fichier = input.files?.[0];
    if (!fichier) return;
    const buf = await fichier.arrayBuffer();
    let texte: string;
    try {
      texte = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    } catch {
      texte = new TextDecoder("windows-1252").decode(buf);
    }
    analyser(texte);
    input.value = "";
  }

  async function genererLettres() {
    if (!liste || liste.length === 0) return;
    setEnCours(true);
    setErreurLettres(null);
    try {
      const rep = await fetch("/api/lettres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session ?? undefined,
          nom,
          adresse,
          prelevements: liste.map((p) => ({
            id: p.id,
            nom: p.nom,
            montant: p.montant,
          })),
        }),
      });
      const d = await rep.json();
      if (!rep.ok) {
        if (rep.status === 402) {
          try {
            localStorage.removeItem(CLE_SESSION);
          } catch {}
          setSession(null);
        }
        setErreurLettres(
          d.erreur ?? "Les lettres n'ont pas pu être générées. Réessaie.",
        );
      } else {
        setLettres(d.lettres);
      }
    } catch {
      setErreurLettres("Connexion impossible. Réessaie dans un instant.");
    }
    setEnCours(false);
  }

  async function payer() {
    setPaiementEnCours(true);
    setErreurPaiement(null);
    try {
      const rep = await fetch("/api/checkout", { method: "POST" });
      const d = await rep.json();
      if (rep.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      setErreurPaiement(
        d.erreur ?? "Le paiement n'a pas pu démarrer. Réessaie dans un instant.",
      );
    } catch {
      setErreurPaiement(
        "Connexion impossible. Rien n'a été débité, réessaie dans un instant.",
      );
    }
    setPaiementEnCours(false);
  }

  if (!pret) return <main className="min-h-screen" />;

  const paye = session !== null;

  if (liste === null) {
    return (
      <main className="mx-auto max-w-xl px-5 pb-12 pt-8 md:pt-16">
        <Link
          href="/commencer"
          className={`-ml-2 inline-block rounded px-2 py-2 text-sm font-medium underline ${focus}`}
        >
          Retour
        </Link>
        <h1
          className={`${titres} mt-4 text-3xl font-bold leading-tight [text-wrap:balance] md:text-4xl`}
        >
          Dépose ton relevé, on débusque tes abonnements.
        </h1>

        {paye && (
          <p className="mt-4 rounded-md border-2 border-[#14284B] bg-[#FFD84D]/40 p-4 leading-relaxed">
            Ton paiement est bien enregistré. Redépose ton relevé pour obtenir
            toutes tes lettres.
          </p>
        )}

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
            className={`w-full rounded-lg border-2 border-[#14284B] bg-white px-6 py-4 text-lg font-medium ${focus}`}
          >
            Essayer avec un relevé d&apos;exemple
          </button>
        </div>
      </main>
    );
  }

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

  const detecte = liste.reduce((s, p) => s + p.annuel, 0);
  const nbCoches = liste.filter((p) => coches[p.id]).length;
  const economise = liste.reduce((s, p) => (coches[p.id] ? s + p.annuel : s), 0);
  const fois = Math.round(detecte / 19);
  const lettresAffichees = liste.filter((p) => lettres && lettres[p.id]);

  return (
    <main className="mx-auto max-w-xl px-5 pb-56 pt-8 md:pb-48 md:pt-16">
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
        , classés du plus coûteux au moins coûteux.
        {paye
          ? " Coche ceux dont tu n'as plus besoin."
          : " Le plus coûteux est débloqué gratuitement."}
      </p>

      <ul className="mt-6 space-y-3">
        {liste.map((p, i) => {
          const debloque = paye || i === 0;
          return (
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
                  {debloque ? (
                    <span className="block text-lg font-bold">{p.nom}</span>
                  ) : (
                    <span
                      aria-label="Nom visible après l'achat"
                      className="block select-none text-lg font-bold blur-sm"
                    >
                      Nom de l&apos;abonnement
                    </span>
                  )}
                  <span className="mt-0.5 block text-sm tabular-nums text-[#14284B]/75">
                    {eur.format(p.montant)} par mois · vu {p.occurrences} fois
                    {debloque ? ` · dernier le ${p.dernier}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xl font-bold tabular-nums">
                    {eur.format(p.annuel)}
                  </span>
                  <span className="block text-xs text-[#14284B]/75">
                    par an
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => setListe(null)}
        className={`mt-6 rounded py-2 text-sm underline ${focus}`}
      >
        Analyser un autre fichier
      </button>

      <section className="mt-10">
        <h2 className={`${titres} text-2xl font-bold`}>
          {paye ? "Tes lettres de résiliation" : "Ta première lettre, gratuite"}
        </h2>
        <p className="mt-2 leading-relaxed text-[#14284B]/85">
          Renseigne ton nom et ton adresse : ils s&apos;écrivent dans la
          lettre. Ils ne sont pas conservés.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block font-medium">
            Prénom et nom
            <input
              type="text"
              value={nom}
              maxLength={100}
              autoComplete="name"
              onChange={(e) => setNom(e.target.value)}
              className={champ}
            />
          </label>
          <label className="block font-medium">
            Adresse postale
            <textarea
              value={adresse}
              maxLength={300}
              rows={3}
              autoComplete="street-address"
              onChange={(e) => setAdresse(e.target.value)}
              className={champ}
            />
          </label>
        </div>
        {erreurLettres && (
          <p
            role="alert"
            className="mt-4 rounded-md border-2 border-[#14284B] bg-[#FFD84D]/40 p-4"
          >
            {erreurLettres}
          </p>
        )}
        <button
          type="button"
          onClick={genererLettres}
          disabled={enCours}
          className={`${boutonJaune} mt-5 disabled:opacity-60`}
        >
          {enCours
            ? "Génération en cours…"
            : paye
              ? liste.length === 1
                ? "Générer ma lettre"
                : `Générer mes ${liste.length} lettres`
              : "Générer ma première lettre"}
        </button>

        {lettresAffichees.map((p) => (
          <article
            key={p.id}
            className="mt-5 rounded-md border border-[#14284B]/20 bg-white p-4"
          >
            <h3 className="font-bold">{p.nom}</h3>
            <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed [font-family:inherit]">
              {lettres ? lettres[p.id] : ""}
            </pre>
            <BoutonCopier texte={lettres ? lettres[p.id] : ""} />
          </article>
        ))}
        {lettresAffichees.length > 0 && (
          <p className="mt-4 text-sm leading-relaxed text-[#14284B]/75">
            Ces lettres sont des modèles. Complète ton numéro de client et
            vérifie le préavis de ton contrat. Si possible, envoie-les en
            recommandé avec accusé de réception.
          </p>
        )}
      </section>

      {!paye && (
        <section
          id="paiement"
          className="mt-14 scroll-mt-6 rounded-lg border-2 border-[#14284B] bg-white p-5"
        >
          <h2
            className={`${titres} text-2xl font-bold leading-tight [text-wrap:balance]`}
          >
            Voilà ton audit, prêt.
          </h2>
          <p className="mt-2 leading-relaxed">
            {liste.length === 1
              ? "Ton prélèvement régulier est repéré."
              : `Tes ${liste.length} prélèvements réguliers sont repérés.`}{" "}
            Il ne reste qu&apos;à débloquer le détail et les lettres pour les
            arrêter.
          </p>

          <p className="mt-5 leading-relaxed">
            Ils te coûtent{" "}
            <strong className="bg-[#FFD84D] px-1 [box-decoration-break:clone]">
              {eur.format(detecte)} par an
            </strong>
            . L&apos;audit complet coûte 19 €, une seule fois
            {fois >= 2 ? `, soit environ ${fois} fois moins que ce que tu perds chaque année` : ""}
            .
          </p>

          <div className="mt-5 rounded-lg border-2 border-[#14284B] bg-[#FFD84D] p-4">
            <p className="font-bold">Audit complet</p>
            <p className={`${titres} mt-1 text-4xl font-bold tabular-nums`}>
              19 €
            </p>
            <p className="mt-1 text-sm">
              Paiement unique, soit environ 5 centimes par jour la première
              année.
            </p>
            <ul className="mt-3 space-y-1 text-sm leading-relaxed">
              <li>Le nom de tous tes abonnements repérés</li>
              <li>Une lettre de résiliation pour chacun</li>
              <li>Le total économisé, mis à jour quand tu coches</li>
            </ul>
          </div>

          <p className="mt-5 rounded-md border-l-4 border-[#14284B] bg-[#F2F4F5] p-4 leading-relaxed">
            <strong>Satisfait ou remboursé pendant 30 jours.</strong> Si
            l&apos;audit ne te convainc pas, écris à{" "}
            <a href={`mailto:${EMAIL}`} className="underline">
              {EMAIL}
            </a>{" "}
            dans les 30 jours après ton achat. Tu es remboursé intégralement,
            sous 7 jours, sans avoir à te justifier.
          </p>

          {erreurPaiement && (
            <p
              role="alert"
              className="mt-5 rounded-md border-2 border-[#14284B] bg-[#FFD84D]/40 p-4 leading-relaxed"
            >
              {erreurPaiement}
            </p>
          )}

          <button
            type="button"
            onClick={payer}
            disabled={paiementEnCours}
            className={`${boutonJaune} mt-5 disabled:opacity-60`}
          >
            {paiementEnCours ? "Ouverture du paiement…" : "Payer 19 €"}
          </button>
          <p className="mt-2 text-center text-sm text-[#14284B]/80">
            Sans engagement : aucun abonnement, rien ne se renouvelle. Paiement
            sécurisé par Stripe.
          </p>

          <div className="mt-8 divide-y divide-[#14284B]/15 border-y border-[#14284B]/15">
            <details className="py-3">
              <summary className="cursor-pointer font-bold">
                Est-ce que ça marche avec ma banque ?
              </summary>
              <p className="mt-2 leading-relaxed">
                Si ta banque te permet d&apos;exporter tes opérations en CSV,
                oui. Si le fichier ne peut pas être lu, tu le vois tout de
                suite, avant de payer. Et si tu as payé et que ça ne
                fonctionne pas, tu es remboursé.
              </p>
            </details>
            <details className="py-3">
              <summary className="cursor-pointer font-bold">
                Combien de temps ça me prend ?
              </summary>
              <p className="mt-2 leading-relaxed">
                Quelques minutes : tu complètes ton nom, tu copies chaque
                lettre et tu l&apos;envoies. La fin effective de
                l&apos;abonnement dépend ensuite du préavis de chaque service.
              </p>
            </details>
            <details className="py-3">
              <summary className="cursor-pointer font-bold">
                Et si je veux arrêter ?
              </summary>
              <p className="mt-2 leading-relaxed">
                Il n&apos;y a rien à arrêter : c&apos;est un paiement unique,
                sans abonnement. Et pendant 30 jours, tu peux demander à être
                remboursé.
              </p>
            </details>
            <details className="py-3">
              <summary className="cursor-pointer font-bold">
                À quoi sert exactement ce que je paie ?
              </summary>
              <p className="mt-2 leading-relaxed">
                À débloquer le nom de tous tes abonnements repérés, une lettre
                de résiliation prête pour chacun, et le calcul de ce que tu
                économises. Le premier abonnement et sa lettre sont gratuits
                pour que tu juges par toi-même.
              </p>
            </details>
          </div>
        </section>
      )}

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
          <span className={`${titres} text-3xl font-bold tabular-nums`}>
            {eur.format(economise)}
          </span>
        </div>
        {paye ? (
          <p className="mx-auto mt-1 max-w-xl text-sm text-[#14284B]/75">
            {nbCoches === 0
              ? "Coche un abonnement pour voir ce que tu gagnes en l'arrêtant."
              : "Voilà ce que tu gardes chaque année en les arrêtant."}
          </p>
        ) : (
          <a
            href="#paiement"
            className={`mt-2 flex w-full max-w-xl items-center justify-center rounded-lg bg-[#FFD84D] px-6 py-3 font-bold ${focus} mx-auto`}
          >
            Débloquer pour 19 €
          </a>
        )}
      </div>
    </main>
  );
}
