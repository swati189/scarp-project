# 🗓️ Discado — 90-Day Industry-Level Roadmap
### From Prototype → Tested → Play Store Live

**Project:** Discado (Location-based Coupon & Discount Discovery Platform)  
**Stack:** React Native 0.83 (Mobile) + Next.js 15 (Admin Panel) + Node.js/Express (API) + MongoDB  
**Start Date:** April 1, 2026 | **Target Launch Date:** June 30, 2026  
**Daily Commitment:** 4–6 hours/day

---

## 📊 Executive Status (As of Day 0)

| Component | Current State | Target State |
|---|---|---|
| **API Backend** | ✅ 51 routes, 45 models, security basics | ✅ Fully tested, payment live, cloud storage |
| **Mobile App** | ⚠️ Navigation & shells only, no API connected | ✅ All screens live, QR redemption, Play Store |
| **Admin Panel** | ⚠️ 32 pages scaffolded, no real CRUD | ✅ Full CRUD, charts, working dashboard |
| **DevOps** | ❌ None (manual deployments) | ✅ Docker + CI/CD + Cloud + Monitoring |
| **Testing** | ❌ Zero test coverage | ✅ 80%+ test coverage |
| **Payments** | ❌ Models exist, no gateway | ✅ Razorpay integrated + webhooks |
| **Play Store** | ❌ Not submitted | ✅ Live on Google Play |

---

## 🏗️ PHASE 1 — Foundation & DevOps (Days 1–20)

> **Goal:** Make the platform deployable, monitored, and cloud-ready before writing any new features.

---

### 📅 Week 1 (Days 1–7): Backend Hardening

#### Day 1 — Environment & Security Cleanup
- [ ] Remove `debugRoutes.js` from `app.js` (currently exposed in production — critical security bug)
- [ ] Move all `.env` secrets to a `.env.vault` or AWS Secrets Manager structure
- [ ] Audit `ALLOWED_ORIGINS` in `app.js` CORS config — add production domain `discado.in`  
- [ ] Add `NODE_ENV=production` guard around `debugRoutes`
- [ ] Create `.env.production`, `.env.staging`, `.env.development` templates

**Files to edit:**
- `API/src/app.js` — remove debug route line 189
- `API/.env.example` — add all required vars with descriptions

#### Day 2 — Cloud Image Storage (AWS S3 Migration)
- [ ] Install `@aws-sdk/client-s3`, `multer-s3`
- [ ] Create `src/services/storageService.js` — S3 upload/delete wrapper
- [ ] Replace all `multer` local upload middleware with S3 middleware
- [ ] Migrate existing `uploads/` folder assets to S3 bucket
- [ ] Update all API routes that serve image URLs to serve S3 CDN URLs
- [ ] Add CloudFront distribution in front of S3 bucket

**Affected files:** `bannerRoutes.js`, `brandRoutes.js`, `couponRoutes.js`, `outletRoutes.js`, `mediaRoutes.js`

#### Day 3 — Error Monitoring (Sentry)
- [ ] Create Sentry project (Node.js + React Native + Next.js — one org, three projects)
- [ ] `npm install @sentry/node` in API — add to `server.js` before routes
- [ ] `npm install @sentry/react-native` in APP — wrap `App.tsx`
- [ ] `npm install @sentry/nextjs` in admin-panel — run `npx @sentry/wizard`
- [ ] Configure source maps upload in CI pipeline
- [ ] Test Sentry with a manual `throw new Error('Sentry test')`

#### Day 4 — Structured Logging (Winston Enhancement)
- [ ] Enhance `winston` logger in API to log to daily rotating files + console
- [ ] Add `requestLogger` middleware for production (currently only dev)
- [ ] Add correlation IDs to all requests (UUID per request for tracing)
- [ ] Set up log levels: error, warn, info, http, debug

#### Day 5 — Redis Caching Layer
- [ ] Install `ioredis` in API
- [ ] Create `src/services/cacheService.js` — get/set/delete/invalidate wrappers
- [ ] Add Redis to cache: dashboard stats, category lists, popular coupons, city/area lists
- [ ] Add cache invalidation when admin updates categories/coupons/brands
- [ ] Use `redis://localhost:6379` locally, `REDIS_URL` env var for production

#### Day 6 — Docker Setup
- [ ] Create `API/Dockerfile` (multi-stage: build → production Node image)
- [ ] Create `APP/` — not dockerized (React Native builds differently)
- [ ] Create `admin-panel/Dockerfile` (Next.js standalone output)
- [ ] Create root `docker-compose.yml` with services: `api`, `admin`, `mongodb`, `redis`, `nginx`
- [ ] Create `nginx/default.conf` — proxy `api.discado.in` → API, `admin.discado.in` → admin-panel
- [ ] Test: `docker-compose up` — verify all services communicate

#### Day 7 — CI/CD Pipeline (GitHub Actions)
- [ ] Create `.github/workflows/api-deploy.yml`
  - Trigger: push to `main` branch
  - Steps: Checkout → Install → Lint → Test → Docker Build → Push to Registry → SSH Deploy
- [ ] Create `.github/workflows/admin-deploy.yml` (same pattern for Next.js)
- [ ] Create `.github/workflows/mobile-build.yml` (Gradle build + APK artifact)
- [ ] Add GitHub Secrets: `SSH_KEY`, `AWS_ACCESS_KEY`, `SENTRY_AUTH_TOKEN`, etc.
- [ ] Test pipeline with a dummy commit

