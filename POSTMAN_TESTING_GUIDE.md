# ByU Connect API — Postman Testing Guide

## Setup

### Base URL
```
http://localhost:4000/api/v1
```

### Postman Environment Variables
Create a Postman Environment with these variables:

| Variable | Value |
|---|---|
| `BASE_URL` | `http://localhost:4000/api/v1` |
| `ACCESS_TOKEN` | *(auto-set by login script)* |
| `USERNAME` | *(auto-set by signup)* |
| `PROFILE_ID` | *(auto-set after fetching profile)* |

### Auto-capture Access Token
In **Tests** tab of the Signin request, add:
```js
const json = pm.response.json();
if (json.success) {
  pm.environment.set("ACCESS_TOKEN", json.data.accessToken);
}
```

### Auth Header (all protected endpoints)
```
Authorization: Bearer {{ACCESS_TOKEN}}
```

Cookies are managed automatically by Postman (refresh token is set as httpOnly cookie).

---

## 1. Auth

### 1.1 Sign Up
```
POST {{BASE_URL}}/auth/signup
Content-Type: application/json

{
  "email": "murewa@gmail.com",
  "password": "Password1",
  "username": "murewa",
  "fullName": "Murewa Ajala"
}
```
**Expected:** `201` — returns `accessToken` + sets `refreshToken` cookie. A 6-digit OTP is emailed.

**Tests tab:**
```js
const json = pm.response.json();
pm.environment.set("ACCESS_TOKEN", json.data.accessToken);
pm.environment.set("USERNAME", json.data.user.id);
```

---

### 1.2 Verify Email
```
POST {{BASE_URL}}/auth/verify-email
Content-Type: application/json

{
  "email": "murewa@gmail.com",
  "code": "123456"
}
```
**Expected:** `200` — use the code from the email.

---

### 1.3 Sign In
```
POST {{BASE_URL}}/auth/signin
Content-Type: application/json

{
  "email": "murewa@gmail.com",
  "password": "Password1"
}
```
**Expected:** `200` — new `accessToken`.

---

### 1.4 Get Current User
```
GET {{BASE_URL}}/auth/me
Authorization: Bearer {{ACCESS_TOKEN}}
```
**Expected:** `200` — user object + profile summary.

---

### 1.5 Refresh Token
```
POST {{BASE_URL}}/auth/refresh
```
*(No body — uses `refreshToken` cookie automatically)*
**Expected:** `200` — new `accessToken`.

---

### 1.6 Forgot Password
```
POST {{BASE_URL}}/auth/forgot-password
Content-Type: application/json

{
  "email": "murewa@gmail.com"
}
```
**Expected:** `200` — OTP sent to email.

---

### 1.7 Reset Password
```
POST {{BASE_URL}}/auth/reset-password
Content-Type: application/json

{
  "email": "murewa@gmail.com",
  "code": "123456",
  "newPassword": "NewPass2"
}
```
**Expected:** `200` — all sessions invalidated.

---

### 1.8 Sign Out
```
POST {{BASE_URL}}/auth/signout
Authorization: Bearer {{ACCESS_TOKEN}}
```
**Expected:** `200` — refresh cookie cleared.

---

## 2. Profile

### 2.1 Check Username Availability
```
GET {{BASE_URL}}/profile/check-username?u=murewa
```
**Expected:** `200 { "available": true/false }`

---

### 2.2 Get My Profile
```
GET {{BASE_URL}}/profile/me
Authorization: Bearer {{ACCESS_TOKEN}}
```
**Expected:** `200` — full profile object.

---

### 2.3 Update Profile
```
PATCH {{BASE_URL}}/profile/me
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "bio": "Computer Science student. Building things.",
  "department": "Computer Science",
  "year": 3,
  "isPublic": true,
  "accentColor": "#1E3A8A"
}
```
**Expected:** `200` — updated profile.

---

