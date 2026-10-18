This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Contrats de location (administration)

- Dans **Réservations confirmées**, le bouton **Contrat**, sous **Devis PDF**, ouvre la saisie et l'aperçu A4.
- Compléter les identités/CIN, adresses, dates, horaires et conditions financières. Les informations connues sont préremplies ; les soirées se terminent par défaut à minuit le lendemain.
- **Enregistrer**, **Télécharger le PDF** ou **Ouvrir / imprimer le PDF** conservent le contrat. Le PDF arabe reprend les dix clauses du modèle et laisse les deux signatures vides. L'impression se fait depuis le lecteur PDF.
- Les contrats sont privés : lecture, sauvegarde et génération PDF nécessitent la session administrateur.
- Aucune migration ni suppression : les données du contrat sont isolées sous la clé `booking-contract:<id>` dans la table JSON existante `app_settings`. Les réservations, les devis et la clé publique `site-settings` ne sont pas modifiés. Un contrat enregistré ne se resynchronise pas automatiquement avec une réservation modifiée ultérieurement.
- Police arabe Tajawal intégrée localement, sous licence OFL (`public/fonts/OFL.txt`). Le PDF ne dépend pas d'un téléchargement de police ou d'image externe.

Vérifications sans connexion à la base : `npm run test:contracts` (validation, sauvegarde simulée, confidentialité et véritable PDF A4). L'illustration peut être régénérée avec `node scripts/generate-contract-artwork.mjs` après modification de `public/contract/frame.svg`.

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

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