---

### 📅 Week 2 (Days 8–14): Payment Gateway + API Completion

#### Day 8 — Razorpay Integration (Subscriptions)
- [ ] Sign up for Razorpay test account → get test key/secret
- [ ] `npm install razorpay` in API
- [ ] Create `src/services/paymentService.js` — create order, verify signature, refund
- [ ] Add `POST /api/v1/mobile/subscriptions/create-order` route
- [ ] Add `POST /api/v1/mobile/subscriptions/verify-payment` route with HMAC verification
- [ ] On success: activate `UserSubscription` model, send confirmation email via Nodemailer
- [ ] Add Razorpay webhook route `POST /api/v1/webhooks/razorpay` — handle `payment.captured`, `payment.failed`
- [ ] Store transaction in `Transaction` model with all details

#### Day 9 — Razorpay in Mobile App
- [ ] Install `react-native-razorpay` package
- [ ] Create `APP/src/screens/subscription/PlansScreen.js` — show Free/Premium/Enterprise plans with prices
- [ ] Implement checkout flow: select plan → call API create-order → open Razorpay SDK → verify
- [ ] Show success/failure states with proper UI
- [ ] Connect to `UserSubscription` status polling

#### Day 10 — QR Code Redemption System
- [ ] Install `react-native-qrcode-svg` and `react-native-camera` (or `expo-camera` equivalent)
- [ ] Create `APP/src/screens/coupons/RedeemScreen.js` — show QR code for outlet staff to scan
- [ ] Create `APP/src/screens/outlets/ScanRedeemScreen.js` — outlet staff scanner screen
- [ ] API: Add `POST /api/v1/mobile/coupons/redeem` — validate QR token, check expiry, mark redeemed in `CouponRedemption` model
- [ ] Add cooldown logic — prevent double redemption within 24 hours
- [ ] Update `RedemptionHistoryScreen.js` to show real data from API

#### Day 11 — Complete Auth Flows (Mobile)
- [ ] Audit `mobileAuthRoutes.js` (21KB — largest route file) — verify all endpoints work
- [ ] Test Phone OTP (`/mobile/auth/send-otp`) → `OTPVerificationScreen.js`  
- [ ] Implement profile setup save — `ProfileSetupScreen.js` → `PUT /mobile/auth/profile`
- [ ] Add token refresh logic in Axios interceptors (`APP/src/services/`)
- [ ] Handle expired token auto-logout
- [ ] Test onboarding → phone → OTP → profile → home flow end-to-end

#### Day 12 — Admin Panel: Auth & Dashboard
- [ ] Complete `admin-panel/src/app/login/` — full working login form → JWT stored in httpOnly cookie
- [ ] Complete `dashboard/page.tsx` (19KB scaffold) — connect real API endpoints:
  - Total users, active subscriptions, revenue today, total redemptions
  - Line chart: signups last 30 days (use Recharts or Chart.js)
  - Bar chart: redemptions by category
  - Top 5 performing coupons table
- [ ] Add real-time refresh interval (every 60 seconds)

#### Day 13 — Admin Panel: Users & Brands CRUD
- [ ] `dashboard/users/` — data table with search, filter, sort; view profile, suspend/activate
- [ ] `dashboard/mobile-users/` — separate mobile user management, subscription status badge
- [ ] `dashboard/brands/` — full CRUD: create brand with logo upload (S3), edit, delete, toggle active
- [ ] Universal data table component: pagination, column sorting, search, export CSV

#### Day 14 — Admin Panel: Categories & Coupons
- [ ] `dashboard/categories/` — tree view of categories + subcategories, drag to reorder
- [ ] `dashboard/subcategories/` — filter by parent category, CRUD
- [ ] `dashboard/coupons/` — full CRUD: create coupon with validity dates, category, brand, outlet, offer type
  - Rich text description editor
  - Image upload (S3)
  - Preview before publish
- [ ] `dashboard/banners/` — upload and manage home screen banners

---

### 📅 Week 3 (Days 15–20): Admin Panel Completion

#### Day 15 — Admin Panel: Outlets & Locations
- [ ] `dashboard/outlets/` — list with map preview, CRUD, GPS coordinate entry with Leaflet map click
- [ ] `dashboard/locations/` — manage Countries → States → Cities → Areas hierarchy
- [ ] `dashboard/areas/` — link areas to cities, assign to outlets

#### Day 16 — Admin Panel: Subscriptions & Revenue
- [ ] `dashboard/pricing/` — manage subscription plan pricing (Free/Premium/Enterprise)
- [ ] `dashboard/subscribers/` — all active subscribers, plan type, expiry, payment history
- [ ] `dashboard/transactions/` — Razorpay transaction log, status, refund button
- [ ] Revenue analytics chart — monthly recurring revenue (MRR) graph

#### Day 17 — Admin Panel: Notifications & Content
- [ ] `dashboard/notifications/` — compose and send push notification to all users / specific segment
  - Use Firebase Cloud Messaging via `/api/v1/notifications/send` API route
- [ ] `dashboard/mobile-notifications/` — history of sent notifications with open rates
- [ ] `dashboard/settings/` — global platform settings: maintenance mode toggle, feature flags

