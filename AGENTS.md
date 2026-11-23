<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Door unlock logic lives in src/lib/advent.ts and is enforced server-side in getDoors; locked doors never get image URLs.
- Both server calendar read paths currently pass the calendarDays review bypass so all 24 doors stay open for owner review; restore the Oslo daily lock only when the owner asks.
- Owner roles are provisioned only after identifying the intended owner; claim_admin checks existing ownership and never grants it to the first visitor.
- Pages ships only dist/client from a separate SPA build; private reads use the Lovable-hosted bearer-authenticated calendar endpoint with exact-origin CORS and server-verified family sessions.
- Shared family passwords are server secrets; the calendar endpoint issues expiring HMAC-signed read-only sessions, bound to the current password so password changes revoke access. Browser session storage contains only the session token, never the password.
- Shared family sessions never grant owner roles or development date bypass; owner uploads retain separate Lovable account authentication and role checks. Private storage remains owner-only and image links expire after five minutes.
- Stage Pages files from Nitro's .output/public into dist/client after recursive safety checks; never copy .output/server, because Pages must contain only browser files.
- Set the SPA maskPath to the same repository base path as the router and asset base; rendering the shell at / outside that base creates an initial not-found state and hydration mismatch.
- Development calendar requests always use the same-origin preview server; static production builds use the configured API origin so unpublished changes cannot break preview login through stale hosted endpoints.
- Every image in a door has its own text: the door caption belongs to the first image and extra_captions holds one text per extra image in order; the open dialog shows the text of the image currently on screen.
