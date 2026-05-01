# ByU Connect — Backend Specification (v1)

A student-to-student services directory for one campus. Every student gets a public, composable **Canvas** — a personal space with their projects, services, links, stories, and contact methods. Other students discover them via the directory and reach out off-platform.

**Stack:** Node.js, Express, MongoDB Atlas (Mongoose), Resend, Cloudinary, JWT auth.

**Domain:** `byu-connect.com`
**Canvas URL:** `byu-connect.com/[username]`
**Project URL:** `byu-connect.com/[username]/projects/[slug]`
**Story URL:** `byu-connect.com/[username]/stories/[slug]`

---

## 1. Product Recap

Every user has a **Canvas** — their public page, composed of sections they arrange via drag-and-drop:

- **Header** (fixed, always first) — avatar, name, bio, verified badge, "Reach out" button
- **Services** — what they offer
- **Projects** — case studies with cover, gallery, write-up, external links. Each has its own shareable subpage.
- **Links** — linktree-style buttons (YouTube, Substack, store, etc.)
- **Stories** — short markdown blog posts. Each has its own shareable subpage.
- **Resume** — single PDF, displayed as a card

The user controls section order (Header is locked first). Empty sections auto-hide on the public canvas.

"Reach out" pulls from a separate `ContactMethod` collection — WhatsApp, email, IG, etc. Modal opens, user picks a method, opens the relevant app or copies the value. No in-app messaging.

Two-tier verification: normal email = account works. Student email verified = "Verified" badge + boosted in discover.

---

## 2. Tech Stack & Dependencies

```
node               ≥ 20
express            ^4.x
mongoose           ^8.x
zod                ^3.x        validation
jsonwebtoken       ^9.x
bcrypt             ^5.x
cookie-parser      ^1.x
cors               ^2.x
helmet             ^7.x
express-rate-limit ^7.x
resend             ^3.x        emails
cloudinary         ^2.x        media
multer             ^1.x        multipart parsing
dotenv             ^16.x
pino + pino-http   logging
slugify            ^1.x        story/project slugs
sanitize-html      ^2.x        markdown safety
marked             ^12.x       markdown rendering
```

Dev: `typescript`, `ts-node-dev`, `eslint`, `prettier`, `vitest`, `supertest`.

---

## 3. Folder Structure (feature-first)

```
/src
  /config
    db.ts
    env.ts
    cloudinary.ts
    resend.ts
    constants.ts

  /features
    /auth
      auth.routes.ts
      auth.controller.ts
      auth.service.ts
      auth.schemas.ts
      auth.middleware.ts

    /profile
      profile.routes.ts
      profile.controller.ts
      profile.service.ts
      profile.schemas.ts
      profile.model.ts

    /canvas
      canvas.routes.ts
      canvas.controller.ts
      canvas.service.ts        → composes the public canvas response

    /services
      services.routes.ts
      services.controller.ts
      services.service.ts
      services.schemas.ts
      services.model.ts

    /projects
      projects.routes.ts
      projects.controller.ts
      projects.service.ts
      projects.schemas.ts
      projects.model.ts

    /links
      links.routes.ts
      links.controller.ts
      links.service.ts
      links.schemas.ts
      links.model.ts

    /stories
      stories.routes.ts
      stories.controller.ts
      stories.service.ts
      stories.schemas.ts
      stories.model.ts

    /contacts
      contacts.routes.ts
      contacts.controller.ts
      contacts.service.ts
      contacts.schemas.ts
      contacts.model.ts

    /resume
      resume.routes.ts
      resume.controller.ts
      resume.service.ts
      resume.model.ts

    /discovery
      discovery.routes.ts
      discovery.controller.ts
      discovery.service.ts
      discovery.schemas.ts

    /saved
      saved.routes.ts
      saved.controller.ts
      saved.service.ts
      saved.model.ts

    /verification
      verification.routes.ts
      verification.controller.ts
      verification.service.ts
      verification.schemas.ts
      otp.model.ts

    /moderation
      moderation.routes.ts
      moderation.controller.ts
      moderation.service.ts
      moderation.schemas.ts
      report.model.ts

    /analytics
      analytics.routes.ts
      analytics.controller.ts
      analytics.service.ts
      profileView.model.ts
      outreachClick.model.ts

    /admin
      admin.routes.ts
      admin.controller.ts
      admin.service.ts

    /upload
      upload.routes.ts
      upload.controller.ts
      upload.service.ts

    /og
      og.routes.ts
      og.controller.ts
      og.service.ts

  /models
    user.model.ts

  /middleware
    error.middleware.ts
    notFound.middleware.ts
    validate.middleware.ts
    rateLimit.middleware.ts
    asyncHandler.ts

  /lib
    apiError.ts
    apiResponse.ts
    logger.ts
    jwt.ts
    password.ts
    slug.ts
    completeness.ts
    pagination.ts
    markdown.ts                → sanitize + render
    contactNormalizer.ts

  /jobs
    cleanupExpiredOtps.ts

  /types
    express.d.ts

  app.ts
  server.ts
```