#### Day 18 — Admin Panel: Reports & Analytics
- [ ] `dashboard/analytics/` — full analytics dashboard:
  - Coupon views vs. redemptions funnel
  - User retention (Day 1, Day 7, Day 30)
  - Top cities by engagement
- [ ] `dashboard/reports/` — exportable reports (CSV/PDF) for subscriptions, redemptions, revenue
- [ ] `dashboard/audit-tracker/` — connect to `AuditLog` model, show admin action history

#### Day 19 — Admin Panel: Access Control
- [ ] `dashboard/admin-users/` — create sub-admins with roles (superadmin, editor, moderator)
- [ ] `dashboard/permissions/` — manage permission matrix per role
- [ ] `dashboard/account/page.tsx` — fix current open file: profile form, password change, 2FA toggle

#### Day 20 — Admin Panel: Reviews, Vouchers & Festivals
- [ ] `dashboard/reviews/` — user review moderation, approve/reject/delete
- [ ] `dashboard/vouchers/` — create special voucher codes for campaigns
- [ ] `dashboard/festivals/` — seasonal theme management
- [ ] `dashboard/devices/` — list registered devices, push test notification to device

---

## 🎯 PHASE 1 CHECKPOINT (End of Day 20)
> **Success Criteria:**
> - [ ] App deployable via `docker-compose up` 
> - [ ] CI/CD pipeline green on every push
> - [ ] Images served from AWS S3/CloudFront
> - [ ] Sentry capturing errors in all 3 components
> - [ ] Razorpay payments working in test mode
> - [ ] Admin panel has full CRUD for all 32 sections
> - [ ] Redis caching reducing DB load on popular queries

---

## 🚀 PHASE 2 — Mobile App Completion (Days 21–50)

> **Goal:** Every screen in the mobile app is pixel-perfect, connected to the API, and working.

---

### 📅 Week 4 (Days 21–27): Home & Discovery Screens

#### Day 21 — HomeScreen Full Rebuild
**File:** `APP/src/screens/home/HomeScreen.js` (14KB — partially done)
- [ ] Connect to `GET /api/v1/mobile/coupons` — featured coupons horizontal scroll
- [ ] Connect to `GET /api/v1/mobile/categories` — category pills filter
- [ ] Add location permission request → send lat/long → get nearby coupons
- [ ] Pull-to-refresh functionality
- [ ] Skeleton loading states (no blank screens while loading)
- [ ] Empty state illustration when no coupons nearby

#### Day 22 — SearchScreen Enhancement
**File:** `APP/src/screens/home/SearchScreen.js` (7KB)
- [ ] Real-time search with 300ms debounce → `GET /api/v1/mobile/search?q=`
- [ ] Recent searches stored in AsyncStorage
- [ ] Filter pills: Category, City, Distance radius, Discount %
- [ ] Voice search button (React Native Voice library)
- [ ] Search results show coupon cards with save button

#### Day 23 — CouponsScreen & Filtering
**File:** `APP/src/screens/coupons/CouponsScreen.js` (10KB)
- [ ] Paginated list with infinite scroll (load more on bottom)
- [ ] Sort: Newest, Expiring Soon, Highest Discount, Most Popular
- [ ] Filter drawer: Category multiselect, Brand multiselect, Offer type
- [ ] Active filters chips display with clear individual/all

#### Day 24 — CouponDetailScreen Full Implementation
**File:** `APP/src/screens/coupons/CouponDetailScreen.js` (10KB — partially done)
- [ ] Full coupon info: image, title, description, brand logo, validity, T&C
- [ ] "Save Coupon" button → `POST /mobile/coupons/save`
- [ ] "Redeem Now" button → navigate to `RedeemScreen` with QR
- [ ] "Get Directions" → launch Google Maps with outlet GPS
- [ ] Share coupon functionality (React Native Share)
- [ ] Related coupons from same brand at bottom

#### Day 25 — SavedCouponsScreen
**File:** `APP/src/screens/coupons/SavedCouponsScreen.js` (6KB)
- [ ] List saved coupons from `GET /mobile/coupons/saved`
- [ ] Pull to refresh
- [ ] Swipe left to unsave (with undo toast)
- [ ] Sort by: Date Saved, Expiring Soon
- [ ] Empty state with CTA to browse coupons

#### Day 26 — OutletDetailScreen
**File:** `APP/src/screens/outlets/OutletDetailScreen.js` (new file)
- [ ] Outlet info: name, address, phone, hours, map with pin
- [ ] All coupons available at this outlet
- [ ] Reviews section (stars, comments) from `Review` model
- [ ] Write review form (star rating + text)
- [ ] "Get Directions" CTA

#### Day 27 — NotificationsScreen
**File:** `APP/src/screens/home/NotificationsScreen.js` (4KB)
- [ ] Fetch from `GET /mobile/notifications`
- [ ] Mark as read on tap
- [ ] Different notification types: coupon, system, referral, subscription
- [ ] Notification icon badge count (unread count)
- [ ] Empty state

---

### 📅 Week 5 (Days 28–34): Profile & Subscription Screens