### 2.4 Update Username
```
PATCH {{BASE_URL}}/profile/me/username
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "username": "murewa"
}
```
**Note:** Rate-limited to 1 change per 30 days.

---

### 2.5 Update Canvas Layout
```
PATCH {{BASE_URL}}/profile/me/canvas-layout
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "canvasLayout": ["projects", "services", "links", "stories", "resume"]
}
```
**Valid values:** `services`, `projects`, `links`, `stories`, `resume`

---

### 2.6 Upload Avatar
```
POST {{BASE_URL}}/profile/me/avatar
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: multipart/form-data

avatar: <file> (image, max 2 MB)
```

---

### 2.7 Delete Avatar
```
DELETE {{BASE_URL}}/profile/me/avatar
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 3. Canvas (Public)

### 3.1 Get Canvas by Username
```
GET {{BASE_URL}}/canvas/murewa
```
**No auth required.** Returns full public canvas in one shot.

---

### 3.2 Get Project Page
```
GET {{BASE_URL}}/canvas/murewa/projects/my-project-slug
```

---

### 3.3 Get Story Page
```
GET {{BASE_URL}}/canvas/murewa/stories/my-story-slug
```

---

## 4. Services

### 4.1 Get Services
```
GET {{BASE_URL}}/services
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 4.2 Create Service
```
POST {{BASE_URL}}/services
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "category": "web_app_dev",
  "title": "Full-stack Web Development",
  "description": "I build fast, modern web apps using Next.js and Node.js.",
  "startingPrice": 50000,
  "currency": "NGN",
  "isNegotiable": true
}
```
**Valid categories:** `design`, `photography_video`, `writing_editing`, `tutoring_academic`, `web_app_dev`, `social_marketing`, `hair_beauty`, `fashion_tailoring`, `music_audio`, `event_planning`, `errands_tasks`, `other`

**Save the `_id` from the response as `SERVICE_ID` in your environment.**

---

### 4.3 Update Service
```
PATCH {{BASE_URL}}/services/{{SERVICE_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "title": "Full-stack Web Development (Updated)",
  "startingPrice": 75000
}
```

---

### 4.4 Reorder Services
```
PATCH {{BASE_URL}}/services/reorder
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "orderedIds": ["{{SERVICE_ID}}", "other-service-id"]
}
```

---

### 4.5 Delete Service
```
DELETE {{BASE_URL}}/services/{{SERVICE_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 5. Projects

### 5.1 Get Projects
```
GET {{BASE_URL}}/projects
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 5.2 Create Project
```
POST {{BASE_URL}}/projects
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "title": "Yami — P2P Student Lending",
  "tagline": "Peer-to-peer lending for students",
  "description": "## Overview\n\nYami connects students who need small loans with those who can lend.\n\n## Tech Stack\n\nBuilt with Next.js, Node.js, and Paystack.",
  "techStack": ["Next.js", "Node.js", "MongoDB", "Paystack"],
  "links": [
    { "label": "Live Demo", "url": "https://yami.app", "type": "live" },
    { "label": "Source", "url": "https://github.com/murewa/yami", "type": "source" }
  ],
  "isPublished": true
}
```
**Valid link types:** `live`, `source`, `design`, `video`, `article`, `other`

**Save `_id` as `PROJECT_ID`.**

---

### 5.3 Get Project (Edit View)
```
GET {{BASE_URL}}/projects/{{PROJECT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 5.4 Update Project
```
PATCH {{BASE_URL}}/projects/{{PROJECT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "tagline": "Peer-to-peer micro-lending for Nigerian students"
}
```

---

### 5.5 Update Project Slug
```
PATCH {{BASE_URL}}/projects/{{PROJECT_ID}}/slug
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "slug": "yami-lending"
}
```

---

### 5.6 Upload Project Cover
```
PATCH {{BASE_URL}}/projects/{{PROJECT_ID}}/cover
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: multipart/form-data

