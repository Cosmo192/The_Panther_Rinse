# GSU Dorm Laundry Tracker

Mobile-first React application for viewing the realtime availability of 41
washers and 32 dryers. Supabase provides PostgreSQL, Edge Functions, and
Realtime; Vercel hosts the frontend.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Project URL and anon/publishable key from the Supabase Connect panel.
4. Start the app with `npm run dev`.

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Only a browser-safe anon or publishable key belongs in the frontend. Never use
a Supabase secret or service-role key in a `VITE_` variable.

## Structure

- `src/components` — reusable UI
- `src/pages` — route-level screens
- `src/hooks` — data and Realtime hooks
- `src/utils` — shared utilities, including the Supabase client
- `supabase/functions` — Edge Functions
- `supabase/migrations` — PostgreSQL migrations

The earlier Express/SQLite proof of concept remains in `client/` and `server/`
for reference, but the root Vite application is now the active architecture.

## Design system: Clean Blue

Tokens live in `tailwind.config.js`, loaded by `@config` in `src/styles.css`.

- Primary: #0066CC; free: #00CC66; in-use/warning: #FF3333.
- Background: #FFFFFF; body text: #1A1A1A.
- Dark status-text variants sit on pale status surfaces for legibility. Status
  labels accompany color, and bright green buttons use dark text.
- Typography: system sans-serif; 30px/48px page headings, 20px section headings,
  16px body, and 12–14px labels.
- Spacing uses Tailwind's 4px scale: 16px mobile gutters, 32px larger gutters,
  16–24px card padding, 32–40px section separation.
- Controls use 12px radii and 48px minimum height; scan CTAs use 64px height.
  Cards use 16px radii; badges are pill-shaped.
- Shared classes: `btn btn-primary`, `btn btn-secondary`, `btn btn-success`,
  `btn btn-danger`, `panel`, `status-badge`, `status-free`, and `status-in-use`.
  Danger buttons are available for destructive actions; marking done is a
  success action, not a destructive one.
- Buttons have hover, pressed, focus-visible, and disabled states. Busy scan
  buttons disable duplicate input and expose `aria-busy`. Motion is disabled
  when the device requests reduced motion.
- Mobile first: `xs` 400px, `sm` 640px, `md` 768px, `lg` 1024px,
  `xl` 1280px, `2xl` 1536px. Washer/dryer columns split at `lg`.

## Deploy to Vercel and Supabase

1. Choose a GitHub repository and push this project from its root (not
   `client/`). Do not commit `.env.local`, CSV token exports, QR output, or
   service-role credentials. The legacy `client/` and `server/` are inactive.
2. In Vercel, choose **Add New → Project**, import that GitHub repository, and
   select **Vite**. Root directory is this folder, build command is
   `npm run build`, output directory is `dist`, install command is `npm ci`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Vercel's
   Environment Variables for Production and the appropriate Preview environment.
   Vercel does not receive your ignored local `.env.local` file. These values
   are public, build-time browser configuration; redeploy after changing them.
4. Connect the production branch (usually `main`). Vercel's GitHub integration
   then builds on pushes and creates preview deployments for other branches.
5. Separately link the correct Supabase project, apply migrations, and deploy
   all four Edge Functions using the functions README. Supabase hosts these
   services, but creating a frontend deployment does **not** deploy migrations
   or Edge Function source automatically.
6. Verify the Cron job is enabled and its run history has no errors. Test
   public read access and Realtime with the browser-safe key. Ensure QR tokens
   are not exposed through public queries or Realtime payloads before launch.
7. Configure a stable production domain and test `/scan?token=...` directly,
   not only by navigating from the home page. Never print ephemeral preview URLs.