---

## 4. Environment Variables

```
NODE_ENV=development
PORT=4000
APP_URL=http://localhost:4000
WEB_URL=http://localhost:3000

MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=
EMAIL_FROM="ByU Connect <hello@byu-connect.com>"

STUDENT_EMAIL_DOMAIN=student.babcock.edu.ng

ADMIN_BOOTSTRAP_EMAIL=
```

Validate on boot with zod in `config/env.ts`. Crash fast if anything missing.

---

## 5. Data Models

All models use `{ timestamps: true }`.

### 5.1 User

```ts
{
  _id: ObjectId,
  email: string,                       // login, lowercase, unique
  passwordHash: string,
  role: "user" | "admin",
  isEmailVerified: boolean,

  studentEmail: string | null,         // lowercase, unique sparse
  studentEmailVerifiedAt: Date | null,

  refreshTokenHash: string | null,
  lastLoginAt: Date | null,

  isSuspended: boolean,
  suspendedReason: string | null,

  createdAt, updatedAt
}
```

Indexes: `email` unique, `studentEmail` unique sparse.
Virtual: `isVerified` → `!!studentEmailVerifiedAt`.

### 5.2 Profile

One per User. The Canvas is rendered from this + related collections.

```ts
{
  _id: ObjectId,
  userId: ObjectId (ref User, unique),
  username: string,                    // unique slug, 3–24 chars, [a-z0-9_-]
  fullName: string,
  avatarUrl: string | null,
  avatarPublicId: string | null,
  bio: string | null,                  // max 280
  department: string | null,
  year: number | null,                 // 1–7

  // Canvas layout — user-controlled section order
  canvasLayout: [
    "services" | "projects" | "links" | "stories" | "resume"
  ],
  // Header is always first, not stored.
  // Default on signup: ["services", "projects", "links", "stories", "resume"]

  // Canvas theming (kept minimal in v1)
  accentColor: string | null,          // hex, validated

  // Denormalized for discovery
  serviceCategories: string[],         // updated when services change

  isPublic: boolean,
  isFeatured: boolean,
  featuredAt: Date | null,
  featuredOrder: number | null,

  completenessScore: number,           // 0–100
  viewCount: number,
  lastActiveAt: Date,

  createdAt, updatedAt
}
```

Indexes: `username` unique, `userId` unique, `isFeatured + featuredOrder`, `serviceCategories`, text index on `fullName + bio + department`.

### 5.3 Service

```ts
{
  _id: ObjectId,
  profileId: ObjectId (ref Profile),
  category: enum,
  title: string,                       // max 80
  description: string,                 // max 500
  startingPrice: number | null,
  currency: "NGN" | "USD",
  isNegotiable: boolean,
  order: number,
  createdAt, updatedAt
}
```