#### Day 28 — ProfileScreen
**File:** `APP/src/screens/profile/ProfileScreen.js` (7KB)
- [ ] Show: name, phone, avatar, subscription badge (Premium/Free)
- [ ] Stats: coupons saved, coupons redeemed, referral count
- [ ] Quick links: Edit Profile, Redemption History, Subscription, Settings, Support

#### Day 29 — EditProfileScreen
**File:** `APP/src/screens/profile/EditProfileScreen.js` (4KB)
- [ ] Avatar upload with image picker → S3 upload API
- [ ] Edit: name, email (optional), date of birth, gender
- [ ] Connect to `PUT /mobile/auth/profile`
- [ ] Form validation with react-hook-form
- [ ] Success toast on save

#### Day 30 — RedemptionHistoryScreen
**File:** `APP/src/screens/profile/RedemptionHistoryScreen.js` (5KB)
- [ ] Fetch from `GET /mobile/coupons/redemption-history`
- [ ] Show: coupon name, brand, outlet, date, discount amount saved
- [ ] Filter by: This Week, This Month, All Time
- [ ] Total savings summary at top

#### Day 31 — SettingsScreen
**File:** `APP/src/screens/profile/SettingsScreen.js` (4KB)
- [ ] Notification preferences (push, email)
- [ ] Location permission toggle
- [ ] Language selection
- [ ] Delete account (with confirmation) → `DELETE /mobile/auth/account`
- [ ] Logout → clear tokens + navigate to auth
- [ ] Links: Privacy Policy, Terms of Service, About, Help Center

#### Day 32 — SubscriptionPlansScreen
**File:** `APP/src/screens/subscription/PlansScreen.js`
- [ ] Fetch plans from `GET /mobile/subscriptions/plans`
- [ ] Beautiful cards for Free / Premium / Enterprise with feature comparison
- [ ] Current plan highlighted
- [ ] "Upgrade" button → Razorpay checkout
- [ ] Annual vs Monthly toggle with discount display
- [ ] Benefits: exclusive coupons, QR redeems/month limits, offline access

#### Day 33 — Referral System Screen
- [ ] New screen: `APP/src/screens/profile/ReferralScreen.js`
- [ ] Show referral code (from `User` model)
- [ ] Copy code button + Share button
- [ ] How it works: earn ₹X per referral
- [ ] Referral leaderboard (top referrers)
- [ ] Earned credits from `ReferralWallet` model

#### Day 34 — Help & Support Screen
- [ ] New screen: `APP/src/screens/profile/HelpScreen.js`
- [ ] FAQ accordion (expandable questions)
- [ ] Contact support: email / WhatsApp link
- [ ] Report a bug → opens email pre-filled
- [ ] Rate app → opens Play Store listing

---

### 📅 Week 6 (Days 35–41): UI Polish & Performance

#### Day 35 — Design System Consolidation
- [ ] Create `APP/src/theme/` folder: `colors.ts`, `typography.ts`, `spacing.ts`, `shadows.ts`
- [ ] Ensure all screens use theme tokens (no hardcoded colors)
- [ ] Create `APP/src/components/ui/` shared components: Button, Card, Badge, Avatar, Skeleton, Toast
- [ ] Standardize all font sizes using React Native font scaling

#### Day 36 — Animations & Micro-interactions
- [ ] Add `react-native-reanimated` if not present
- [ ] HomeScreen: animated header hide on scroll
- [ ] Coupon save button: heart animation with haptic feedback
- [ ] Tab bar: animated icon transitions
- [ ] Pull-to-refresh: custom spinner matching brand colors
- [ ] Screen transitions: smooth slide animations

#### Day 37 — Offline Support (React Native NetInfo)
- [ ] Detect online/offline status with `@react-native-community/netinfo`
- [ ] Show "No internet connection" banner
- [ ] Cache last viewed coupons in AsyncStorage for offline viewing
- [ ] Queue redemption requests when offline, sync on reconnect

#### Day 38 — Push Notifications Setup
- [ ] Request notification permissions on first launch (iOS)
- [ ] Register FCM device token → `POST /mobile/notifications/register-device`
- [ ] Handle notification received while app in foreground (in-app banner)
- [ ] Handle notification tap → deep link to correct screen
- [ ] Handle background notification (update badge count)

#### Day 39 — Deep Linking
- [ ] Configure `discado://` scheme in Android `AndroidManifest.xml`
- [ ] Configure Universal Links for `discado.in` domain
- [ ] Deep link routes: `discado://coupon/123`, `discado://outlet/456`, `discado://subscription`
- [ ] Test from terminal: `adb shell am start -d discado://coupon/123`

#### Day 40 — Accessibility (a11y)
- [ ] Add `accessibilityLabel` to all interactive elements
- [ ] Ensure minimum touch target size (44x44dp) for all buttons
- [ ] Add `accessible={true}` to images with alt text
- [ ] Test with TalkBack (Android accessibility)
- [ ] Light/Dark mode detection (`useColorScheme`)

#### Day 41 — Onboarding & Splash Polish
- [ ] `OnboardingScreen.js` — 3-slide animated onboarding carousel
  - Slide 1: "Discover Deals Near You"
  - Slide 2: "Save & Redeem with QR"
  - Slide 3: "Earn with Referrals"
- [ ] `SplashScreen.js` — animated Discado logo with lottie animation
- [ ] Skip onboarding if already seen (AsyncStorage flag)
- [ ] App icon — finalize 512x512 icon, generate all required sizes

