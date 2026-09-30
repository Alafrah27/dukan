# Dukan Authentication Specification

Status: implemented and deployed to the development backend; real account/device walkthroughs remain pending.

This document describes the authentication contract and records the original source inspection on 2026-09-19. See the implementation record below for completed work and verification limits.

## Implementation record

- Implemented email/password login, registration, email-code verification/resend, and sign-out, with role guards and retryable access errors.
- Added the existing `assets/images/dukan.png` logo, welcoming title, Arabic-default localization, English switching, and Dukan design tokens. The splash screen also uses the logo and brand background.
- Added Google and Apple browser sign-in using Clerk's `useSSO`, as requested after the original specification. Both use the same backend user bootstrap and role guards. Cancellation returns to the form; incomplete challenges do not grant access.
- Verified through the Clerk environment endpoint that Native API, email/password, email-code verification, Google, and Apple are enabled in the configured development instance. MFA is not required in the inspected configuration. Provider completion still needs a real account walkthrough.
- Configured `CLERK_JWT_ISSUER_DOMAIN` and deployed the functions to development deployment `beloved-raven-470`. No production deployment was changed.
- `npm test`: 13 tests passed, covering schema-valid/idempotent/concurrent user creation, preserved admin roles, ownership, anonymous/admin denial, rejected client roles, role decisions, pending tasks, stale profiles, and safe error mapping.
- Expo web export passed. Browser visual/interaction checks were not run because the headless browser execution was declined. Native bundle results are recorded below when available.
- A real sign-in, Google/Apple round-trip, native deep-link handling, and session restoration on a device remain unverified. Confirm the Clerk Convex integration (or a `convex` JWT template) and allow the app's `dukan://sso-callback` redirect in Clerk when using a native development build. Expo Go uses its runtime-generated redirect instead.

### Local verification

```sh
npm test
npx expo export --platform web --output-dir dist/auth-web
npx expo export --platform android --platform ios --output-dir dist/auth-native
```

Use existing Clerk accounts for manual sign-in checks. Assign an existing account's Convex role to `admin` only through an authorized operator action; no public role-assignment endpoint was added. Confirm that a customer cannot access `/dasboard/dasboard`, and that sign-out removes access through back navigation.

## 1. Working rules

- Read the entire [AGENTS.md](./AGENTS.md) before implementation. Inspect the current code and dependencies before making changes.
- Check applicable skills and relevant current official documentation before implementation. For this flow, consult `clerk`, `clerk-expo`, and `convex`; consult `convex-expert` before editing backend code. Read the relevant skill references and verify APIs against installed package versions.
- Read [DESIGNS.md](./DESIGNS.md) before creating or modifying UI. This is the existing design filename and the UI source of truth.
- Use JavaScript, Expo, React Native, Expo Router, Clerk, and Convex. Do not introduce TypeScript or a custom authentication system.
- Default to Arabic and RTL when no language preference exists. Support English and preserve an explicitly saved language preference.
- Never reset or scaffold the project again. The project has already been reset.
- Reuse existing components and architecture. Keep implementation focused on authentication and the startup fixes needed to exercise it.
- Keep passwords and authentication credentials under Clerk's control. Never store passwords in Convex, logs, or client persistence.

## 2. Current state: inspected code

These are historical findings from before implementation, not the current implementation status or successful runtime checks.

