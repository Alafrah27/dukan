# Dukan Tasks

## Phase 1 — Authentication

- [x] Complete Clerk authentication and Convex user synchronization.
  - [x] Save the authenticated user's full name and email to Convex.
  - [x] Register and save the Expo push token to the authenticated user's Convex record.
  - [x] Verify profile and push-token persistence in the rebuilt Android development app (confirmed by the user).

## Phase 2 — Category Management

- [x] Convex backend for categories implemented (`convex/category.js`).
- [x] Admin UI components created (`src/components/admin/CategoryUI.jsx`).
- [x] Customer category screens created (`src/app/customer/category/category.jsx`, `categorylist.jsx`).
- [x] Category image handling implemented (`src/lib/categoryImage.js`).
- [x] Passed testing (`category.test.js`, `category-screen.test.js`, `category-image.test.js`).
- [x] Unified category schema between `convex/schema.js` and `convex/category.js` using canonical `categoryFields` / `categoryDocument` in `convex/validators.js`.
- [x] Fixed React Native Android Content-Type upload bug (`BadHeader`) by explicitly setting `blob.type` via `slice(0, size, contentType)`.
- [x] Deployed and verified on Convex dev environment (`beloved-raven-470`).
