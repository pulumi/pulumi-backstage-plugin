/**
 * Parses annotation values that may contain comma-separated multiple values.
 * Follows the canonical Backstage pattern for multi-value annotations.
 *
 * @param value - The annotation value string (may be undefined)
 * @returns An array of trimmed, non-empty values
 *
 * @example
 * parseAnnotationValues('org/proj/stack') // ['org/proj/stack']
 * parseAnnotationValues('org1/p1/s1,org2/p2/s2') // ['org1/p1/s1', 'org2/p2/s2']
 * parseAnnotationValues(undefined) // []
 */
export function parseAnnotationValues(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}
