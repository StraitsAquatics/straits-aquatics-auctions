# Straits Aquatics Auctions v1

Public customer-facing auction application for Straits Aquatics.

## Already configured

Supabase URL:

`https://addrfpwgtixvzokkkuyi.supabase.co`

The application uses a Supabase **publishable** key only. No service-role or secret keys are included.

## Files

- `index.html` — public auction application
- `auction.css` — responsive Straits Aquatics styling
- `auction.js` — Supabase Auth, bidding, Realtime and winner workflow
- `.nojekyll` — prevents GitHub Pages/Jekyll processing
- `test-auction.sql` — optional temporary auction for end-to-end testing

## GitHub setup

1. Create a new GitHub repository named `straits-aquatics-auctions`.
2. Upload all files from this folder into the repository root.
3. Commit them to the `main` branch.
4. Go to **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select `main` and `/ (root)`.
7. Save.

GitHub Pages should then publish the app at an address similar to:

`https://YOUR-GITHUB-USERNAME.github.io/straits-aquatics-auctions/`

## Supabase Auth URL configuration

Because this app uses a 6-digit email OTP rather than a magic-link redirect, OTP verification does not depend on a redirect URL. Still, before launch, set the Supabase **Site URL** to the final auction app URL and add the Webador auction URL as an allowed redirect URL for future compatibility.

## Testing

Run `test-auction.sql` in Supabase SQL Editor.

Then:

1. Open the GitHub auction page in Browser A.
2. Register/sign in with Email A.
3. Complete the one-time bidder profile.
4. Place a bid.
5. Open Browser B/private window.
6. Register/sign in with Email B.
7. Place a higher bid.
8. Confirm Browser A sees the new current bid without refreshing.
9. Test Buy It Now if desired.
10. Test delivery choice from **My Auctions** after winning.

The SQL file contains a cleanup command at the bottom.

## Webador embed

After the GitHub page is tested, embed it on the Webador `/auction` page with:

```html
<iframe
  src="YOUR_GITHUB_PAGES_URL"
  width="100%"
  height="1700"
  frameborder="0"
  scrolling="yes"
  style="width:100%;border:0;background:#fff;"
  title="Straits Aquatics Auctions">
</iframe>
```

## Important

Do not add any Supabase secret/service-role key to these files or to GitHub.