---

### 📅 Week 7 (Days 42–50): API Integration Polish

#### Day 42–43 — Axios Service Layer
- [ ] Create `APP/src/services/api.ts` — centralized Axios instance
- [ ] Add request interceptor: attach JWT `Authorization: Bearer <token>`
- [ ] Add response interceptor: handle 401 (refresh token or logout), 429 (rate limit warning)
- [ ] Create service files: `couponService.ts`, `authService.ts`, `profileService.ts`, `subscriptionService.ts`
- [ ] Replace all direct `axios.get()` calls in screens with service functions

#### Day 44–45 — State Management
- [ ] Evaluate current `APP/src/context/` — ensure auth context, user context work
- [ ] Add `coupon context` for saved coupons (to sync across screens without API re-calls)
- [ ] Add notification badge count in context (update globally on fetch)
- [ ] Consider `React Query` / `Zustand` for server-state caching if needed

#### Day 46–47 — Error Handling UX
- [ ] Global error boundary component for screen crashes
- [ ] API error → user-friendly message mapping (not raw "500 Internal Server Error")
- [ ] Network timeout → "Slow connection, please wait" UI
- [ ] Add retry button on failed API calls

#### Day 48–49 — Performance Optimization
- [ ] Implement `FlatList` virtualization correctly on all list screens
- [ ] Add `memo()` to all coupon card components (prevent re-render)
- [ ] Lazy load images with `FastImage` (`react-native-fast-image`)
- [ ] Reduce bundle size: analyze with `react-native-bundle-visualizer`
- [ ] Enable Hermes engine (already supported in RN 0.83)

#### Day 50 — Android Build Testing
- [ ] Generate signed APK: `./gradlew assembleRelease`
- [ ] Test on 3 physical Android devices (low-end, mid, flagship)
- [ ] Test on Android 10, 12, 14
- [ ] Fix any device-specific layout issues
- [ ] Fix any permissions issues (camera, location, notifications)

---

## 🎯 PHASE 2 CHECKPOINT (End of Day 50)
> **Success Criteria:**
> - [ ] All 15+ mobile screens are functional with real API data
> - [ ] Razorpay payment works (test mode)
> - [ ] QR code generation and redemption works end-to-end
> - [ ] App runs smoothly on Android 10+ devices
> - [ ] No crashes in 30-minute demo session

---

## 🧪 PHASE 3 — Testing & Quality Assurance (Days 51–70)

> **Goal:** 80%+ test coverage, zero critical bugs, performance validated.

---

### 📅 Week 8 (Days 51–57): API Unit & Integration Tests

#### Day 51–52 — API Test Setup
- [ ] Install: `jest`, `supertest`, `@types/jest`, `mongodb-memory-server`
- [ ] Create `API/src/__tests__/` folder structure
- [ ] `jest.config.js` — configure for Node.js, set timeout to 30s for DB tests
- [ ] Create `API/src/__tests__/helpers/setup.js` — connect in-memory MongoDB before tests
- [ ] Create `API/src/__tests__/helpers/fixtures.js` — seed test data (users, coupons, plans)

#### Day 53 — Auth Routes Tests
```js
// Tests for mobileAuthRoutes.js and authRoutes.js
- POST /mobile/auth/send-otp → returns 200 with message
- POST /mobile/auth/verify-otp → invalid OTP returns 400
- POST /mobile/auth/verify-otp → valid OTP returns JWT token
- POST /auth/login → admin login with correct credentials
- POST /auth/login → wrong password returns 401
- Protected route without token → 401
- Protected route with expired token → 401
```

#### Day 54 — Coupon & Payment Routes Tests
```js
// Tests for mobileCouponRoutes.js, mobileSubscriptionRoutes.js
- GET /mobile/coupons → returns paginated list
- GET /mobile/coupons/:id → returns coupon detail
- POST /mobile/coupons/save → saves coupon to user favorites
- POST /mobile/coupons/redeem → marks coupon as redeemed
- POST /mobile/subscriptions/create-order → returns Razorpay order
- POST /mobile/subscriptions/verify-payment → valid signature activates subscription
- POST /mobile/subscriptions/verify-payment → invalid signature returns 400
```

#### Day 55 — Controller & Service Unit Tests
```js
// Test business logic in isolation
- cacheService: set/get/delete/invalidation
- paymentService: order creation, signature verification
- storageService: S3 upload/delete mocks
- User model: password hashing, JWT generation
```

#### Day 56–57 — Admin Routes Tests
```js
// Tests for admin panel API
- GET /brands → returns brands list (requires admin JWT)
- POST /brands → creates brand with valid data
- PUT /brands/:id → updates brand
- DELETE /brands/:id → soft deletes brand
- GET /dashboard/stats → returns all stat numbers
- POST /coupons → validates required fields
```

---

### 📅 Week 9 (Days 58–64): Mobile App Testing

#### Day 58–59 — React Native Testing Library Setup
- [ ] Install: `@testing-library/react-native`, `@testing-library/jest-native`
- [ ] Mock: navigation, AsyncStorage, axios, firebase
- [ ] Create `APP/src/__tests__/` folder with screen test files

