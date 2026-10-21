# AAON Ogun State — Artisan Directory & Association Platform (Frontend)

Branding, colours (#0B3F24 / #127A34 / #145C34 / #F3F8F5 / #D7F3E3), logo and photos come from the AAON landing page. Tailwind palette: `forest`, `mint`, `fresh` in `tailwind.config.js`.

Front-end prototype built to the FRD (v1.0). All data is in-memory mock data (resets on refresh) until the backend exists.

    npm install
    npm run dev

## Demo accounts (any password)
| Role | Login |
|---|---|
| Super administrator | super@aan-ogun.org |
| Administrator | admin@aan-ogun.org |
| Association head | head.abeokuta@aan-ogun.org |
| Artisan (paid up) | adebayo.fashina@mail.com |
| Artisan (overdue, hidden from search) | esther.adewale@mail.com |

## Where the backend must take over
- Role + association-level checks (AC-006) — the UI only mirrors them.
- Payment verification via the gateway, idempotent webhooks (AC-009/010).
- Scheduled billing job: reminders, grace period, hiding/restoring listings.
- Real emails, private document storage, audit log persistence, password hashing/reset tokens.
