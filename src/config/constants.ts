export const SERVICE_CATEGORIES = [
  "design",
  "photography_video",
  "writing_editing",
  "tutoring_academic",
  "web_app_dev",
  "social_marketing",
  "hair_beauty",
  "fashion_tailoring",
  "music_audio",
  "event_planning",
  "errands_tasks",
  "other",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export const CONTACT_TYPES = [
  "whatsapp",
  "email",
  "instagram",
  "x",
  "linkedin",
  "phone",
  "website",
  "tiktok",
  "custom",
] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

export const CANVAS_SECTIONS = [
  "services",
  "projects",
  "links",
  "stories",
  "resume",
] as const;

export type CanvasSection = (typeof CANVAS_SECTIONS)[number];

export const PROJECT_LINK_TYPES = [
  "live",
  "source",
  "design",
  "video",
  "article",
  "other",
] as const;

export type ProjectLinkType = (typeof PROJECT_LINK_TYPES)[number];

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
} as const;

export const RESERVED_USERNAMES = [
  "admin",
  "api",
  "discover",
  "dashboard",
  "signin",
  "signup",
  "settings",
  "explore",
  "search",
  "about",
  "terms",
  "privacy",
  "help",
  "support",
  "contact",
  "u",
  "user",
  "users",
  "profile",
  "canvas",
  "projects",
  "stories",
  "report",
  "auth",
];

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;