#### Day 60 — Auth Screen Tests
```js
// PhoneInputScreen, OTPVerificationScreen
- Renders phone input correctly
- Shows error on invalid phone number (< 10 digits)
- OTP screen shows 6 input boxes
- Auto-submits when all 6 digits entered
- Loading state shown during API call
```

#### Day 61 — Coupon Screen Tests
```js
// HomeScreen, CouponsScreen, CouponDetailScreen
- HomeScreen renders skeleton while loading
- HomeScreen shows coupon cards after load
- CouponDetailScreen shows all coupon fields
- Save button calls correct API
- Redeem button navigates to RedeemScreen
```

#### Day 62 — End-to-End Testing Setup (Detox)
- [ ] Install `detox` framework for Android
- [ ] Configure Detox with Jest runner
- [ ] Create E2E test: full onboarding → OTP → home → find coupon → save
- [ ] Create E2E test: subscription purchase flow
- [ ] Run E2E on Android emulator

#### Day 63 — Admin Panel Testing (Playwright)
- [ ] Install Playwright: `npx playwright install`
- [ ] Create `admin-panel/tests/` folder
- [ ] E2E test: Login → view dashboard stats → create coupon → publish
- [ ] E2E test: Create brand → upload logo → save → verify in list
- [ ] E2E test: Send push notification → verify in notification log

#### Day 64 — Load Testing (API)
- [ ] Install `k6` (load testing tool)
- [ ] Write load test script for home feed endpoint
- [ ] Simulate 100 concurrent users, ramp to 500
- [ ] Identify bottleneck endpoints (likely: search, coupon listing)
- [ ] Optimize with Redis caching where needed

---

### 📅 Week 10 (Days 65–70): Bug Fixing & Performance

#### Day 65–66 — QA Bug Bash
- [ ] Full manual regression test of all mobile screens (go through every flow)
- [ ] Full manual test of admin panel (every page)
- [ ] Document all bugs in GitHub Issues with priority (P0/P1/P2)
- [ ] Fix all P0 (crash) and P1 (broken flow) bugs

#### Day 67 — Security Audit
- [ ] Run `npm audit` on all three packages — fix critical vulnerabilities
- [ ] Test for SQL/NoSQL injection on API endpoints
- [ ] Verify rate limiting is working (`express-rate-limit`)
- [ ] Check JWT expiry is enforced
- [ ] Verify Razorpay signature is always verified before activating subscription
- [ ] Ensure debug routes are NOT deployed to production server

#### Day 68 — Performance Profiling
- [ ] Use React Native Profiler — identify slow renders
- [ ] Use Chrome DevTools for API response times
- [ ] Ensure all images are compressed < 200KB before upload (sharp.js in API)
- [ ] Add HTTP/2 support via Nginx config

#### Day 69–70 — Final Bug Fixes + Regression
- [ ] Fix all P2 bugs from Day 65-66 bug bash
- [ ] Final Sentry check — zero new errors in 48-hour window
- [ ] All CI/CD pipelines passing green
- [ ] Test Razorpay in LIVE mode (with ₹1 test transaction)

---

## 🎯 PHASE 3 CHECKPOINT (End of Day 70)
> **Success Criteria:**
> - [ ] API test coverage ≥ 80%
> - [ ] Mobile app tests cover all primary user flows
> - [ ] Admin panel E2E tests passing
> - [ ] Load test: API handles 500+ concurrent users without errors
> - [ ] Zero security vulnerabilities (critical/high severity)
> - [ ] Razorpay LIVE mode transaction successful

---

## 📱 PHASE 4 — Play Store Launch Preparation (Days 71–84)

> **Goal:** Meet all Google Play requirements and submit for review.

---

### 📅 Week 11 (Days 71–77): Legal, Store Assets & Production

#### Day 71 — Privacy Policy & Terms of Service
- [ ] Write **Privacy Policy** covering:
  - What data is collected (phone number, location, payment)
  - How it is used
  - Third-party services (Firebase, Razorpay, Sentry)
  - Data retention
  - User rights (delete account)
  - Contact email for data requests
- [ ] Write **Terms of Service** covering:
  - Platform usage rules
  - Coupon validity & outlet responsibility
  - Subscription terms & refund policy
  - Prohibited activities
- [ ] Host both on `discado.in/privacy-policy` and `discado.in/terms-of-service`
- [ ] Link both in `SettingsScreen.js` in the app
- [ ] This is **MANDATORY** for Play Store — without it, your app will be rejected

#### Day 72 — Google Play Developer Account Setup
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Set up merchant account for in-app purchases (Razorpay + Google Play Billing)
- [ ] Create app listing in Play Console
- [ ] Fill in: App name "Discado", short description (80 chars), full description (4000 chars)
- [ ] Choose categories: Shopping > Deals & Coupons
- [ ] Set content rating: Everyone

#### Day 73 — Store Graphics & Screenshots
- [ ] Design **Feature Graphic** (1024x500px) — hero banner for Play Store
- [ ] Design **App Icon** final version (512x512px, no alpha channel)
- [ ] Take **Play Store Screenshots** for all required sizes:
  - Phone: minimum 2, up to 8 screenshots (1080x1920 or 1080x2340)
  - Show: Home screen, coupon detail, QR redeem, subscription plans, profile
- [ ] Optional: **Promotional Video** (30-120 seconds) — screen recording with narration

