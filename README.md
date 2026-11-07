# Straits Aquatics Auctions — Multilingual public site

Ready-to-upload replacement for the public `straits-aquatics-auctions` GitHub Pages repository.

## Added
- 🇬🇧 English / 🇪🇸 Spanish / 🇵🇹 Portuguese language buttons in the header.
- Language preference is remembered on the customer's device.
- Spanish and Portuguese views display monetary values in EUR.
- Fixed conversion: **£1 = €1.20**.
- If an auction is internally stored in GBP, an EUR bid entered by a Spanish/Portuguese customer is converted back to GBP before the secure Supabase bid RPC is called.
- Existing auctions, authentication, bid emails, Buy It Now, delivery selection and realtime updates remain intact.

## Important
Auction titles, descriptions, categories and custom delivery notes are seller-authored content and remain exactly as entered in Auction Manager. The site interface around them is translated.

## Deploy
Upload the files in this folder to the root of the public GitHub repository `StraitsAquatics/straits-aquatics-auctions`, replacing existing files with the same names, then commit.
