import slugify from "slugify";

export function generateSlug(text: string): string {
  return slugify(text, { lower: true, strict: true, trim: true }).slice(0, 80);
}

export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = generateSlug(base);
  if (!(await exists(baseSlug))) return baseSlug;

  let counter = 2;
  while (true) {
    const candidate = `${baseSlug.slice(0, 77)}-${counter}`;
    if (!(await exists(candidate))) return candidate;
    counter++;
  }
}