Indexes: `profileId + order`, `category + createdAt`.
Limit: 12 services per profile.

### 5.4 Project

Case-study heavy. Has its own subpage.

```ts
{
  _id: ObjectId,
  profileId: ObjectId (ref Profile),
  slug: string,                        // unique within profile, [a-z0-9-]
  title: string,                       // max 100
  tagline: string | null,              // max 140, shown on canvas card
  description: string,                 // markdown, max 5000
  descriptionHtml: string,             // sanitized, rendered at write time
  coverUrl: string | null,
  coverPublicId: string | null,
  gallery: [
    {
      url: string,
      publicId: string,
      type: "image" | "video",
      caption: string | null
    }
  ],                                   // max 12 items
  links: [
    {
      label: string,
      url: string,
      type: "live" | "source" | "design" | "video" | "article" | "other"
    }
  ],                                   // max 6 links
  techStack: string[],                 // free-form tags, max 12
  order: number,
  isPublished: boolean,                // default true; false = draft

  createdAt, updatedAt
}
```

Indexes: `profileId + order`, compound unique `(profileId, slug)`.
Limit: 24 projects per profile.

### 5.5 Link

Linktree-style canvas buttons. Distinct from `ContactMethod`.

```ts
{
  _id: ObjectId,
  profileId: ObjectId (ref Profile),
  label: string,                       // max 60
  url: string,                         // valid URL with protocol
  iconKey: string | null,              // optional, frontend maps to icon set
  order: number,
  isActive: boolean,                   // soft-hide without deleting

  createdAt, updatedAt
}
```

Indexes: `profileId + order`. Limit: 20 links per profile.

### 5.6 Story

Lite blog. Markdown body. No comments, no reactions, no tags in v1.

```ts
{
  _id: ObjectId,
  profileId: ObjectId (ref Profile),
  slug: string,                        // unique within profile, [a-z0-9-]
  title: string,                       // max 120
  excerpt: string | null,              // max 200, auto-generated if null
  coverUrl: string | null,
  coverPublicId: string | null,
  body: string,                        // markdown, max 20000
  bodyHtml: string,                    // sanitized, rendered at write time
  readingTimeMinutes: number,          // computed at write time
  isPublished: boolean,
  publishedAt: Date | null,
  viewCount: number,

  createdAt, updatedAt
}
```

Indexes: `profileId + publishedAt desc`, compound unique `(profileId, slug)`.

**Why store both `body` and `bodyHtml`:** rendering markdown on every read is wasteful. Render + sanitize once at write time, cache the HTML. Re-render only when body changes. Use `marked` + `sanitize-html` with a strict allowlist.

### 5.7 ContactMethod

Powers the "Reach out" modal.

```ts
{
  _id: ObjectId,
  profileId: ObjectId (ref Profile),
  type: "whatsapp" | "email" | "instagram" | "x" | "linkedin"
      | "phone" | "website" | "tiktok" | "custom",
  value: string,                       // normalized in service layer
  label: string | null,                // for "custom" only
  order: number,
  isPrimary: boolean,                  // exactly one enforced

  createdAt, updatedAt
}
```

Indexes: `profileId + order`. Limit: 8 per profile.

### 5.8 Resume

```ts
{
  _id: ObjectId,
  profileId: ObjectId (ref Profile, unique),
  fileUrl: string,
  publicId: string,
  fileName: string,
  fileSize: number,
  uploadedAt: Date
}
```

PDF only, max 5 MB.

