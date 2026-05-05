import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ByU Connect API",
      version: "1.0.0",
      description:
        "REST API for ByU Connect — a student directory platform for Babcock University. All protected endpoints require a valid Bearer access token.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "v1",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication — sign up, sign in, token refresh, password reset" },
      { name: "Profile", description: "User profile read and update" },
      { name: "Canvas", description: "Public canvas view endpoints" },
      { name: "Services", description: "Student services CRUD" },
      { name: "Projects", description: "Student projects CRUD" },
      { name: "Links", description: "Social/portfolio links CRUD" },
      { name: "Stories", description: "Student stories CRUD" },
      { name: "Contacts", description: "Contact methods CRUD" },
      { name: "Resume", description: "Resume upload and delete" },
      { name: "Verification", description: "Student email verification" },
      { name: "Discovery", description: "Public student discovery / search" },
      { name: "Saved", description: "Save and unsave profiles" },
      { name: "Analytics", description: "Profile analytics" },
      { name: "Moderation", description: "User-facing report submission" },
      { name: "Admin", description: "Admin-only endpoints — require admin role" },
      { name: "Upload", description: "Cloudinary signed upload" },
    ],
  },
  apis: ["./src/features/**/*.routes.ts", "./src/features/**/*.controller.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
