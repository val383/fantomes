export async function POST(req: Request) {
  const cle = process.env.STRIPE_SECRET_KEY;
  if (!cle) {
    return Response.json(
      { erreur: "Le paiement n'est pas disponible pour le moment. (Détail technique : clé absente)" },
      { status: 500 },
    );
  }

  const origine = new URL(req.url).origin;
  const corps = new URLSearchParams({
    mode: "payment",
    locale: "fr",
    "payment_method_types[0]": "card",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "eur",
    "line_items[0][price_data][unit_amount]": "1900",
    "line_items[0][price_data][product_data][name]": "Fantômes : audit complet",
    "metadata[produit]": "audit",
    success_url: `${origine}/avant-gout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origine}/avant-gout?paiement=annule`,
  });

  try {
    const reponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cle.trim()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: corps,
    });
    const donnees = await reponse.json();
    if (!reponse.ok || !donnees.url) {
      const detail = donnees?.error?.message ?? "raison inconnue";
      console.error("Stripe checkout :", detail);
      return Response.json(
        { erreur: `Le paiement n'a pas pu démarrer. (Détail technique : ${detail})` },
        { status: 502 },
      );
    }
    return Response.json({ url: donnees.url });
  } catch {
    return Response.json(
      { erreur: "Le paiement n'a pas pu démarrer. (Détail technique : connexion à Stripe impossible)" },
      { status: 502 },
    );
  }
}