References: [Vercel Git integration](https://vercel.com/docs/git),
 [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Generate, print, and place QR codes

The generator uses existing database tokens, not newly invented ones. The
current inventory is 41 washers and 32 dryers (73 labels).

1. In the correct Supabase SQL Editor, export this query as a **private CSV**:

   `select id, qr_token from public.machines order by type desc, id;`

2. Save it as `work/machines.csv` (ignored by Git). Treat the export and labels
   as write capabilities: anyone with a QR token can change that machine's status.
3. Install the printing dependencies in an isolated environment:

   `python3 -m venv work/qr-venv`

   `work/qr-venv/bin/pip install -r scripts/qr-requirements.txt`

4. Generate after deployment:

   `work/qr-venv/bin/python scripts/generate_qr_labels.py --machines work/machines.csv --origin https://YOUR-STABLE-DOMAIN --supabase-url https://YOUR-PROJECT.supabase.co`

   The command rejects placeholder origins, wrong inventory, duplicate tokens,
   and mismatched validation responses. It checks all 73 token endpoints and
   frontend routes with read-only GET requests before generating any output.
5. Output is `outputs/qr-labels/laundry-stickers.pdf`, 73 high-resolution PNGs,
   and a private URL manifest. The PDF is five US Letter pages, up to 15 stickers per
   page, with exact 144-point (2-inch) cut squares and four-module QR quiet zones.
   This is a cut-sheet layout, not a manufacturer-specific precut label template.
6. Render and inspect both PDF pages. Print at **Actual size / 100%**, never
   Fit to Page. Measure a square with a ruler before printing the full batch.
7. Scan **every printed code** on an iPhone 12 or later and an Android phone.
   Confirm the displayed machine ID matches the printed label. Check start,
   reload/resumed timer, done, and updates on a second device using one designated
   test machine, then leave that test machine free.
8. Use matte, water-resistant sticker paper; avoid glossy laminates that reflect
   light. Place on a clean, flat, visible surface beside controls without
   obstructing instructions, vents, or manufacturer safety labels.

Do not rotate tokens after printing without reprinting the corresponding
labels. Labels are not production-ready until the deployment and physical
scan checks pass.

## Quality checks

- `npm run typecheck`
- `npm run build`
- `node --experimental-strip-types --test tests/*.test.ts`
- `python3 tests/qr_labels_test.py`
- At 390×844 (iPhone 12 layout) and 412×915 (Android layout), verify both routes,
  no horizontal overflow, readable errors, and reachable 48–64px touch controls.
- Test offline mode and a delayed request: HTTP calls time out at 15 seconds.
  A timed-out POST may still finish on the server; check status before retrying.
- Test keyboard-only navigation, visible focus, 200% text zoom, reduced motion,
  VoiceOver/TalkBack, invalid tokens, and a forced rendering error.
- Live counts are announced politely; errors and toasts have accessible roles.
  Machine status has a text label in addition to color. The site currently has
  no content images requiring alt text; future images must have descriptive alt
  text or empty alt text when decorative.
- The scan route is code-split, CSS is built/minified by Vite, and there are no
  remote fonts or decorative raster images to download.

Automated compilation/unit checks are not a substitute for a WCAG AA audit,
real-device testing, or actual production QR scans.

## Troubleshooting

- **Missing configuration:** copy `.env.example` to `.env.local`, supply the
  public project values, then restart Vite. On Vercel, update settings and redeploy.
- **Empty machine list:** apply the seed migration to the same project configured
  in the frontend. Confirm explicit column grants and the public SELECT policy.
- **Realtime disconnected:** check the machines publication, RLS, network access,
  and Supabase project health. The page warns when data may be stale.
- **401 on a scan action:** verify that the four functions are deployed with
  their supplied `verify_jwt = false` settings and the token matches that machine.
- **409 on start:** another request already claimed the machine; refresh status.
- **Countdown reaches zero:** the scan estimate is 45 minutes; the database
  release occurs after 50 minutes on the next one-minute Cron run.
- **History or release missing:** apply the automation migration and inspect
  `cron.job_run_details`; a frontend deployment cannot install database triggers.
- **QR scan fails:** verify the stable domain, exact token, printed 2-inch scale,
  intact white quiet zone, good lighting, and absence of glare.
- **/scan returns 404:** import the project root and include `vercel.json`.
- **Error boundary appears:** reload; if it persists, inspect browser errors.
  Do not put scanned tokens or service-role credentials in public bug reports.

## Future features

- Usage analytics and peak-time forecasts from machine history.
- Multiple buildings/rooms with scoped machine lists and QR inventories.
- Staff maintenance flags and authenticated administration.
- Token rotation, abuse controls/rate limits, and expiring cycle ownership.
- A single configurable cycle duration per machine type.