### 5.9 SavedProfile

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  profileId: ObjectId,
  createdAt
}
```

Compound unique: `(userId, profileId)`.

### 5.10 ProfileView

```ts
{
  _id: ObjectId,
  profileId: ObjectId,
  viewerId: ObjectId | null,
  viewerKey: string,                   // hash(ip + ua) for anon dedup
  source: "direct" | "discover" | "category" | "search" | "shared" | "featured",
  createdAt
}
```

Indexes: `profileId + createdAt`. TTL on `createdAt`: 90 days.

### 5.11 OutreachClick

```ts
{
  _id: ObjectId,
  profileId: ObjectId,
  contactType: string,
  viewerId: ObjectId | null,
  createdAt
}
```

Indexes: `profileId + createdAt`. TTL: 90 days.

### 5.12 Report

```ts
{
  _id: ObjectId,
  reporterId: ObjectId,
  targetProfileId: ObjectId,
  reason: "spam" | "inappropriate" | "impersonation" | "harassment" | "other",
  description: string | null,          // max 500
  status: "pending" | "reviewed" | "actioned" | "dismissed",
  reviewedBy: ObjectId | null,
  reviewedAt: Date | null,
  adminNote: string | null,

  createdAt, updatedAt
}
```

Indexes: `status + createdAt`.

### 5.13 Otp

```ts
{
  _id: ObjectId,
  userId: ObjectId,
  purpose: "verify_email" | "verify_student_email" | "reset_password",
  emailTarget: string,
  codeHash: string,
  attempts: number,                    // max 5
  expiresAt: Date,                     // 10 min
  consumedAt: Date | null,
  createdAt
}
```

Indexes: `userId + purpose`. TTL on `expiresAt`.

---

## 6. Constants

```ts
// config/constants.ts

export const SERVICE_CATEGORIES = [
  "design", "photography_video", "writing_editing",
  "tutoring_academic", "web_app_dev", "social_marketing",
  "hair_beauty", "fashion_tailoring", "music_audio",
  "event_planning", "errands_tasks", "other"
] as const;

export const CONTACT_TYPES = [
  "whatsapp", "email", "instagram", "x",
  "linkedin", "phone", "website", "tiktok", "custom"
] as const;

export const CANVAS_SECTIONS = [
  "services", "projects", "links", "stories", "resume"
] as const;

export const PROJECT_LINK_TYPES = [
  "live", "source", "design", "video", "article", "other"
] as const;

export const COMPLETENESS_WEIGHTS = {
  avatar: 10,
  bio: 10,
  department: 5,
  year: 5,
  hasService: 15,
  hasProject: 20,
  hasLink: 5,
  hasStory: 5,
  hasContactMethod: 15,
  hasResume: 10,
  studentEmailVerified: 5,
};
// Total = 105 → cap at 100. Lets users skip one and still hit 100.

export const RESERVED_USERNAMES = [
  "admin", "api", "discover", "dashboard", "signin", "signup",
  "settings", "explore", "search", "about", "terms", "privacy",
  "help", "support", "contact", "u", "user", "users", "profile",
  "canvas", "projects", "stories", "report", "auth"
];
```

---

## 7. API Routes

All routes prefixed `/api/v1`. Standard envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

Auth: short-lived JWT in `Authorization: Bearer <token>`. Refresh in httpOnly cookie. Rotate on every refresh.

### 7.1 Auth (`/auth`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/signup` | — | `{ email, password, username, fullName }`. Creates User + Profile (default `canvasLayout`) + sends verify-email OTP. |
| POST | `/signin` | — | Returns access + sets refresh cookie. |
| POST | `/signout` | required | Invalidates refresh. |
| POST | `/refresh` | refresh cookie | Rotate. |
| POST | `/verify-email` | — | `{ email, code }`. |
| POST | `/resend-verification` | — | Throttled. |
| POST | `/forgot-password` | — | |
| POST | `/reset-password` | — | `{ email, code, newPassword }`. |
| GET | `/me` | required | User + profile summary. |

