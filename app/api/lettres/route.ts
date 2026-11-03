type Entree = { id: string; nom: string; montant: number };

const ERREUR_GENERIQUE = "Les lettres n'ont pas pu être générées. Réessaie.";

function nettoyer(valeur: unknown, max: number): string {
  if (typeof valeur !== "string") return "";
  return valeur
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .trim()
    .slice(0, max);
}

function euros(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function lettre(p: Entree, nom: string, adresse: string, date: string): string {
  return [
    nom || "[Ton prénom et ton nom]",
    adresse || "[Ton adresse postale]",
    "",
    `${p.nom}`,
    "Service résiliation",
    "",
    `Fait le ${date}`,
    "",
    "Objet : résiliation de mon abonnement",
    "Identifiant ou numéro de client : [à compléter]",
    "",
    "Madame, Monsieur,",
    "",
    `Par la présente, je vous informe de ma décision de résilier l'abonnement dont je suis titulaire auprès de vos services, pour lequel je suis prélevé(e) de ${euros(p.montant)} € chaque mois.`,
    "",
    "Je vous demande de prendre en compte cette résiliation dès réception de ce courrier, de cesser tout prélèvement à compter de cette date et de me confirmer par écrit la date de fin effective de mon abonnement.",
    "",
    "Je vous remercie de m'envoyer cette confirmation à l'adresse indiquée ci-dessus.",
    "",
    "Je vous prie d'agréer, Madame, Monsieur, mes salutations distinguées.",
    "",
    nom || "[Ton prénom et ton nom]",
  ].join("\n");
}

async function sessionPayee(id: string): Promise<boolean | null> {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) return null;
  try {
    const rep = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(id)}`,
      { headers: { Authorization: `Bearer ${cle}` } },
    );
    if (rep.status === 404 || rep.status === 400) return false;
    if (!rep.ok) return null;
    const s = await rep.json();
    return s.payment_status === "paid" && s.metadata?.produit === "audit";
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let corps: unknown;
  try {
    corps = await req.json();
  } catch {
    return Response.json({ erreur: ERREUR_GENERIQUE }, { status: 400 });
  }
  const c = (corps ?? {}) as Record<string, unknown>;

  const nom = nettoyer(c.nom, 100);
  const adresse = nettoyer(c.adresse, 300);

  if (!Array.isArray(c.prelevements) || c.prelevements.length === 0 || c.prelevements.length > 50) {
    return Response.json({ erreur: ERREUR_GENERIQUE }, { status: 400 });
  }
  const entrees: Entree[] = [];
  for (const brut of c.prelevements) {
    const e = (brut ?? {}) as Record<string, unknown>;
    const id = nettoyer(e.id, 80);
    const nomService = nettoyer(e.nom, 80);
    const montant = typeof e.montant === "number" ? e.montant : NaN;
    if (!id || !nomService || !Number.isFinite(montant) || montant <= 0 || montant > 10000) {
      return Response.json({ erreur: ERREUR_GENERIQUE }, { status: 400 });
    }
    entrees.push({ id, nom: nomService, montant });
  }

  let aGenerer = entrees.slice(0, 1);
  let complet = false;

  const session = typeof c.session_id === "string" ? c.session_id : "";
  if (session) {
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(session)) {
      return Response.json({ erreur: "Paiement non confirmé." }, { status: 402 });
    }
    const payee = await sessionPayee(session);
    if (payee === null) {
      return Response.json(
        { erreur: "Impossible de vérifier ton paiement pour le moment. Réessaie dans un instant." },
        { status: 503 },
      );
    }
    if (!payee) {
      return Response.json({ erreur: "Paiement non confirmé." }, { status: 402 });
    }
    aGenerer = entrees;
    complet = true;
  }

  const date = new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
  const lettres: Record<string, string> = {};
  for (const p of aGenerer) lettres[p.id] = lettre(p, nom, adresse, date);

  return Response.json({ lettres, complet });
}
