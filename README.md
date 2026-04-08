# Club & Cause

Submission-focused MERN project with a traditional split structure:
- `frontend/`: React + Vite + Tailwind + Sonner
- `backend/`: Express + TypeScript + Mongoose
- `shared/`: shared Zod schemas, domain types, and business helpers

## Workspace Scripts
- `npm install`
- `npm run dev:frontend`
- `npm run dev:backend`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Environment Setup
Frontend:
- copy `frontend/.env.example` to `frontend/.env`
- set `VITE_API_BASE_URL=http://localhost:4000/api`

Backend:
- copy `backend/.env.example` to `backend/.env`
- required: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `APP_ENV` supports `development`, `demo`, and `production`
- for Atlas on networks where `mongodb+srv://` fails, use the standard non-SRV `mongodb://...` connection string from Atlas Drivers
- replace `HOST_1`, `HOST_2`, `HOST_3`, `YOUR_REPLICA_SET`, and the password placeholder with the exact Atlas values
- URL-encode the password if it contains special characters
- `APP_URL` should point to the frontend host used for CTA links and primary CORS access
- `ADDITIONAL_ALLOWED_ORIGINS` accepts a comma-separated list of preview or secondary frontend hosts
- provider keys can be left blank or kept as the provided `optional_*` placeholders until you wire real services
- Razorpay setup:
  - use `rzp_test_*` keys during development and test mode checkout
  - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` enable Razorpay test/live checkout
  - `RAZORPAY_WEBHOOK_SECRET` enables webhook verification for payment lifecycle events and can stay blank unless you are testing webhooks
  - in `APP_ENV=production`, `RAZORPAY_MONTHLY_PLAN_ID` and `RAZORPAY_YEARLY_PLAN_ID` are required for true recurring subscriptions
  - in `APP_ENV=development` or `APP_ENV=demo`, if those plan ids are missing the app falls back to a Razorpay test order for subscription checkout so you can test activation without recurring-plan access
- email delivery:
  - `EMAIL_PROVIDER=mock` is intended for `development` and `demo` only
  - `EMAIL_PROVIDER=smtp` enables real email delivery through Nodemailer/SMTP and is the expected production setting
  - `EMAIL_FROM` controls the sender identity used by the provider
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS` configure the mailbox transport
- seed admin setup:
  - `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are required when `APP_ENV` is `development` or `production`
  - `APP_ENV=demo` can use the built-in demo admin defaults, or you can override them with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`

## Seeded Data
The seed script populates:
- 2 starter charities
- monthly and yearly plans
- admin account

Run `npm run seed --workspace backend` after configuring backend envs.

Demo-mode admin defaults:
- `APP_ENV=demo`
- `admin@clubandcause.demo`
- `Admin@123456`

Non-demo seed runs require explicit `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

## Deployment Notes
Frontend:
- `frontend/vercel.json` includes SPA rewrites for Vercel hosting
- deploy the `frontend/` directory separately and set `VITE_API_BASE_URL` to the deployed backend API origin

Backend:
- `backend/vercel.json` routes all backend traffic through the single Vercel serverless entry `backend/api/index.ts`
- `backend/render.yaml` is included for Render free-tier deployment of the Express server
- `backend/Dockerfile` is included for hosts that prefer container deployment
- if deploying on Vercel, deploy the `backend/` directory as a separate Vercel project and set the same backend env vars there
- runtime bootstrap on Vercel now only configures providers and connects Mongo; seeding is a separate one-time script
- the lightweight backend health probe is `GET /api/health`; it returns before Mongo bootstrap so Vercel smoke checks can pass even during cold starts
- point backend `APP_URL` at the deployed frontend host
- add preview domains or alternate frontend domains to `ADDITIONAL_ALLOWED_ORIGINS`

## Security Notes
The backend now includes:
- `helmet` for standard security headers
- auth-specific rate limiting on `/api/auth`
- general API rate limiting on `/api/*`
- `x-powered-by` disabled
- proxy-aware configuration for hosted deployments
- JSON and form body size limits to reduce oversized payload risk
- `httpOnly` cookie-based access and refresh token handling
- production guardrails that block mock email delivery and direct winner-proof URLs

## Testing Notes
Current automated coverage includes:
- domain logic tests
- auth session and password reset service tests
- billing provider availability and cancellation tests
- draw publish and winner allocation tests
- winner review and payout tests
- route-level integration tests for validation, auth, authorization, subscription gating, draw operations, health checks, CORS, and 404 responses
- dashboard analytics aggregation tests
- seed credential safety tests
- environment-mode safety tests for email and proof submission

## Razorpay Test Mode
- This repo currently supports Razorpay test-mode checkout for development.
- Donations use Razorpay test orders.
- Subscriptions use a Razorpay test order fallback in `APP_ENV=development` and `APP_ENV=demo` when recurring plan ids are not configured.
- For true recurring subscriptions in production, set `RAZORPAY_MONTHLY_PLAN_ID` and `RAZORPAY_YEARLY_PLAN_ID`.
- Test checkout inputs:
  - UPI success: `success@razorpay`
  - UPI failure: `failure@razorpay`
  - card expiry: any future date
  - CVV: any random CVV
  - OTP: any random 4 to 10 digits for success, below 4 digits for failure
- Razorpay's official test card and UPI references:
  - https://razorpay.com/docs/payments/payments/test-card-details/?preferred-country=IN
  - https://razorpay.com/docs/payments/payments/test-upi-details/?preferred-country=IN
  - https://razorpay.com/docs/payments/subscriptions/test/
## Notes
- Subscription and one-time donation checkout require Razorpay configuration. In non-production, subscription checkout can use a Razorpay test order when recurring plan ids are unavailable; production still requires real Razorpay subscription plan ids.
- Winner proof submission supports signed Cloudinary uploads, and raw proof URLs are limited to `APP_ENV=demo`.
- Draw publication is admin-triggered and monthly.
- Frontend and backend can now be deployed separately.
- Auth supports rotating refresh tokens plus forgot/reset password flows using secure cookies.
- Notification logs now persist delivery metadata like recipient, provider, subject, send status, and failure reason.
- Email templates use a branded HTML layout with CTA blocks and richer operational metadata for draw, subscription, password, and winner events.
- Admin analytics surface subscription counts, donation splits, payout totals, notification health, and the latest published draw summary.






