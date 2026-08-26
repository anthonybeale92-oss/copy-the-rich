# Copy the Rich Trades

Brand site for **copytherichtrades.com** — a desk running under Bankz on Pulse Markets tech.

Vite + React SPA. Members authenticate against their Pulse account over SSO; the site itself
holds no accounts and no money.

## Where the money is attributed

Every Pulse link on the site falls back to `HOUSE_REF` in `src/api.ts`:

    plan451-anthony-31o3   → Anthony Beale (affiliate plan451)

Anthony sits directly under `plan222` (Bankz) in Pulse, so signups here credit Anthony and roll
up to Bankz on their own. A visitor's own `?ref=` always wins over the house code.

## Shared backend — read before changing

The API paths are `/api/sso/robthebankz/*`. That is **Pulse's namespace for every white-label desk
on this tech**, not a leftover brand name. Renaming it 404s every login, balance read and
tap-to-trade. It is deliberately left alone.

Consequences of sharing that backend, which are worth knowing before promising members otherwise:

- The community feed and DMs are the network's, not this desk's.
- `signalsUrl` is served by Pulse and is the same link the other desks hand out.

## Run it

    npm install
    npm run dev      # local
    npm run build    # dist/
    npm start        # serve -s dist -l $PORT   (what Railway runs)

## Logo

`public/logo.svg` is a flat reading of the supplied 3D render — same shapes, same two blues,
no bevels, so it survives a 34px nav slot. Replace the file to swap the mark everywhere.
