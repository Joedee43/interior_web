import type { Account, AccountMembership } from "./types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class AuthContractError extends Error {
  constructor(message: string) {
    super(`Invalid account response: ${message}`);
    this.name = "AuthContractError";
  }
}

function fail(message: string): never {
  throw new AuthContractError(message);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function oneOf<const T extends readonly string[]>(
  value: unknown,
  field: string,
  choices: T,
): T[number] {
  if (typeof value !== "string" || !choices.includes(value)) {
    fail(`${field} has an unsupported value`);
  }
  return value as T[number];
}

function uuid(value: unknown, field: string): string {
  const result = text(value, field);
  if (!uuidPattern.test(result)) fail(`${field} must be a UUID`);
  return result;
}

function membership(value: unknown): AccountMembership {
  const item = record(value, "memberships[]");
  const company = record(item.company, "memberships[].company");
  const slug = text(company.slug, "memberships[].company.slug");
  if (!slugPattern.test(slug)) {
    fail("memberships[].company.slug must be a lowercase slug");
  }
  return {
    company: {
      id: uuid(company.id, "memberships[].company.id"),
      name: text(company.name, "memberships[].company.name"),
      slug,
      status: oneOf(company.status, "memberships[].company.status", [
        "pending",
        "active",
        "suspended",
      ] as const),
    },
    role: oneOf(item.role, "memberships[].role", [
      "company_admin",
      "company_staff",
    ] as const),
    status: oneOf(item.status, "memberships[].status", [
      "active",
      "disabled",
    ] as const),
  };
}

export function normalizeAccount(value: unknown): Account {
  const item = record(value, "account");
  const user = record(item.user, "user");
  const email = text(user.email, "user.email");
  if (email.length > 254 || !emailPattern.test(email)) {
    fail("user.email must be a valid email address");
  }
  const fullName = text(user.full_name, "user.full_name");
  if ([...fullName].length > 100) {
    fail("user.full_name must be at most 100 characters");
  }
  if (typeof user.is_platform_admin !== "boolean") {
    fail("user.is_platform_admin must be a boolean");
  }
  const createdAt = text(user.created_at, "user.created_at");
  if (Number.isNaN(Date.parse(createdAt))) {
    fail("user.created_at must be a valid date-time");
  }
  if (!Array.isArray(item.memberships)) {
    fail("memberships must be an array");
  }
  const memberships = item.memberships.map(membership);
  const companyIds = new Set<string>();
  for (const entry of memberships) {
    if (companyIds.has(entry.company.id)) {
      fail("memberships contains a duplicate company");
    }
    companyIds.add(entry.company.id);
  }

  return {
    user: {
      id: uuid(user.id, "user.id"),
      email,
      fullName,
      status: oneOf(user.status, "user.status", ["active", "disabled"] as const),
      isPlatformAdmin: user.is_platform_admin,
      createdAt,
    },
    memberships,
  };
}