| Area | Observed state |
|---|---|
| Dependencies | Installed versions inspected: `@clerk/expo` 4.6.8, `expo-router` 57.0.21, and `convex` 1.45.0. Recheck before implementation. |
| Root providers | `src/app/_layout.jsx` includes `ClerkProvider` and Clerk's `tokenCache`; it does not connect a Convex provider. |
| Authentication screen | `src/app/index.jsx` implements email/password registration and email-code verification. Signed-in users see a message; login and role-based routing are not implemented. |
| User synchronization | `convex/user.js` has an identity-derived `syncUser` mutation. It returns existing users unchanged and assigns new users the role `"user"`. |
| Schema mismatch | `syncUser` inserts `name`, but `convex/schema.js` requires `fullName`. User creation must be corrected. |
| Current-user query | `getCurrentUser` calls `requireUser`, which throws when the user's Convex record is missing. |
| Authorization helpers | `convex/auth.js` has `requireIdentity`, `requireUser`, and `requireAdmin`. The admin helper checks the stored role for `"admin"`. |
| Role schema | `users.role` is currently an optional string; missing or unsupported values therefore need explicit handling. |
| Server auth configuration | No `convex/auth.config.js` was found during inspection. Remote Clerk/Convex configuration has not been verified. |
| Destination screens | The dashboard route file exists at `src/app/dasboard/(drawer)/dasboard.jsx` but is empty. No customer landing screen currently exists. |

### Startup blockers and related findings

- The root layout references `Fonts`, `useEffect`, and `SplashScreen` without importing them.
- Its translation import points to `../../local/i18n`; the inspected configuration is `src/lib/i18.js`.
- Its font paths use `../assets/fonts` from `src/app`, while the font assets are in the root `assets/fonts` directory.
- Source imports `expo-notifications` and `@react-native-async-storage/async-storage`, but neither is declared in `package.json`. Verify installed dependencies and Expo compatibility before adding required packages.
- `src/app/dasboard/layout.jsx` is empty and does not use Expo Router's `_layout.jsx` naming convention.
- The language configuration currently chooses the device language when no preference is saved, which does not satisfy the Arabic-default requirement.
- `package.json` still contains a `reset-project` script pointing to a deleted file. Do not run it or recreate the reset workflow.

## 3. Intended authentication experience

The public entry point remains `src/app/index.jsx`, at route `/`.

- Show email/password login by default.
- Provide an explicit registration mode on the same screen and preserve email verification as part of registration.
- Offer Google and Apple sign-in through the enabled Clerk social providers. Show the Dukan logo and a welcoming title.
- Provide verification-code entry and resend with pending states and provider error handling.
- Activate the Clerk session only after the required authentication or verification steps complete.
- Respect additional Clerk challenges and session tasks. Never treat an incomplete attempt as successful or bypass required verification. An unsupported challenge must keep protected content inaccessible and show a useful explanation.
- Provide sign-out from authenticated areas and from access/synchronization error states.
- Disable duplicate submissions while requests are pending. Show localized field errors and useful network/retry states without exposing raw credentials or internal errors.
- Preserve the required CAPTCHA mount point for registration where Clerk requires it.

Use custom UI that follows `DESIGNS.md`: existing Dukan colors and NativeWind tokens, readable Arabic typography, direction-aware layouts, accessible controls, and branded loading/error states. Do not replace the design with a generic authentication template or introduce another UI library.

### Routing contract

| State | Required behavior |
|---|---|
| Clerk session is loading | Show a branded loading state; do not redirect prematurely. |
| No authenticated Clerk session | Show login at `/`. Protected deep links return here. |
| Clerk is signed in; Convex authentication or user profile is loading | Keep protected content hidden and show a branded loading state. |
| Authenticated profile has role `"user"` | Redirect to `/customer/home`. |
| Authenticated profile has role `"admin"` | Redirect to `/dasboard/dasboard`. |
| Existing profile has a missing or unrecognized role | Show an access error with retry and sign-out; grant access to neither area. |
| User synchronization or backend authentication fails | Show a retryable error with sign-out; keep protected content inaccessible. |

Preserve the existing `dasboard` spelling for this work. The `(drawer)` route group does not add a URL segment. Create a minimal, branded customer home and make the existing dashboard landing route render a minimal, branded screen so both destinations can be verified. Building the full storefront or admin dashboard is outside this authentication scope.

Apply layout-level Expo Router guards to customer and admin areas, with a shared session/profile state and consistent role resolution. A customer entering an admin route returns to customer home; an admin entering a customer-only route returns to the dashboard. Guard the complete area, including direct links and nested screens.