cover: <image file, max 4 MB>
```

---

### 5.7 Add Gallery Items
```
POST {{BASE_URL}}/projects/{{PROJECT_ID}}/gallery
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "items": [
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1/byu-connect/...",
      "publicId": "byu-connect/projects/userId/projectId/filename",
      "type": "image",
      "caption": "Dashboard screenshot"
    }
  ]
}
```
**Note:** Upload the image via the `/upload/sign` endpoint first to get the Cloudinary URL.

---

### 5.8 Delete Gallery Item
```
DELETE {{BASE_URL}}/projects/{{PROJECT_ID}}/gallery/{{GALLERY_ITEM_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 5.9 Toggle Publish
```
PATCH {{BASE_URL}}/projects/{{PROJECT_ID}}/publish
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "isPublished": false
}
```

---

### 5.10 Reorder Projects
```
PATCH {{BASE_URL}}/projects/reorder
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "orderedIds": ["{{PROJECT_ID}}"]
}
```

---

### 5.11 Delete Project
```
DELETE {{BASE_URL}}/projects/{{PROJECT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 6. Links

### 6.1 Get Links
```
GET {{BASE_URL}}/links
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 6.2 Create Link
```
POST {{BASE_URL}}/links
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "label": "My YouTube Channel",
  "url": "https://youtube.com/@murewa",
  "iconKey": "youtube",
  "isActive": true
}
```
**Save `_id` as `LINK_ID`.**

---

### 6.3 Update Link
```
PATCH {{BASE_URL}}/links/{{LINK_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "label": "YouTube"
}
```

---

### 6.4 Toggle Link Active/Inactive
```
PATCH {{BASE_URL}}/links/{{LINK_ID}}/toggle
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 6.5 Reorder Links
```
PATCH {{BASE_URL}}/links/reorder
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "orderedIds": ["{{LINK_ID}}"]
}
```

---

### 6.6 Delete Link
```
DELETE {{BASE_URL}}/links/{{LINK_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 7. Stories

### 7.1 Get Stories
```
GET {{BASE_URL}}/stories
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 7.2 Create Story
```
POST {{BASE_URL}}/stories
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "title": "Building Yami in 4 Weeks",
  "body": "## Week 1\n\nI started by sketching the user flow...\n\n## Week 2\n\nBackend was done by Friday.",
  "excerpt": "How I shipped a fintech product in under a month.",
  "isPublished": false
}
```
**Save `_id` as `STORY_ID`.**

---

### 7.3 Get Story (Edit View)
```
GET {{BASE_URL}}/stories/{{STORY_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 7.4 Update Story
```
PATCH {{BASE_URL}}/stories/{{STORY_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "title": "Building Yami in 4 Weeks — A Retrospective"
}
```

---

### 7.5 Upload Story Cover
```
PATCH {{BASE_URL}}/stories/{{STORY_ID}}/cover
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: multipart/form-data

cover: <image file, max 4 MB>
```

---

### 7.6 Publish / Unpublish Story
```
PATCH {{BASE_URL}}/stories/{{STORY_ID}}/publish
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "isPublished": true
}
```

---

### 7.7 Delete Story
```
DELETE {{BASE_URL}}/stories/{{STORY_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 8. Contacts (Reach Out Modal)

### 8.1 Get Contacts
```
GET {{BASE_URL}}/contacts
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 8.2 Create Contact
```
POST {{BASE_URL}}/contacts
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "type": "whatsapp",
  "value": "+2348012345678",
  "isPrimary": true
}
```
**Valid types:** `whatsapp`, `email`, `instagram`, `x`, `linkedin`, `phone`, `website`, `tiktok`, `custom`

**Value format rules:**
- `whatsapp` / `phone`: E.164 format → `+2348012345678`
- `email`: valid email
- `instagram` / `tiktok` / `x`: handle only (with or without `@`, URL auto-stripped)
- `linkedin`: full URL or handle → auto-prefixed with `https://linkedin.com/in/`
- `website` / `custom`: must start with `https://` or `http://`

**Save `_id` as `CONTACT_ID`.**

---

### 8.3 Update Contact
```
PATCH {{BASE_URL}}/contacts/{{CONTACT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "value": "+2348099999999"
}
```

---

### 8.4 Set Primary Contact
```
PATCH {{BASE_URL}}/contacts/{{CONTACT_ID}}/primary
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 8.5 Reorder Contacts
```
PATCH {{BASE_URL}}/contacts/reorder
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "orderedIds": ["{{CONTACT_ID}}"]
}
```

---

### 8.6 Delete Contact
```
DELETE {{BASE_URL}}/contacts/{{CONTACT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 9. Resume

### 9.1 Get Resume
```
GET {{BASE_URL}}/resume
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 9.2 Upload Resume
```
POST {{BASE_URL}}/resume
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: multipart/form-data

resume: <PDF file, max 5 MB>
```
Replaces existing resume automatically.

---

### 9.3 Delete Resume
```
DELETE {{BASE_URL}}/resume
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 10. Student Email Verification

### 10.1 Start Verification
```
POST {{BASE_URL}}/verification/student-email/start
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "studentEmail": "murewa@student.babcock.edu.ng"
}
```
OTP sent to the student email.

---

### 10.2 Confirm Verification
```
POST {{BASE_URL}}/verification/student-email/confirm
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "code": "123456"
}
```
**Expected:** `200` — profile gets `isVerified: true` badge.

---

## 11. Discovery

### 11.1 Browse Categories
```
GET {{BASE_URL}}/discover/categories
```
Returns categories with non-zero service counts.

---

### 11.2 Get Featured Profiles
```
GET {{BASE_URL}}/discover/featured
```

---

### 11.3 Discover / Search
```
GET {{BASE_URL}}/discover?q=web+developer&category=web_app_dev&verified=true&sort=popular&limit=20
```

| Param | Values | Notes |
|---|---|---|
| `q` | any string | Full-text search |
| `category` | see constants | Filter by service category |
| `verified` | `true` / `false` | Verified badge filter |
| `sort` | `newest`, `alphabetical`, `popular` | Default: newest |
| `cursor` | last `_id` from previous page | For pagination |
| `limit` | 1–50 | Default: 20 |

Pagination: use `nextCursor` from the response as `cursor` in the next request.

---

## 12. Saved Profiles

### 12.1 Get Saved Profiles
```
GET {{BASE_URL}}/saved
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 12.2 Save a Profile
```
POST {{BASE_URL}}/saved
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "profileId": "the-profile-objectid-here"
}
```
Idempotent — safe to call multiple times.

---

### 12.3 Unsave a Profile
```
DELETE {{BASE_URL}}/saved/{{PROFILE_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 13. Analytics

### 13.1 Log a Profile View
```
POST {{BASE_URL}}/analytics/view
Content-Type: application/json

{
  "profileId": "the-profile-objectid-here",
  "source": "discover"
}
```
**Valid sources:** `direct`, `discover`, `category`, `search`, `shared`, `featured`

Auth optional. Deduped per viewer per 24h.

---

### 13.2 Log an Outreach Click
```
POST {{BASE_URL}}/analytics/outreach
Content-Type: application/json

{
  "profileId": "the-profile-objectid-here",
  "contactType": "whatsapp"
}
```

---

### 13.3 Get My Analytics Overview
```
GET {{BASE_URL}}/analytics/me/overview
Authorization: Bearer {{ACCESS_TOKEN}}
```
Returns: total views, 7d/30d views, outreach clicks by type, top stories, top projects.

---

## 14. Reports

### 14.1 Report a Profile
```
POST {{BASE_URL}}/reports
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "targetProfileId": "the-profile-objectid-here",
  "reason": "spam",
  "description": "This profile is advertising irrelevant services."
}
```
**Valid reasons:** `spam`, `inappropriate`, `impersonation`, `harassment`, `other`

Rate-limited to 5 reports per day per user.

---

## 15. Upload (Cloudinary Signed Uploads)

Use this for project covers, gallery items, and link icons that go directly from browser → Cloudinary.

### 15.1 Get Signed Upload Params
```
POST {{BASE_URL}}/upload/sign
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "type": "cover",
  "resourceId": "{{PROJECT_ID}}"
}
```
**Valid types:** `cover`, `gallery`, `link_icon`

Returns `{ signature, timestamp, cloudName, apiKey, folder, uploadPreset }` — pass these directly to the Cloudinary upload API from the frontend.

---

## 16. Admin (Admin role required)

To make your account admin: set `role: "admin"` directly in MongoDB Atlas for your user document. Or use `ADMIN_BOOTSTRAP_EMAIL` in `.env`.

### 16.1 Get Reports Queue
```
GET {{BASE_URL}}/admin/reports?status=pending
Authorization: Bearer {{ACCESS_TOKEN}}
```
**Status options:** `pending`, `reviewed`, `actioned`, `dismissed`

---

### 16.2 Review a Report
```
PATCH {{BASE_URL}}/admin/reports/{{REPORT_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "status": "actioned",
  "adminNote": "User account suspended after review."
}
```

---

### 16.3 Get Featured List
```
GET {{BASE_URL}}/admin/featured
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 16.4 Add Profile to Featured
```
POST {{BASE_URL}}/admin/featured
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "profileId": "the-profile-objectid-here",
  "order": 0
}
```

---

### 16.5 Remove from Featured
```
DELETE {{BASE_URL}}/admin/featured/{{PROFILE_ID}}
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 16.6 Search Users
```
GET {{BASE_URL}}/admin/users?q=murewa
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

### 16.7 Suspend User
```
PATCH {{BASE_URL}}/admin/users/{{USER_ID}}/suspend
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "reason": "Violated community guidelines."
}
```

---

### 16.8 Unsuspend User
```
PATCH {{BASE_URL}}/admin/users/{{USER_ID}}/unsuspend
Authorization: Bearer {{ACCESS_TOKEN}}
```

---

## 17. OG Images

These return JSON metadata (PNG rendering not yet implemented — needs satori/sharp).

```
GET {{BASE_URL}}/og/murewa.png
GET {{BASE_URL}}/og/murewa/projects/yami.png
GET {{BASE_URL}}/og/murewa/stories/building-yami.png
```

---

## Standard Response Envelopes

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      { "field": "email", "message": "Invalid email" }
    ]
  }
}
```

### Other Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header"
  }
}
```

---

## Common Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `BAD_REQUEST` | 400 | Business rule violation |
| `UNAUTHORIZED` | 401 | Missing / expired token |
| `SUSPENDED` | 403 | Account is suspended |
| `FORBIDDEN` | 403 | No permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` | 409 | Duplicate (email, username, etc.) |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |

---

## Recommended Test Order

1. **Signup** → captures `ACCESS_TOKEN`
2. **Verify Email** (use OTP from email/logs)
3. **Get My Profile** → confirm profile was created
4. **Update Profile** (bio, department, year)
5. **Create Service** → save `SERVICE_ID`
6. **Create Project** → save `PROJECT_ID`
7. **Create Link** → save `LINK_ID`
8. **Create Story** → save `STORY_ID`
9. **Create Contact** → save `CONTACT_ID`
10. **Upload Resume** (PDF)
11. **Get Canvas** `GET /canvas/murewa` → see full public canvas
12. **Publish Story** → verify it appears in canvas
13. **Start Student Verification** → confirm OTP
14. **Discover** → see your profile in the directory
15. **Sign Out** → confirm refresh cookie cleared
