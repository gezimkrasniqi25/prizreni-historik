import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporterPromise;
let usingEthereal = false;

function buildFrom() {
  const user = env.smtp.user;
  const from = (env.smtp.from || '').trim();
  // Hostinger rejects relay unless From matches the authenticated mailbox.
  if (user && from && from.toLowerCase().includes(user.toLowerCase())) return from;
  if (user) return `Prizren Heritage <${user}>`;
  return from || 'Prizren Heritage <no-reply@localhost>';
}

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    if (env.smtp.host) {
      if (!env.smtp.user || !env.smtp.pass) {
        throw new Error('SMTP_USER and SMTP_PASS must be set when SMTP_HOST is set');
      }
      const port = env.smtp.port || 465;
      const secure = env.smtp.secure || port === 465;
      // eslint-disable-next-line no-console
      console.log(`[mail] SMTP ${env.smtp.host}:${port} secure=${secure} user=${env.smtp.user}`);
      const transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port,
        secure,
        auth: {
          user: env.smtp.user,
          pass: env.smtp.pass,
        },
        authMethod: 'LOGIN',
        tls: {
          minVersion: 'TLSv1.2',
          servername: env.smtp.host,
        },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
      });
      await transporter.verify();
      // eslint-disable-next-line no-console
      console.log('[mail] SMTP connection verified');
      return transporter;
    }
    if (env.isProd) throw new Error('SMTP is not configured (set SMTP_HOST in hPanel env).');
    const account = await nodemailer.createTestAccount();
    usingEthereal = true;
    // eslint-disable-next-line no-console
    console.log('[mail] SMTP_HOST is empty -> using Ethereal test inbox:', account.user);
    return nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
  })().catch((err) => {
    transporterPromise = null;
    throw err;
  });
  return transporterPromise;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const TEXTS = {
  verify: {
    sq: {
      subject: 'Verifiko llogarinë tënde - Prizren Heritage',
      title: 'Mirë se vini në Prizren Heritage',
      body: (name, hours) => `Përshëndetje ${name}, faleminderit që u regjistruat. Klikoni butonin më poshtë për të aktivizuar llogarinë. Linku skadon pas ${hours} orësh.`,
      button: 'Verifiko llogarinë',
      ignore: 'Nëse nuk jeni regjistruar ju, thjesht injoroni këtë email.',
    },
    en: {
      subject: 'Verify your account - Prizren Heritage',
      title: 'Welcome to Prizren Heritage',
      body: (name, hours) => `Hello ${name}, thank you for signing up. Click the button below to activate your account. The link expires in ${hours} hours.`,
      button: 'Verify account',
      ignore: 'If you did not sign up, you can safely ignore this e-mail.',
    },
    de: {
      subject: 'Bestätige dein Konto - Prizren Heritage',
      title: 'Willkommen bei Prizren Heritage',
      body: (name, hours) => `Hallo ${name}, danke für deine Registrierung. Klicke auf die Schaltfläche unten, um dein Konto zu aktivieren. Der Link läuft in ${hours} Stunden ab.`,
      button: 'Konto bestätigen',
      ignore: 'Falls du dich nicht registriert hast, ignoriere diese E-Mail einfach.',
    },
  },
  reset: {
    sq: {
      subject: 'Rikthe fjalëkalimin - Prizren Heritage',
      title: 'Rikthimi i fjalëkalimit',
      body: (name, mins) => `Përshëndetje ${name}, morëm një kërkesë për të rikthyer fjalëkalimin. Linku skadon pas ${mins} minutash.`,
      button: 'Vendos fjalëkalim të ri',
      ignore: 'Nëse nuk e keni kërkuar ju, injoroni këtë email - fjalëkalimi nuk do të ndryshojë.',
    },
    en: {
      subject: 'Reset your password - Prizren Heritage',
      title: 'Password reset',
      body: (name, mins) => `Hello ${name}, we received a request to reset your password. The link expires in ${mins} minutes.`,
      button: 'Set a new password',
      ignore: 'If you did not request this, ignore this e-mail - your password will not change.',
    },
    de: {
      subject: 'Passwort zurücksetzen - Prizren Heritage',
      title: 'Passwort zurücksetzen',
      body: (name, mins) => `Hallo ${name}, wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Der Link läuft in ${mins} Minuten ab.`,
      button: 'Neues Passwort festlegen',
      ignore: 'Falls du das nicht angefordert hast, ignoriere diese E-Mail - dein Passwort bleibt unverändert.',
    },
  },
};

const layout = ({ title, bodyText, button, url, ignore }) => `<!doctype html>
<html><body style="margin:0;background:#f4eee2;font-family:Georgia,'Times New Roman',serif;color:#2b2118">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center">
    <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fffdf8;border:1px solid #e6d9bd;border-radius:14px;overflow:hidden">
      <tr><td style="background:#1f1a14;padding:22px 32px;color:#d4af37;font-size:20px;letter-spacing:2px">PRIZREN HERITAGE</td></tr>
      <tr><td style="padding:32px">
        <h1 style="margin:0 0 16px;font-size:24px;color:#1f1a14">${esc(title)}</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6">${esc(bodyText)}</p>
        <p style="margin:0 0 28px"><a href="${esc(url)}" style="display:inline-block;background:#b8902a;color:#fff;text-decoration:none;padding:13px 28px;border-radius:999px;font-family:Arial,sans-serif;font-size:15px">${esc(button)}</a></p>
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;color:#7a6a55;word-break:break-all">${esc(url)}</p>
        <p style="margin:16px 0 0;font-family:Arial,sans-serif;font-size:12px;color:#7a6a55">${esc(ignore)}</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

async function send({ to, subject, html, text }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: buildFrom(), to, subject, html, text });
  if (usingEthereal) {
    // eslint-disable-next-line no-console
    console.log(`[mail] Preview (${subject}):`, nodemailer.getTestMessageUrl(info));
  } else {
    // eslint-disable-next-line no-console
    console.log(`[mail] sent "${subject}" to ${to} id=${info.messageId}`);
  }
  return info;
}

export async function sendVerificationEmail({ to, firstName, token, lang = 'sq' }) {
  const t = TEXTS.verify[lang] || TEXTS.verify.sq;
  const url = `${env.clientUrl}/verify-email?token=${token}`;
  const bodyText = t.body(firstName, env.verifyTokenTtlHours);
  return send({
    to,
    subject: t.subject,
    html: layout({ title: t.title, bodyText, button: t.button, url, ignore: t.ignore }),
    text: `${bodyText}\n\n${url}\n\n${t.ignore}`,
  });
}

export async function sendPasswordResetEmail({ to, firstName, token, lang = 'sq' }) {
  const t = TEXTS.reset[lang] || TEXTS.reset.sq;
  const url = `${env.clientUrl}/reset-password?token=${token}`;
  const bodyText = t.body(firstName, env.resetTokenTtlMinutes);
  return send({
    to,
    subject: t.subject,
    html: layout({ title: t.title, bodyText, button: t.button, url, ignore: t.ignore }),
    text: `${bodyText}\n\n${url}\n\n${t.ignore}`,
  });
}