### 7.2 Username Check

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile/check-username?u=xxx` | — | `{ available, suggestions? }`. |

### 7.3 Profile (`/profile`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/profile/me` | required | Full profile. |
| PATCH | `/profile/me` | required | Update fullName, bio, department, year, isPublic, accentColor. |
| PATCH | `/profile/me/username` | required | Rate-limited 1 / 30d. |
| PATCH | `/profile/me/canvas-layout` | required | `{ canvasLayout: [...] }`. Validates all keys ∈ `CANVAS_SECTIONS`, no duplicates. |
| POST | `/profile/me/avatar` | required | Multipart upload. |
| DELETE | `/profile/me/avatar` | required | |

### 7.4 Canvas (the public composed view)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/canvas/:username` | optional | Full canvas in one shot. Logs view (deduped). 404 if not found / suspended / `isPublic=false`. |
| GET | `/canvas/:username/projects/:slug` | optional | Single project page. Logs view on parent profile. |
| GET | `/canvas/:username/stories/:slug` | optional | Single story page. Increments `Story.viewCount`. |

`GET /canvas/:username` response shape:

```json
{
  "username": "murewa",
  "fullName": "...",
  "avatarUrl": "...",
  "bio": "...",
  "department": "Computer Science",
  "year": 3,
  "isVerified": true,
  "accentColor": "#1E3A8A",
  "completenessScore": 92,
  "viewCount": 1240,
  "canvasLayout": ["projects", "services", "links", "stories", "resume"],
  "sections": {
    "services": [ /* Service[] */ ],
    "projects": [
      {
        "slug": "yami",
        "title": "Yami",
        "tagline": "P2P student lending",
        "coverUrl": "...",
        "techStack": ["Next.js", "Mongo", "Paystack"]
      }
    ],
    "links": [ /* Link[] (active only) */ ],
    "stories": [
      {
        "slug": "building-yami",
        "title": "Building Yami in 4 weeks",
        "excerpt": "...",
        "coverUrl": "...",
        "publishedAt": "...",
        "readingTimeMinutes": 6
      }
    ],
    "resume": { "fileUrl": "...", "fileName": "..." } | null
  },
  "contacts": [ /* ContactMethod[] for Reach Out modal */ ]
}
```

Notes:
- All sections returned regardless of layout — frontend uses `canvasLayout` to render in order.
- Empty sections auto-hide on the frontend.
- Project description/gallery NOT in canvas response — only on subpage. Keeps payload lean.
- Story body NOT in canvas response — only on subpage.

### 7.5 Services (`/services`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/services` | required | |
| POST | `/services` | required | |
| PATCH | `/services/:id` | required (owner) | |
| PATCH | `/services/reorder` | required | `{ orderedIds: [] }` |
| DELETE | `/services/:id` | required (owner) | |

### 7.6 Projects (`/projects`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/projects` | required | Owner's projects (incl. drafts). |
| POST | `/projects` | required | Slug auto-generated from title, deduped within profile. |
| GET | `/projects/:id` | required (owner) | Edit view, full data. |
| PATCH | `/projects/:id` | required (owner) | Re-renders descriptionHtml if description changed. |
| PATCH | `/projects/:id/slug` | required (owner) | Manual slug change. |
| PATCH | `/projects/:id/cover` | required (owner) | Upload/replace cover. |
| POST | `/projects/:id/gallery` | required (owner) | Add gallery items. |
| DELETE | `/projects/:id/gallery/:itemId` | required (owner) | |
| PATCH | `/projects/reorder` | required | |
| PATCH | `/projects/:id/publish` | required (owner) | `{ isPublished }`. |
| DELETE | `/projects/:id` | required (owner) | Cascades Cloudinary cleanup. |

### 7.7 Links (`/links`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/links` | required | |
| POST | `/links` | required | |
| PATCH | `/links/:id` | required (owner) | |
| PATCH | `/links/reorder` | required | |
| PATCH | `/links/:id/toggle` | required (owner) | Flip `isActive`. |
| DELETE | `/links/:id` | required (owner) | |

