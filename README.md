This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:


### Auswahlzustand (Stand 2025-08)

Die frühere Steuerung über URL-Parameter (`klasse`, `woche`, `gruppe`) wurde entfernt. Stattdessen verwaltet ein Zustand-Store (`useSelectionStore`) die aktuelle Auswahl:

- `classId` – aktuelle Klasse
- `weekId` – pro Klasse gemerkte Woche (persistiert in `weekByClass`)
- `group` – Spezialisierung (Default 1)

Persistenz: mit `zustand/middleware/persist` unter dem Key `bp-selection`. Ein Wechsel der Klasse merkt sich die zuletzt verwendete Woche dieser Klasse. Es gibt keine Query-Parameter mehr für diese Auswahlwerte.
You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
