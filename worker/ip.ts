// IP allowlist matching for IPv4 and IPv6, with CIDR support.
// Addresses are parsed to BigInt so one comparison path handles both families.

type Family = 4 | 6;

interface Address {
  family: Family;
  value: bigint;
}

interface Rule extends Address {
  prefix: number;
}

const BITS: Record<Family, number> = { 4: 32, 6: 128 };

function parseIPv4(input: string): bigint | null {
  const parts = input.split('.');
  if (parts.length !== 4) return null;
  let value = 0n;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value << 8n) | BigInt(octet);
  }
  return value;
}

function parseIPv6(input: string): bigint | null {
  let text = input.toLowerCase();
  let embeddedV4: bigint | null = null;

  // Trailing dotted IPv4, e.g. ::ffff:1.2.3.4 -> replace with two zero groups, OR it back in later.
  if (text.includes('.')) {
    const lastColon = text.lastIndexOf(':');
    embeddedV4 = parseIPv4(text.slice(lastColon + 1));
    if (embeddedV4 === null) return null;
    text = `${text.slice(0, lastColon + 1)}0:0`;
  }

  const halves = text.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;

  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  let value = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    value = (value << 16n) | BigInt(parseInt(group, 16));
  }
  if (embeddedV4 !== null) value = (value & ~0xffffffffn) | embeddedV4;
  return value;
}

export function parseAddress(raw: string): Address | null {
  const input = raw.trim().replace(/^\[|\]$/g, '');
  if (!input) return null;

  if (!input.includes(':')) {
    const value = parseIPv4(input);
    return value === null ? null : { family: 4, value };
  }

  const value = parseIPv6(input);
  if (value === null) return null;
  // IPv4-mapped IPv6 (::ffff:a.b.c.d) is matched against IPv4 rules.
  if (value >> 32n === 0xffffn) return { family: 4, value: value & 0xffffffffn };
  return { family: 6, value };
}

function parseRule(raw: string): Rule | null {
  const [addr, prefixText] = raw.split('/');
  const address = parseAddress(addr);
  if (!address) return null;
  const bits = BITS[address.family];
  const prefix = prefixText === undefined ? bits : Number(prefixText);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > bits) return null;
  return { ...address, prefix };
}

function matches(rule: Rule, address: Address): boolean {
  if (rule.family !== address.family) return false;
  const shift = BigInt(BITS[rule.family] - rule.prefix);
  return rule.value >> shift === address.value >> shift;
}

let cachedSource: string | undefined;
let cachedRules: Rule[] = [];

/** Parses ALLOWED_IPS once per isolate; invalid entries are skipped and logged. */
export function getRules(source: string | undefined): Rule[] {
  if (source === cachedSource) return cachedRules;
  cachedSource = source;
  cachedRules = [];
  for (const entry of (source ?? '').split(/[\s,]+/).filter(Boolean)) {
    const rule = parseRule(entry);
    if (rule) cachedRules.push(rule);
    else console.warn(`ALLOWED_IPS: ignoring invalid entry "${entry}"`);
  }
  return cachedRules;
}

export function isAllowed(ip: string, rules: Rule[]): boolean {
  const address = parseAddress(ip);
  return address !== null && rules.some((rule) => matches(rule, address));
}