### 7.8 Stories (`/stories`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/stories` | required | Owner's stories incl. drafts. |
| POST | `/stories` | required | Renders bodyHtml + computes readingTime on write. |
| GET | `/stories/:id` | required (owner) | Full edit view. |
| PATCH | `/stories/:id` | required (owner) | Re-renders bodyHtml if body changed. |
| PATCH | `/stories/:id/cover` | required (owner) | |
| PATCH | `/stories/:id/publish` | required (owner) | Sets `isPublished` + `publishedAt`. |
| DELETE | `/stories/:id` | required (owner) | |

### 7.9 Contacts (`/contacts`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/contacts` | required | |
| POST | `/contacts` | required | Validates per-type format. |
| PATCH | `/contacts/:id` | required (owner) | |
| PATCH | `/contacts/reorder` | required | |
| PATCH | `/contacts/:id/primary` | required (owner) | Sets one as primary, unsets others. |
| DELETE | `/contacts/:id` | required (owner) | |

### 7.10 Resume (`/resume`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/resume` | required | |
| POST | `/resume` | required | Multipart PDF. Replaces existing. |
| DELETE | `/resume` | required | |

### 7.11 Verification (`/verification`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/verification/student-email/start` | required | Validates domain, sends OTP. |
| POST | `/verification/student-email/confirm` | required | Sets `studentEmailVerifiedAt`. |

### 7.12 Discovery (`/discover`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/discover/categories` | optional | Categories + counts. Cached 5m. |
| GET | `/discover/featured` | optional | Admin-curated. |
| GET | `/discover` | optional | Main directory (q, category, verified, sort, cursor, limit). |

Verified profiles always rank above unverified within the same sort tier.

### 7.13 Saved (`/saved`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/saved` | required | |
| POST | `/saved` | required | Idempotent. |
| DELETE | `/saved/:profileId` | required | |

### 7.14 Reports (`/reports`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/reports` | required | Rate-limited 5/day per user. |

### 7.15 Analytics (`/analytics`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/analytics/view` | optional | Logged on canvas/project/story page loads. Deduped 24h per viewer. |
| POST | `/analytics/outreach` | optional | Logged when Reach Out → contact clicked. |
| GET | `/analytics/me/overview` | required | totalViews, viewsLast7d/30d, outreachClicksLast30d, breakdown by contact type, top stories, top projects. |

### 7.16 Upload (`/upload`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/upload/sign` | required | Cloudinary signed-upload params. Used for project covers/gallery, story covers, link icons. |

Avatars and resumes go through the server (multer) for validation. Project gallery and story covers use direct browser → Cloudinary uploads.

### 7.17 OG Images (`/og`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/og/:username.png` | — | Canvas OG card. 1h cache. |
| GET | `/og/:username/projects/:slug.png` | — | Project OG. |
| GET | `/og/:username/stories/:slug.png` | — | Story OG (cover, title, author, reading time). |

### 7.18 Admin (`/admin`)

| Method | Path | Description |
|---|---|---|
| GET | `/admin/reports?status=pending` | |
| PATCH | `/admin/reports/:id` | `{ status, adminNote? }`. |
| GET | `/admin/featured` | |
| POST | `/admin/featured` | `{ profileId, order }`. |
| DELETE | `/admin/featured/:profileId` | |
| GET | `/admin/users?q=` | |
| PATCH | `/admin/users/:id/suspend` | `{ reason }`. |
| PATCH | `/admin/users/:id/unsuspend` | |

---

## 8. Validation Rules

