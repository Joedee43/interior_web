export function parseDesignEtag(value: string | null): number {
  const match = value?.match(/^"design-([1-9][0-9]*)"$/);
  if (!match) throw new Error("The design response is missing a valid ETag.");
  const revision = Number(match[1]);
  if (!Number.isSafeInteger(revision)) throw new Error("The design revision is not a safe integer.");
  return revision;
}

export function designEtag(revision: number): string {
  if (!Number.isSafeInteger(revision) || revision < 1) throw new Error("Invalid design revision.");
  return `"design-${revision}"`;
}
