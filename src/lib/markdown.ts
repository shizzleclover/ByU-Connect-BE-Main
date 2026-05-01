import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.use({ gfm: true });

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "h1", "h2", "h3", "h4",
    "strong", "em", "blockquote",
    "ul", "ol", "li",
    "code", "pre",
    "a", "img",
    "hr", "br",
  ],
  allowedAttributes: {
    a: ["href", "title", "rel"],
    img: ["src", "alt"],
  },
  allowedSchemes: ["http", "https"],
  allowedSchemesByTag: {
    img: ["http", "https"],
  },
  // Disallow data: URIs and other dangerous schemes
  allowedSchemesAppliedToAttributes: ["href", "src"],
};

export async function renderMarkdown(raw: string): Promise<string> {
  const html = await marked.parse(raw);
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

export function computeReadingTime(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}