- **Username:** `/^[a-z0-9_-]{3,24}$/`, no leading/trailing dash, not in `RESERVED_USERNAMES`.
- **Password:** min 8, must contain a letter and a number.
- **Bio:** max 280.
- **Service:** title max 80, description max 500.
- **Project:** title max 100, tagline max 140, description max 5000 (markdown), max 12 gallery items, max 6 links, max 12 tech stack tags.
- **Story:** title max 120, body max 20000 (markdown), excerpt max 200.
- **Link:** label max 60, url valid with protocol, max 20 per profile.
- **Slug (project/story):** `/^[a-z0-9-]{1,80}$/`, generated from title via `slugify`, deduplicated within profile (append `-2`, `-3`, etc.).
- **Resume:** PDF only, max 5 MB.
- **Avatar:** image, max 2 MB, transformed to 512x512 via Cloudinary.
- **Project/story cover:** image, max 4 MB, max 1600px wide.
- **Project gallery item:** image up to 4 MB OR video up to 20 MB.
- **Contact value normalization** (in `lib/contactNormalizer.ts`):
  - `whatsapp`, `phone`: must be E.164 (`+2348012345678`).
  - `email`: lowercase, valid email.
  - `instagram`, `tiktok`, `x`: strip `@` and URL prefix, store handle only.
  - `linkedin`: normalize to full URL.
  - `website`, `custom`: must be valid URL with protocol.
- **Markdown rendering:** `marked` with `gfm: true`, then `sanitize-html` allowlist: `p, h1-h4, strong, em, blockquote, ul, ol, li, code, pre, a (href, title, rel=noopener), img (src, alt), hr, br`. No `script`, `style`, `iframe`, `data:` URLs except images.

---

## 9. Auth & Security

- Passwords: bcrypt cost 12.
- Access JWT: 15 min. Refresh: 30d, httpOnly + secure + sameSite=lax cookie, hashed in DB. Rotate every refresh; reuse detection → revoke all sessions.
- Rate limits:
  - `/auth/signin`: 10 / 15min per IP.
  - `/auth/signup`: 5 / hr per IP.
  - OTP send: 3 / hr per email.
  - `/reports`: 5 / day per user.
  - `/stories` POST: 10 / day per user.
  - `/projects` POST: 10 / day per user.
- Helmet defaults + CORS allowlist (`WEB_URL`).
- Sanitize all string inputs (trim, strip control chars).
- Mongoose `strictQuery: true`.
- Never return `passwordHash`, `refreshTokenHash`, or other users' email in public responses.
- Markdown HTML rendered server-side at write time and stored sanitized — never trust client to render.

---

## 10. Email Templates (Resend)

- `verify_email` — signup OTP.
- `verify_student_email` — student email OTP.
- `reset_password` — reset OTP.
- `welcome` — after first verification.

Plain, short, 6-digit code prominent, 10-min expiry, "didn't request this? ignore" footer.

---

## 11. Cloudinary Setup

Folders:
- `byu-connect/avatars/{userId}`
- `byu-connect/projects/{userId}/{projectId}` — cover + gallery
- `byu-connect/stories/{userId}/{storyId}` — cover only
- `byu-connect/links/{userId}` — optional custom icons
- `byu-connect/resumes/{userId}` — `resource_type: "raw"`

Upload presets:
- `avatar_preset` — 512x512 square, auto format/quality.
- `cover_preset` — max 1600w, auto format/quality.
- `gallery_preset` — max 1600w, auto format/quality, video transcode if video.
- `resume_preset` — raw, no transformation.

When deleting any document with `publicId`, call Cloudinary destroy in the same flow. For projects, delete cover + all gallery items in parallel before removing the doc.

---

## 12. Completeness Score

Recompute on every write to: Profile, Service, Project (published), Link, Story (published), ContactMethod, Resume, User.studentEmailVerifiedAt.

