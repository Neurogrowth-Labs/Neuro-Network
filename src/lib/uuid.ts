/**
 * Utility to validate and ensure clean RFC4122 UUID structures.
 * Converts any non-UUID or mock identifier into a deterministic valid UUIDv4
 * to avoid database constraint or syntax errors (e.g. PostgreSQL code 22P02).
 */
export function ensureUUID(id: string | undefined | null): string {
  if (!id) {
    return "00000000-0000-4000-a000-000000000000";
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) {
    return id.toLowerCase();
  }
  
  // Deterministic conversion of any arbitrary string to valid UUIDv4
  // We compute a simple 32-bit FNV-1a hash of the string first
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  
  // Generate 32 characters of hex
  let hex = "";
  for (let i = 0; i < 4; i++) {
    const word = Math.abs((hash ^ (i * 0x5bd1e995)) >>> 0);
    hex += word.toString(16).padStart(8, '0');
  }
  
  // Format into standard 8-4-4-4-12 UUID layout
  // Set UUID version to 4 (character index 12 is '4')
  // Set UUID variant to 1 (character index 16 is 'a')
  const part1 = hex.substring(0, 8);
  const part2 = hex.substring(8, 12);
  const part3 = "4" + hex.substring(13, 16);
  const part4 = "a" + hex.substring(17, 20);
  const part5 = hex.substring(20, 32);
  
  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}

/**
 * Checks if a string is a valid UUID.
 */
export function isValidUUID(id: string | undefined | null): boolean {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
