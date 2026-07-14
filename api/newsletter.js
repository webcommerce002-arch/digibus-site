// ══ Vercel Function — Newsletter Digibus ══
// Reçoit un email → notifie Judith/Stéphanie + envoie confirmation au visiteur via Resend
// Variable d'environnement Vercel : RESEND_API_KEY

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { email } = req.body || {};

  // Validation email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  try {
    // 1 — Notification interne à Digibus
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Newsletter Digibus <digibus@e-comconnect.com>',
        to: ['digibus.sj@gmail.com'],
        subject: `🔔 Nouvelle inscription newsletter : ${email}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;padding:28px;background:#f0f7ff;border-radius:12px;">
            <h2 style="color:#1f4683;margin:0 0 16px;">🎉 Nouvelle inscription newsletter</h2>
            <p style="color:#374151;">Un visiteur vient de s'inscrire à la newsletter Digibus :</p>
            <p style="background:#fff;padding:14px 20px;border-radius:8px;font-weight:700;color:#1f4683;font-size:18px;">${email}</p>
            <p style="color:#5a6a80;font-size:13px;">Ajoutez cet email à votre liste de diffusion pour les prochaines actualités.</p>
          </div>
        `
      })
    });

    // 2 — Email de confirmation au visiteur
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Association Digibus <digibus@e-comconnect.com>',
        to: [email],
        subject: '✅ Vous êtes inscrit·e à la newsletter Digibus !',
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
            <div style="background:#1f4683;padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:24px;">Association Digibus</h1>
              <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Premier Relais Numérique du Pas-de-Calais</p>
            </div>
            <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e5eaf0;">
              <h2 style="color:#1f4683;margin:0 0 16px;">Merci pour votre inscription ! 🎉</h2>
              <p style="color:#374151;line-height:1.7;">Vous recevrez désormais nos actualités :</p>
              <ul style="color:#374151;line-height:2;">
                <li>📅 Les prochains ateliers et nouvelles communes visitées</li>
                <li>💻 Conseils numériques pratiques</li>
                <li>🤝 Actualités de l'association</li>
              </ul>
              <p style="color:#5a6a80;font-size:13px;margin-top:24px;">
                Pour vous désinscrire à tout moment, répondez simplement à cet email en indiquant "Désinscription".<br/>
                <strong>Aucun spam, promis.</strong>
              </p>
              <hr style="border:none;border-top:1px solid #e5eaf0;margin:24px 0;"/>
              <p style="color:#5a6a80;font-size:12px;">Association Digibus · 59 Bd de Paris, 62190 Lillers · digibus.sj@gmail.com</p>
            </div>
          </div>
        `
      })
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Newsletter error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
