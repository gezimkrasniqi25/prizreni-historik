# Prizren Heritage

Platformë moderne Full Stack për historinë, kulturën dhe monumentet e Prizrenit (Kosovë).

Frontend: **React + Vite + Tailwind CSS + Framer Motion + React Three Fiber + Leaflet**  
Backend: **Node.js + Express + JWT + Bcrypt + Nodemailer**  
Databaza: **MySQL**

## Çfarë përmban

- Homepage me hero panoramik, monumente të veçuara, histori / timeline, seksion 3D, hartë dhe ngjarje
- 11 faqe monumentesh me foto autentike nga Wikimedia Commons, tekste në **shqip / anglisht / gjermanisht**, hartë dhe vizualizim 3D
- Modelet 3D: nëse nuk është ngarkuar skanim autentik, shfaqet **interpretim skematik i etiketuar qartë** (jo pretendim autentik)
- Regjistrim, verifikim email, login (JWT në cookie HttpOnly), CSRF, reset password
- Dashboard përdoruesi (profil, preferuarat, lista e vizitave, komente/vlerësime, historik)
- Admin / editor dashboard (CRUD monumentesh, foto, modele 3D, moderim, përmbajtje, statistikë)

## Kërkesat

- Node.js 18+ (testuar me 22)
- MySQL 8+ ose 9 (p.sh. WAMP). Në këtë projekt WAMP dëgjon zakonisht në portin **3308**
- MySQL Workbench (opsionale, për menaxhim vizual)

## Instalimi

```bash
# 1) Varësitë
npm run install:all

# 2) Konfigurimi
copy server\.env.example server\.env
# Ndrysho DB_*, JWT_SECRET, SMTP_* dhe ADMIN_* sipas nevojës

# 3) Databaza + të dhënat fillestare
npm run db:setup

# (Opsionale) Ri-shkarko fotot nga Commons nëse mungojnë
npm run images:fetch --prefix server
```

### SMTP / email

- Nëse `SMTP_HOST` është bosh (zhvillim), API krijon automatikisht një inbox Ethereal dhe printon në konsolë linkun e preview për çdo email.
- Për email real (Gmail, etj.) plotëso `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.

### Admin i parë

Krijohet nga seed me vlerat në `.env`:

- Email: `ADMIN_EMAIL` (default `admin@prizren.local`)
- Password: `ADMIN_PASSWORD` (default `ChangeMe!2026`)

**Ndryshoje password-in pas login-it të parë.**

## Ekzekutimi

```bash
# API (port 5000) + Vite (port 5173) njëkohësisht
npm run dev
```

Apo veçmas:

```bash
npm run dev --prefix server
npm run dev --prefix client
```

Hape: [http://localhost:5173](http://localhost:5173)

## Struktura

```
Projekti-Final/
├── client/                 # React (Vite)
│   └── src/
│       ├── components/     # Layout, Map, 3D, cards, UI
│       ├── context/        # Auth + Language (sq/en/de)
│       ├── pages/          # Home, Monuments, Auth, Dashboard, Admin
│       └── i18n/
├── server/
│   ├── database/
│   │   ├── schema.sql      # MySQL schema + FK + indekse
│   │   └── seed/           # Tekste, content, images.json
│   ├── scripts/            # initDb, seed, fetchCommonsImages
│   ├── uploads/            # Foto + modele 3D
│   └── src/                # Express API
└── README.md
```

## API (përmbledhje)

| Metodë | Rruga | Përshkrim |
|--------|-------|-----------|
| POST | `/api/auth/register` | Regjistrim + email verifikimi |
| POST | `/api/auth/verify-email` | Aktivizim llogarie |
| POST | `/api/auth/login` | Sesion JWT (cookie) |
| GET | `/api/monuments?lang=sq` | Lista e monumenteve |
| GET | `/api/monuments/:slug` | Detaje + foto + modele |
| GET/POST | `/api/monuments/:slug/reviews` | Vlerësime |
| GET/POST | `/api/monuments/:slug/comments` | Komente |
| GET | `/api/content?lang=sq` | Homepage content |
| * | `/api/me/*` | Dashboard personal |
| * | `/api/admin/*` | Admin / editor |

## Siguria

- Password hashing me **bcrypt**
- JWT në cookie **HttpOnly** + **SameSite=lax**
- Mbrojtje **CSRF** (double-submit cookie)
- Query të parametrizuara (mbrojtje nga SQL injection)
- Sanitizim i tekstit (XSS)
- Rate limiting për login / regjistrim / email
- Role-based access (`user`, `editor`, `admin`)
- Token-e verifikimi/reset të hashed me SHA-256 dhe me afat skadimi

## Autenticiteti i përmbajtjes

- Fotografitë janë nga **Wikimedia Commons** me licenca të hapura; autori dhe licenca shfaqen në UI.
- Tekstet historike bazohen në Wikipedia / databazën e trashëgimisë së Kosovës / planet rajonale; burimet listohen në çdo faqe monumenti.
- Modelet 3D pa skanim autentik janë **interpretime skematike** dhe shënohen qartë si të tilla. Admin mund të ngarkojë GLB/GLTF autentik (scan / documented reconstruction) me burim dhe licencë.

## Production

```bash
npm run build
# Vendos NODE_ENV=production, COOKIE_SECURE=true (HTTPS), SMTP real, JWT_SECRET të fortë
npm start
```

Express shërben edhe `client/dist` kur ekziston.

## Licenca e përmbajtjes së seed-it

Tekstet e seed-it janë përmbledhje të bazuara në burime publike (shih listën e burimeve në çdo monument). Fotot mbeten nën licencat e tyre përkatëse të Commons.