```ts
// lib/completeness.ts

export async function recomputeCompleteness(profileId) {
  const [profile, services, projects, links, stories, contacts, resume, user] =
    await Promise.all([...]);

  let score = 0;
  if (profile.avatarUrl) score += 10;
  if (profile.bio) score += 10;
  if (profile.department) score += 5;
  if (profile.year) score += 5;
  if (services.length > 0) score += 15;
  if (projects.some(p => p.isPublished)) score += 20;
  if (links.length > 0) score += 5;
  if (stories.some(s => s.isPublished)) score += 5;
  if (contacts.length > 0) score += 15;
  if (resume) score += 10;
  if (user.studentEmailVerifiedAt) score += 5;

  score = Math.min(score, 100);

  await Profile.updateOne({ _id: profileId }, { completenessScore: score });
}
```

Call from each feature's service layer after mutations.

---

## 13. Discovery Logic

```ts
// discovery.service.ts (pseudocode)

async function discover({ q, category, verified, sort, cursor, limit }) {
  const pipeline = [];

  // Join user for verified + suspension filter
  pipeline.push(
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { isPublic: true, "user.isSuspended": false } }
  );

  if (verified) pipeline.push({ $match: { "user.studentEmailVerifiedAt": { $ne: null } } });
  if (q) pipeline.unshift({ $match: { $text: { $search: q } } });
  if (category) pipeline.push({ $match: { serviceCategories: category } });

  pipeline.push({
    $addFields: { isVerified: { $ne: ["$user.studentEmailVerifiedAt", null] } }
  });

  const sortStage = {
    newest: { isVerified: -1, createdAt: -1 },
    alphabetical: { isVerified: -1, fullName: 1 },
    popular: { isVerified: -1, viewCount: -1 },
  }[sort] ?? { score: { $meta: "textScore" }, isVerified: -1 };

  pipeline.push({ $sort: sortStage });

  // Cursor pagination by _id
  // ...
}
```

The denormalized `serviceCategories` array on Profile is the most important perf decision here. Update it from `services.service.ts` whenever services change.

---

## 14. Build Order (4 weeks, solo)

**Week 1 — foundation + auth + canvas shell**
- Project init, env loader, db, error middleware, response helpers, logger.
- User + Profile models.
- Auth flow end-to-end (signup, signin, refresh, signout, verify-email, forgot/reset).
- `/profile/me` GET + PATCH + canvas-layout endpoint.
- `GET /canvas/:username` returning header + empty sections.

**Week 2 — canvas content**
- Services CRUD + reorder.
- Projects CRUD + reorder + cover + gallery + slugs + publish toggle.
- Links CRUD + reorder + toggle.
- Stories CRUD + markdown rendering + publish + slugs.
- Contacts CRUD + reorder + primary + value normalization.
- Resume upload.
- Avatar upload.
- Completeness scoring wired in.
- `GET /canvas/:username/projects/:slug` + `/stories/:slug`.

**Week 3 — discovery + verification + saved**
- Public canvas view logging (dedup).
- Discovery (search, filter, sort, pagination, denormalized categories).
- Categories with counts.
- Featured.
- Saved profiles.
- Student email OTP flow.
- OG image routes (canvas, project, story).

**Week 4 — trust + admin + analytics + hardening**
- Reports endpoint.
- Admin: reports queue, featured, suspend/unsuspend.
- Outreach click logging.
- Analytics overview endpoint.
- Rate limiting tightened.
- Sentry, health check, structured logs in production format.

---

## 15. v2 (don't accidentally build now)

- In-app messaging.
- Reactions/likes on stories.
- Story tags + tag-based discovery.
- Project comments / Q&A.
- Reviews / ratings on profiles.
- Email digests.
- Multi-school support (add `School` model, scope everything by it).
- Resume parsing.
- Atlas Search / Meilisearch.
- Custom canvas themes beyond accent color.

---

## 16. Open Questions

1. Sign-in via password only, or also magic link as a v1 option?
2. Should reports auto-hide a profile after N reports, or always require admin action?
3. Resume: PDF only, or also DOCX?
4. Confirm `STUDENT_EMAIL_DOMAIN` for your school.
5. Should story drafts have a public preview link (with token)? Lets users share unpublished work for feedback. Easy add.
