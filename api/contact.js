// ══ Vercel Function — Formulaire de contact Digibus ══
// Reçoit le message du visiteur → envoie un email à digibus.sj@gmail.com via Resend
// Variable d'environnement Vercel : RESEND_API_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { prenom, nom, email, message } = req.body || {};

  // Validation basique
  if (!prenom || !email || !message) {
    return res.status(400).json({ error: 'Champs requis manquants (prénom, email, message)' });
  }

  // Anti-spam : longueur max message
  if (message.length > 2000) {
    return res.status(400).json({ error: 'Message trop long' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Site Digibus <onboarding@resend.dev>',
        to: ['digibus.sj@gmail.com'],
        reply_to: email,
        subject: `✉️ Nouveau message de ${prenom} ${nom || ''}`.trim(),
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px;">
            <div style="background:#1f4683;padding:20px 28px;border-radius:10px 10px 0 0;">
              <h2 style="color:#fff;margin:0;font-size:20px;">📩 Nouveau message via le site Digibus</h2>
            </div>
            <div style="background:#fff;padding:28px;border-radius:0 0 10px 10px;border:1px solid #e5eaf0;">
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#5a6a80;font-size:13px;width:100px;">Prénom</td><td style="padding:8px 0;font-weight:600;color:#1a2b4a;">${prenom}</td></tr>
                <tr><td style="padding:8px 0;color:#5a6a80;font-size:13px;">Nom</td><td style="padding:8px 0;font-weight:600;color:#1a2b4a;">${nom || '—'}</td></tr>
                <tr><td style="padding:8px 0;color:#5a6a80;font-size:13px;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}" style="color:#2092c5;">${email}</a></td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #e5eaf0;margin:20px 0;"/>
              <p style="color:#5a6a80;font-size:13px;margin:0 0 10px;">Message :</p>
              <p style="background:#f0f7ff;padding:16px;border-radius:8px;color:#1a2b4a;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
              <div style="margin-top:24px;padding:16px;background:#f0f7ff;border-radius:8px;font-size:13px;color:#5a6a80;">
                💡 Pour répondre, cliquez simplement sur "Répondre" — la réponse ira directement à <strong>${email}</strong>
              </div>
            </div>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('Resend error:', errData);
      return res.status(502).json({ error: 'Erreur lors de l\'envoi de l\'email' });
    }

    return res.status(200).json({ success: true, message: 'Message envoyé avec succès' });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
}
