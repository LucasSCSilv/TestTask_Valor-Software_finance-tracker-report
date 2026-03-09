# finance-tracker-reports

> Micro-frontend remote for [FinTrack](https://github.com/seu-usuario/finance-tracker).  
> Exposes the **Reports** page as a Module Federation remote, deployed independently via Zephyr Cloud.

## Architecture

This is the **remote** in a Module Federation setup:

```
finance-tracker (shell/host)
  └── loads Reports at runtime from ─→ finance-tracker-reports (this repo)
```

The shell (`finance-tracker`) never bundles this code — it fetches it live from Zephyr Cloud's edge network.

## What's exposed

```js
// vite.config.js
exposes: {
  './Reports': './src/Reports.jsx'
}
```

The `Reports` component accepts a `userId` prop passed by the shell.

## Setup

```bash
npm install
```

Create `.env` (same Supabase project as the shell):
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Development

```bash
# Run this BEFORE starting finance-tracker shell
npm run dev   # starts on http://localhost:5174
```

## Deploy

```bash
npx zephyr-cli login   # only needed once
npm run build          # Zephyr intercepts and deploys automatically
```

After deploying, copy the Zephyr URL and update `vite.config.js` in `finance-tracker`:

```js
remotes: {
  finance_tracker_reports: {
    entry: 'https://YOUR-ZEPHYR-URL/remoteEntry.js',
    type: 'module',
  }
}
```

## Tech stack

- React 18
- Vite + `@module-federation/vite`
- Zephyr Cloud (deploy)
- Supabase (data)
- Recharts (charts)
- Tailwind CSS