#### Day 74 — Production API Deployment
- [ ] Provision VPS (DigitalOcean, Linode, or AWS EC2 — ~$20/month)
- [ ] Install Docker, Nginx, Certbot (HTTPS) on server
- [ ] Deploy via CI/CD pipeline to production server
- [ ] Point `api.discado.in` and `admin.discado.in` DNS to server IP
- [ ] Install SSL certificate with Certbot (HTTPS is mandatory for production)
- [ ] Smoke test: All endpoints returning correct responses

#### Day 75 — Switch App to Production API
- [ ] Update `APP/.env` — `BASE_URL=https://api.discado.in/api/v1`
- [ ] Update Firebase config to production project
- [ ] Update Razorpay to LIVE KEY (not test)
- [ ] Update Sentry DSN to production project
- [ ] Test full payment flow in production environment with real ₹1 transactions

#### Day 76 — Generate Production APK / AAB
- [ ] Generate keystore file (keep SAFE — losing it means you can never update your app):
  ```bash
  keytool -genkey -v -keystore discado-release-key.jks -alias discado -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] Configure `android/app/build.gradle` with signing config
- [ ] Build release AAB (Android App Bundle — smaller, required by Play Store):
  ```bash
  cd android && ./gradlew bundleRelease
  ```
- [ ] Verify AAB: `bundletool build-apks --bundle=app-release.aab --output=test.apks`
- [ ] Test APK on 3 physical devices — no debug logs, no test data

#### Day 77 — Pre-Submission Checklist
- [ ] `debugRoutes.js` NOT included in production (verify on live server)
- [ ] All hardcoded test values removed (no "test coupon", no test phone numbers)
- [ ] App starts and all flows work on production API
- [ ] Privacy Policy URL accessible and not 404
- [ ] Minimum Android SDK version set to 26 (Android 8.0) — covers 95%+ devices
- [ ] `android:allowBackup` set appropriately in `AndroidManifest.xml`
- [ ] ProGuard / R8 minification enabled for release builds

---

### 📅 Week 12 (Days 78–84): Play Store Submission

#### Day 78 — Upload to Play Console
- [ ] Upload AAB to Play Console → Internal Testing track first
- [ ] Fill in: What's new (release notes), rollout percentage
- [ ] Add testers (internal email list — yourself + team)
- [ ] Submit for Internal Testing review (usually approved in < 1 hour)

#### Day 79–80 — Internal Testing Phase
- [ ] Download app from Play Store (internal track) on 5+ devices
- [ ] Test every flow: auth, browse, save, redeem, subscribe, profile
- [ ] Fix any issues found — rebuild AAB — re-upload
- [ ] Verify Razorpay live payment works through Play Store install

#### Day 81 — Move to Production Track
- [ ] In Play Console: Create new release → Production track
- [ ] Add release notes:
  ```
  🎉 Welcome to Discado v1.0!
  • Discover coupons near you
  • Redeem with QR code
  • Premium subscription with exclusive deals
  • Referral rewards program
  ```
- [ ] Submit for Google Play review
- [ ] Average review time: 3–7 business days

#### Day 82–84 — Review Period Buffer
- [ ] Monitor Play Console for any policy violation warnings
- [ ] Respond immediately if Google requests changes
- [ ] Common rejection reasons — be prepared:
  - Missing Privacy Policy → Already done Day 71 ✅
  - Permissions overuse → Only request camera for QR, location for nearby coupons ✅
  - Malware flags → ProGuard/R8 enabled ✅
  - Metadata mismatch → Ensure screenshots match actual app ✅

---

## 🏁 PHASE 5 — Post-Launch (Days 85–90)

#### Day 85 — Play Store Live! 🎉
- [ ] Announce on social media
- [ ] Share app link: `play.google.com/store/apps/details?id=com.discado.mobile`
- [ ] Send referral links to first 100 beta users
- [ ] Monitor Sentry for any production crashes

#### Day 86 — User Feedback Monitoring
- [ ] Set up Play Console rating alerts — email on every new review
- [ ] Monitor first crash reports in Sentry
- [ ] Fix any P0 crashes → push emergency update within 24 hours
- [ ] Monitor Razorpay dashboard for payment success rate

#### Day 87–88 — Hotfix Process
- [ ] Document hotfix SOP: fix in branch → test → release to Internal → Production rollout
- [ ] Ensure CI/CD can push hotfix within 2 hours of bug discovery
- [ ] Set up PagerDuty or similar on-call alerts for API downtime

#### Day 89 — Admin Panel Production Launch
- [ ] Make admin panel publicly accessible at `admin.discado.in`
- [ ] Create first real admin user with secure password
- [ ] Add first real brands, outlets, and coupons (at least 20 coupons for launch)
- [ ] Test admin → publish coupon → appears in mobile app within 30 seconds

#### Day 90 — Retrospective & v1.1 Planning
- [ ] Review: what was on time, what was delayed, and why
- [ ] Analytics: first week users, signups, retention rate, payment conversion
- [ ] Plan v1.1 features based on user feedback:
  - iOS App Store submission
  - Wallet / in-app currency
  - Brand-side portal (brands manage their own coupons)
  - Geofencing notifications

---

## 🎯 FINAL LAUNCH CHECKLIST (Day 90)
**All boxes must be ✅ before considering the project LIVE:**

### Backend / API
- [ ] Deployed on production server with HTTPS
- [ ] CI/CD pipeline auto-deploys on `main` push
- [ ] Sentry monitoring active — zero critical errors in 72 hours
- [ ] Redis caching operational
- [ ] AWS S3 storing all images
- [ ] `debugRoutes.js` confirmed NOT accessible at production URL
- [ ] Rate limiting active (tested with burst requests)
- [ ] Razorpay LIVE mode — transactions completing successfully

### Mobile App
- [ ] All 15+ screens working with production API
- [ ] QR code generation and redemption verified end-to-end
- [ ] Push notifications working (FCM)
- [ ] Deep links working (`discado://`)
- [ ] Offline mode graceful degradation
- [ ] App signed with production keystore (keystore file backed up safely)
- [ ] ProGuard/R8 enabled — no debug code in release build
- [ ] Tested on Android 10, 12, 14 — no crashes