Use replacement/guard-based navigation for authentication transitions so login and unauthorized screens do not remain accessible through back navigation. Signed-in users visiting `/` resolve to their role destination. Session expiration, sign-out, and reactive role changes must remove access promptly, without displaying the previous user's profile or protected content.

## 4. Backend and session integration

### Sources of authority

- Clerk authenticates the user and manages sessions.
- Convex `users.role` is the authoritative application role. The values for this scope are exactly `"user"` and `"admin"`; `"user"` means customer.
- Never derive privileges from a form field, route parameter, local storage, client-provided user ID, or client-provided role.
- Admin assignment is an operator-controlled backend action. Public registration cannot create admins. An admin-management interface is outside this scope.
- Frontend guards support navigation; server-side authorization protects data and operations.

### Provider and token configuration

1. Retain `ClerkProvider` and `tokenCache` from `@clerk/expo/token-cache`.
2. Place `ConvexProviderWithClerk` inside `ClerkProvider`, using Clerk's `useAuth` and a stable `ConvexReactClient` instance.
3. Read the client configuration from `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` and `EXPO_PUBLIC_CONVEX_URL`. Do not put private keys in Expo variables.
4. Add JavaScript server auth configuration in `convex/auth.config.js`, using the verified Clerk issuer domain and the Convex integration's application ID (`convex`). Configure the issuer server-side for the correct deployment.
5. Use Convex authentication readiness before issuing authenticated queries or mutations. A loaded Clerk session alone is insufficient to establish backend readiness.

### User bootstrap and interfaces

Preserve the existing public function names and empty argument objects:

| Function/helper | Intended contract |
|---|---|
| `user.syncUser({})` | Require a verified identity, find its record using `by_clerkId`, return the existing record unchanged or atomically create and return a new record with role `"user"`. Accept no role or identity argument. |
| `user.getCurrentUser({})` | Require a verified identity and return its profile, or `null` if its record does not yet exist. An unauthenticated request remains unauthorized. |
| `requireIdentity(ctx)` | Reject calls without a verified Clerk identity. |
| `requireUser(ctx)` | Reject calls without an identity or an existing user record. |
| `requireAdmin(ctx)` | Require an existing user whose stored role is exactly `"admin"`. |

After Convex authenticates the session, `UserSession` in `src/app/_layout.jsx` calls the idempotent `syncUser` mutation before the shared auth context subscribes to the current profile. This runs for signup, login, and session restoration. Concurrent or repeated bootstrap attempts must not create duplicate users. An existing record with an invalid role is an access error, not a reason to recreate the user. Session changes reset profile state; Retry also reconnects the Convex provider. Late synchronization responses from an unmounted session are ignored.

The signup connection investigation confirmed that the development backend's configured issuer matches the app's Clerk instance. Live inspection of the connected Android app subsequently identified two failures:

