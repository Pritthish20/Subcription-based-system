# Golf Charity Subscription Platform

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
- for Atlas on networks where `mongodb+srv://` fails, use the standard non-SRV `mongodb://...` connection string from Atlas Drivers
- replace `HOST_1`, `HOST_2`, `HOST_3`, `YOUR_REPLICA_SET`, and the password placeholder with the exact Atlas values
- URL-encode the password if it contains special characters
- `APP_URL` should point to the frontend host used for CTA links and primary CORS access
- `ADDITIONAL_ALLOWED_ORIGINS` accepts a comma-separated list of preview or secondary frontend hosts
- provider keys can be left blank or kept as the provided `optional_*` placeholders until you wire real services
- Razorpay setup:
  - `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` enable live subscription and donation checkout
  - `RAZORPAY_WEBHOOK_SECRET` enables webhook verification for payment lifecycle events
  - `RAZORPAY_MONTHLY_PLAN_ID` and `RAZORPAY_YEARLY_PLAN_ID` are optional if you pre-create plans in Razorpay; otherwise the backend can create plan records on demand
- email delivery:
  - `EMAIL_PROVIDER=mock` keeps delivery local and marks notification logs as sent via the mock provider
  - `EMAIL_PROVIDER=smtp` enables real email delivery through Nodemailer/SMTP
  - `EMAIL_FROM` controls the sender identity used by the provider
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS` configure the mailbox transport

## Seeded Data
The seed script populates:
- 2 starter charities
- monthly and yearly plans
- admin account

Run `npm run seed --workspace backend` after configuring backend envs.`r`n`r`nDefault admin credentials:
- `admin@digitalheroes.demo`
- `Admin@123456`

## Deployment Notes
Frontend:
- `frontend/vercel.json` includes SPA rewrites for Vercel hosting
- deploy the `frontend/` directory separately and set `VITE_API_BASE_URL` to the deployed backend API origin

Backend:
- `backend/vercel.json` configures the backend Vercel serverless functions used by `backend/api/index.ts` and `backend/api/[...route].ts`
- `backend/render.yaml` is included for Render free-tier deployment of the Express server
- `backend/Dockerfile` is included for hosts that prefer container deployment
- if deploying on Vercel, deploy the `backend/` directory as a separate Vercel project and set the same backend env vars there`r`n- runtime bootstrap on Vercel now only configures providers and connects Mongo; seeding is a separate one-time script
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

## Testing Notes
Current automated coverage includes:
- domain logic tests
- auth session and password reset service tests
- billing mock activation and cancellation tests
- draw publish and winner allocation tests
- winner review and payout tests
- route-level integration tests for validation, auth, authorization, subscription gating, draw operations, health checks, CORS, and 404 responses
- dashboard analytics aggregation tests

## Notes
- If Razorpay is not configured, subscription and donation checkout fall back to zero-cost demo handling.
- Winner proof submission supports signed Cloudinary uploads when credentials are configured, with a backup URL field for demo mode.
- Draw publication is admin-triggered and monthly.
- Frontend and backend can now be deployed separately.
- Auth supports rotating refresh tokens plus forgot/reset password flows.
- In demo mode, forgot-password returns a reset token in the API response and logs the event so the flow works before email provider setup.
- Notification logs now persist delivery metadata like recipient, provider, subject, send status, and failure reason.
- Email templates use a branded HTML layout with CTA blocks and richer operational metadata for draw, subscription, password, and winner events.
- Admin analytics surface subscription counts, donation splits, payout totals, notification health, and the latest published draw summary.