### Play Store
- [ ] App live on Google Play Store in India
- [ ] Correct app icon, screenshots, feature graphic
- [ ] Privacy Policy linked in app AND on Play Store listing
- [ ] Content rating filled
- [ ] Internal testing passed
- [ ] Production AAB uploaded from CI/CD (reproducible build)

### Admin Panel
- [ ] Deployed at `admin.discado.in` with HTTPS
- [ ] All 32 dashboard sections functional
- [ ] First admin user created
- [ ] At least 20 live coupons in the system
- [ ] Analytics charts showing data

### Legal
- [ ] Privacy Policy hosted at `discado.in/privacy-policy`
- [ ] Terms of Service hosted at `discado.in/terms-of-service`
- [ ] Refund policy documented

---

## 📈 Key Daily Milestones Summary

| Day | Milestone |
|---|---|
| **Day 1** | Debug routes removed, security hardened |
| **Day 2** | Images serving from AWS S3 (not local folder) |
| **Day 3** | Sentry catching errors in all 3 apps |
| **Day 5** | Redis caching live |
| **Day 7** | First CI/CD pipeline green |
| **Day 8** | Razorpay test payments working |
| **Day 10** | QR code redemption end-to-end |
| **Day 14** | Admin panel: users, brands, coupons CRUD done |
| **Day 20** | All 32 admin sections complete |
| **Day 27** | Home, Search, Coupons, Notifications screens live |
| **Day 34** | All profile/subscription/referral screens live |
| **Day 41** | Animations, offline mode, push notifications done |
| **Day 50** | Release APK tested on 3 physical devices |
| **Day 57** | API test coverage 80%+ |
| **Day 64** | E2E tests + load tests passing |
| **Day 70** | Zero P0 bugs, security audit passed |
| **Day 71** | Privacy Policy + Terms of Service written & hosted |
| **Day 76** | Production AAB (signed) built and verified |
| **Day 78** | App submitted to Google Play — Internal Testing |
| **Day 81** | Submitted to Production track |
| **Day 85** | 🚀 APP LIVE ON GOOGLE PLAY STORE |
| **Day 90** | v1.1 planning starts |

---

## 🔧 Tech Stack Decisions (Finalized)

| Decision | Choice | Reason |
|---|---|---|
| **Image CDN** | AWS S3 + CloudFront | Industry standard, best CDN coverage in India |
| **Error Monitoring** | Sentry | Supports Node, React Native, Next.js all in one org |
| **Caching** | Redis (ioredis) | Already in Docker compose, low latency |
| **Payment** | Razorpay | India-first, easy integration, supports UPI/cards/wallets |
| **CI/CD** | GitHub Actions | Free for public repos, integrates with Docker |
| **Containerization** | Docker Compose | Simple multi-service setup |
| **Hosting** | DigitalOcean Droplet | $20/mo, sufficient for MVP scale |
| **Mobile Testing** | Jest + RNTL + Detox | Industry standard for React Native |
| **API Testing** | Jest + Supertest | Best for Express.js |
| **E2E (Web)** | Playwright | Best DX, multi-browser |

---

## 💰 Estimated Infrastructure Cost (Monthly)

| Service | Cost/Month |
|---|---|
| DigitalOcean VPS (2vCPU, 4GB RAM) | $24 |
| AWS S3 (up to 10GB storage) | ~$2 |
| CloudFront CDN | ~$1 |
| Sentry (Free for 5k errors/month) | $0 |
| Redis (on same VPS) | $0 |
| MongoDB Atlas (Free tier) | $0 |
| Firebase (Spark plan) | $0 |
| **Total** | **~$27/month (~₹2,300/month)** |

---

## ⚠️ Top Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Google Play rejection | Follow checklist on Day 77 strictly; submit to Internal Testing first |
| Losing Android signing keystore | Backup to 2 secure locations (cloud + USB); no keystore = can't update app |
| Razorpay account delays | Apply for Razorpay business account NOW (takes 3-5 business days to verify) |
| S3 migration breaks existing images | Keep old uploads/ folder as fallback during migration |
| Scope creep | Lock MVP scope — defer iOS, web app, brand portal to v1.1 |
| Firebase OTP costs | Monitor usage; free quota is 10k/month then $0.006/verification |

---

*Roadmap prepared: March 31, 2026 | Version 1.0 | For: Discado Platform — Ujjwal Tiwari*