- A locally active Clerk session received HTTP 401 `signed_out` / `authentication_invalid` when requesting tokens. Custom JavaScript forms and browser SSO now run with `ClerkProvider.__experimental_disableNativeClientSync`, supported by the installed Expo SDK for apps without Clerk native UI components. The token adapter signs out only the rejected session, preserving a newer session if an older request finishes late. Network failures and missing templates do not trigger sign-out.
- After signing in again, the session token was valid, but had no `aud: "convex"`; requesting the `convex` template returned HTTP 404 `resource_not_found`. This is a Clerk configuration blocker, before the database mutation. Enable the [Convex integration](https://dashboard.clerk.com/apps/setup/convex) for the Development instance whose Frontend API is `https://above-sawfly-3563.clerk.accounts.dev`. Clerk management access is not connected locally, so the operator must activate this setting. Refresh the session/reload the app afterward and verify a successful `user.syncUser` call before considering the connection fixed.

Development console messages distinguish backend authentication, user synchronization, and profile-query failures without printing credentials. Token values were not printed during the Android token checks.

Correct user creation to write `fullName`, matching the schema, using identity-derived profile information and a non-authoritative display fallback when needed. Preserve existing roles during synchronization. Add appropriate argument and return validators to changed registered functions.

Keep loading, missing-record, and failure states distinct. Avoid automatic retry loops; offer explicit retry after failure. Clear session-specific bootstrap state on sign-out or account changes and ignore stale completions from the previous session.

Every admin query, mutation, or action must enforce authorization server-side before accessing protected data or performing an operation. Database queries/mutations can reuse `requireAdmin`; actions must use an appropriate authenticated server-side authorization check before external side effects. Customer data operations must also check ownership.

Do not silently promote, demote, or reinterpret existing unknown roles. Inspect existing data before tightening role validators or planning a migration; no data migration or role change is authorized by this document alone.

## 5. Configuration still requiring verification

Source inspection has not verified these items:

- The Clerk publishable key belongs to the intended instance, and the Convex URL points to the intended deployment.
- Clerk Native API is enabled for the native application.
- Email/password sign-in, email/password registration, and email-code verification are enabled. Confirm factors before implementing their flows.
- Any enabled device-trust, MFA, or session-task requirements are accounted for; do not disable them merely to make login succeed.
- The Clerk Convex integration is enabled, and the issuer/application ID used for server validation match it.
- Existing Convex user records and admin assignments are compatible with the intended role handling.

Before a deployment-affecting implementation command, inspect the applicable deployment skill and identify its target. The completed development deployment is recorded above; future deployment targets must still be checked.

## 6. Acceptance checks for implementation

These checks are pending. Mark them complete only with evidence from the implemented flow.

- [ ] The app starts after the required import, asset-path, dependency, and layout fixes.
- [ ] A signed-out launch shows login at `/`.
- [ ] Signed-out customer/admin deep links return to login without displaying protected content.
- [ ] Customer email/password login reaches `/customer/home`.
- [ ] Admin email/password login reaches `/dasboard/dasboard`.
- [ ] Registration verifies email and creates exactly one Convex user with role `"user"` and the schema's `fullName` field.
- [ ] Repeated and concurrent synchronization do not duplicate the record or overwrite an admin role.
- [ ] A customer cannot access admin screens or invoke admin operations directly.
- [ ] Client-supplied role or identity values cannot grant admin privileges.
- [ ] Session restoration waits for Clerk, Convex, and the profile without flashing login or the wrong destination.
- [ ] Sign-out and expiration remove protected access, including through back navigation.
- [ ] Switching accounts does not reuse the previous account's role or profile.
- [ ] Missing/unknown roles produce the access-error state without a redirect loop.
- [ ] Invalid credentials, invalid/expired codes, resend failures, and incomplete Clerk challenges show useful states and never grant premature access.
- [ ] Google and Apple complete real provider round-trips; cancelling returns to the form and incomplete verification remains blocked.
- [ ] Network/backend failures offer retry and sign-out without exposing protected content.
- [ ] The session survives an app restart through Clerk's token cache.
- [ ] First launch defaults to Arabic; an explicit English preference persists. RTL/LTR layouts and authentication states follow `DESIGNS.md`.

Use focused backend tests for identity, authorization, and bootstrap behavior, plus a real device/emulator walkthrough for login, verification, routing, and session restoration. Do not treat source inspection or a successful build alone as proof of working authentication.

## 7. Official references

Consult the current official documentation and installed package APIs before implementation; examples using TypeScript must be adapted to this project's JavaScript requirement.

- [Clerk custom email/password authentication](https://clerk.com/docs/guides/development/custom-flows/authentication/email-password): login, registration, email verification, completion states, and prerequisite factors.
- [Expo Router authentication](https://docs.expo.dev/router/advanced/authentication/): protected navigation and session-driven guards.
- [Convex and Clerk](https://docs.convex.dev/auth/clerk): provider integration, token validation, and Convex authentication readiness.

Applicable local skills inspected while preparing this specification: `.agents/skills/clerk/SKILL.md`, `.agents/skills/clerk-expo/SKILL.md` and its protected-routes/custom-flows references, `.agents/skills/convex/SKILL.md`, and `.agents/skills/convex-expert/SKILL.md`.
