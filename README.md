# Familie Budget Planner 🏦

Ein moderner, mobil-optimierter Familien-Budget-Planer mit intelligenter Verteilungslogik, passwortgeschütztem Zugang und eleganter Benutzeroberfläche.

![Login](https://github.com/user-attachments/assets/9b209e59-f946-4536-aabd-58b1b515dda8)
![Dashboard](https://github.com/user-attachments/assets/6722043f-718c-4129-8ee0-6901c3e853bb)
![Monatsplan](https://github.com/user-attachments/assets/1785cd0a-7eed-4f97-878b-cf3df49063f3)

## Funktionen

- **Authentifizierung** – Email/Passwort-Login, bcrypt-Hashing, sichere Sessions (NextAuth.js)
- **Dashboard** – Monatsübersicht mit Karten, Kreisdiagramm und Fortschrittsanzeigen
- **Konten & Töpfe** – Beliebig viele Budget-Töpfe mit Farbe, Typ und Zielbetrag
- **Regelbasierte Verteilung** – Prozent, Fixbetrag, Restbetrag, Schwellenwert-Regeln mit Prioritäten
- **Einnahmenmanagement** – Mehrere Einkommensquellen, Kategorien, Personenzuordnung
- **Ausgabenverwaltung** – Ausgaben erfassen, kategorisieren, filtern und Töpfen zuordnen
- **Monatsplan** – Automatische Verteilungsvorschläge mit nachvollziehbaren Begründungen
- **Reports** – Jahresübersicht, Balken-, Kreisdiagramm, Sparverlaufslinie
- **Sparziele** – Ziele mit Fortschrittsanzeige verfolgen
- **Mehrbenutzerbetrieb** – Admin & Partner-Rollen, gemeinsame und persönliche Töpfe
- **Mobile First** – Responsive Layout mit Bottom-Navigation auf Mobilgeräten

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 14 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS |
| ORM | Prisma 5 |
| Datenbank | SQLite (Dev) / PostgreSQL (Prod) |
| Auth | NextAuth.js v5 |
| Charts | Recharts |
| Icons | Lucide React |

## Lokales Setup

### Voraussetzungen

- Node.js 18+
- npm

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Für lokale Entwicklung mit SQLite sind keine weiteren Änderungen nötig.

### 3. Datenbank migrieren

```bash
npm run db:migrate
```

### 4. Demo-Daten laden

```bash
npm run db:seed
```

### 5. Anwendung starten

```bash
npm run dev
```

App erreichbar unter: http://localhost:3000

## Datenbank-Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run db:migrate` | Migrationen ausführen |
| `npm run db:seed` | Demo-Daten laden |
| `npm run db:generate` | Prisma Client generieren |
| `npm run db:studio` | Prisma Studio öffnen |

## Demo-Zugänge

Nach dem Seeden (Familie Graf):

| Name | E-Mail | Passwort | Rolle |
|------|--------|----------|-------|
| Martin Graf | martin@graf.ch | demo1234 | Admin |
| Francine Graf | francine@graf.ch | demo1234 | Partner |

## Projektstruktur

```
src/
├── app/
│   ├── (app)/              # Geschützte App-Seiten
│   │   ├── dashboard/      # Dashboard mit Übersicht
│   │   ├── monthly-plan/   # Monatsplan & Verteilungsvorschläge
│   │   ├── income/         # Einnahmen verwalten
│   │   ├── expenses/       # Ausgaben verwalten
│   │   ├── pots/           # Konten & Töpfe verwalten
│   │   ├── rules/          # Verteilungsregeln verwalten
│   │   ├── reports/        # Reports & Statistiken
│   │   └── settings/       # Einstellungen & Profil
│   ├── api/                # API-Routen (REST)
│   └── login/              # Login-Seite
├── components/
│   ├── layout/             # Sidebar, Header, MobileNav
│   └── ui/                 # Wiederverwendbare UI-Komponenten
├── lib/
│   ├── auth.ts             # NextAuth-Konfiguration
│   ├── prisma.ts           # Prisma-Client
│   ├── allocation-engine.ts # Verteilungslogik
│   └── utils.ts            # Hilfsfunktionen
└── middleware.ts            # Auth-Middleware
prisma/
├── schema.prisma           # Datenbankschema
├── seed.ts                 # Demo-Daten
└── migrations/             # SQL-Migrationen
```

## PostgreSQL (Produktion)

1. In `prisma/schema.prisma` den Provider ändern:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. `DATABASE_URL` in `.env` setzen:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/budget_planner"
   ```
3. Migrationen ausführen:
   ```bash
   npx prisma migrate deploy
   ```

## Docker

```bash
docker-compose up -d
```

App erreichbar unter: http://localhost:3000

## Deployment

### Vercel (empfohlen)

1. Repository mit Vercel verbinden
2. Umgebungsvariablen setzen (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`)
3. Automatisches Deployment

### Wichtig vor dem Go-Live

```bash
# Sicheren Secret generieren
openssl rand -base64 32
```

Setzen Sie `NEXTAUTH_SECRET` auf diesen Wert in den Produktions-Umgebungsvariablen.

## Sicherheit

- Passwörter mit **bcrypt** (12 Runden) gehasht
- Sessions mit **JWT** und `NEXTAUTH_SECRET` signiert
- Alle API-Routen prüfen Session und `householdId`
- Middleware schützt alle App-Seiten automatisch
- Prisma schützt vor SQL-Injection
