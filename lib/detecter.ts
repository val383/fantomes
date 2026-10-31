export type Prelevement = {
  id: string;
  nom: string;
  montant: number;
  annuel: number;
  occurrences: number;
  dernier: string;
};

type Operation = { date: number; libelle: string; montant: number };

const sansAccents = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

function decouper(ligne: string, sep: string): string[] {
  const champs: string[] = [];
  let courant = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (c === sep && !entreGuillemets) {
      champs.push(courant);
      courant = "";
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs.map((c) => c.trim());
}

function lireMontant(brut: string): number | null {
  let s = brut.replace(/[\s\u00a0\u202f€]/g, "").replace(/[\u2212\u2013]/g, "-");
  if (!/\d/.test(s)) return null;
  s = s.replace(/[^0-9,.\-+]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function lireDate(brut: string): number | null {
  let m = brut.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1]);
  m = brut.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return null;
}

function mediane(valeurs: number[]): number {
  const t = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(t.length / 2);
  return t.length % 2 ? t[milieu] : (t[milieu - 1] + t[milieu]) / 2;
}

const MOTS_VIDES =
  /\b(PAIEMENT PAR CARTE|PAIEMENT CARTE|PRELEVEMENT SEPA|PRELEVEMENT|PAIEMENT|PRLV|CARTE|CB|SEPA|VIREMENT|VIR|FACTURE|FACT|ECHEANCE|ECH|REFERENCE|REF|MANDAT|DE|DU|LE|LA|LES|DES|PAR|ET)\b/g;

function cle(libelle: string): string {
  const s = sansAccents(libelle)
    .toUpperCase()
    .replace(MOTS_VIDES, " ")
    .replace(/[0-9]+/g, " ")
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return s
    .split(" ")
    .filter((m) => m.length > 1)
    .slice(0, 3)
    .join(" ");
}

export function analyserReleve(texte: string): Prelevement[] {
  const lignes = texte
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");

  const iEntete = lignes.findIndex((l) => {
    const n = sansAccents(l).toLowerCase();
    return n.includes("date") && (n.match(/[;\t,]/g) ?? []).length >= 2;
  });
  if (iEntete === -1) {
    throw new Error(
      "Je ne trouve pas la ligne d'en-têtes (Date, Libellé, Montant). Vérifie que c'est bien un export CSV de tes opérations.",
    );
  }

  const entete = lignes[iEntete];
  const sep = [";", "\t", ","]
    .map((s) => ({ s, n: entete.split(s).length }))
    .sort((a, b) => b.n - a.n)[0].s;
  const heads = decouper(entete, sep).map((h) => sansAccents(h).toLowerCase());

  let iDate = heads.findIndex((h) => h.includes("date") && !h.includes("valeur"));
  if (iDate < 0) iDate = heads.findIndex((h) => h.includes("date"));
  const iLib = heads.findIndex(
    (h) =>
      !h.includes("date") &&
      (h.includes("libell") ||
        h.includes("label") ||
        h.includes("description") ||
        h.includes("detail") ||
        h.includes("intitule") ||
        h.includes("operation")),
  );
  const iMontant = heads.findIndex(
    (h) => h.includes("montant") || h.includes("amount"),
  );
  const iDebit = heads.findIndex((h) => h.includes("debit"));

  if (iDate < 0 || iLib < 0 || (iMontant < 0 && iDebit < 0)) {
    throw new Error(
      "Je n'arrive pas à repérer les colonnes Date, Libellé et Montant (ou Débit) dans ce fichier.",
    );
  }

  const ops: Operation[] = [];
  for (const l of lignes.slice(iEntete + 1)) {
    const c = decouper(l, sep);
    const date = lireDate(c[iDate] ?? "");
    const libelle = (c[iLib] ?? "").trim();
    if (date === null || libelle === "") continue;
    let debit: number | null = null;
    if (iMontant >= 0) {
      const m = lireMontant(c[iMontant] ?? "");
      if (m !== null && m < 0) debit = -m;
    } else {
      const d = lireMontant(c[iDebit] ?? "");
      if (d !== null && d !== 0) debit = Math.abs(d);
    }
    if (debit !== null && debit > 0) ops.push({ date, libelle, montant: debit });
  }

  if (ops.length === 0) {
    throw new Error(
      "Je n'ai trouvé aucun débit dans ce fichier. Les dépenses doivent apparaître en négatif, ou dans une colonne Débit.",
    );
  }

  const groupes = new Map<string, Operation[]>();
  for (const o of ops) {
    const k = cle(o.libelle);
    if (k === "") continue;
    const g = groupes.get(k);
    if (g) g.push(o);
    else groupes.set(k, [o]);
  }

  const resultat: Prelevement[] = [];
  for (const [k, g] of groupes) {
    if (g.length < 3) continue;
    g.sort((a, b) => a.date - b.date);
    const ecarts: number[] = [];
    for (let i = 1; i < g.length; i++) {
      ecarts.push((g[i].date - g[i - 1].date) / 86400000);
    }
    const ecart = mediane(ecarts);
    if (ecart < 26 || ecart > 35) continue;

    const m = mediane(g.map((x) => x.montant));
    const proches = g.filter((x) => Math.abs(x.montant - m) <= m * 0.1);
    if (proches.length < 3 || proches.length < g.length * 0.6) continue;

    resultat.push({
      id: k,
      nom: k.charAt(0) + k.slice(1).toLowerCase(),
      montant: Math.round(m * 100) / 100,
      annuel: Math.round(m * 12 * 100) / 100,
      occurrences: g.length,
      dernier: new Date(g[g.length - 1].date).toLocaleDateString("fr-FR", {
        timeZone: "UTC",
      }),
    });
  }

  return resultat.sort((a, b) => b.annuel - a.annuel);
}
