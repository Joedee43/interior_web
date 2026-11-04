import { describe, expect, it } from "vitest";

import { AuthContractError, normalizeAccount } from "./normalize";

const validAccount = {
  user: {
    id: "11111111-1111-4111-8111-111111111111",
    email: "customer@example.com",
    full_name: "Demo Customer",
    status: "active",
    is_platform_admin: false,
    created_at: "2026-01-02T03:04:05Z",
  },
  memberships: [
    {
      company: {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Demo Furniture",
        slug: "demo-furniture",
        status: "active",
      },
      role: "company_staff",
      status: "active",
    },
  ],
};

function rejects(value: unknown) {
  expect(() => normalizeAccount(value)).toThrow(AuthContractError);
}

describe("normalizeAccount", () => {
  it("normalizes a complete account without inventing fields", () => {
    expect(normalizeAccount(validAccount)).toEqual({
      user: {
        id: validAccount.user.id,
        email: "customer@example.com",
        fullName: "Demo Customer",
        status: "active",
        isPlatformAdmin: false,
        createdAt: "2026-01-02T03:04:05Z",
      },
      memberships: [
        {
          company: validAccount.memberships[0]?.company,
          role: "company_staff",
          status: "active",
        },
      ],
    });
  });

  it("requires the complete user and membership contract", () => {
    rejects({ ...validAccount, user: { ...validAccount.user, id: undefined } });
    rejects({ ...validAccount, memberships: undefined });
    rejects({
      ...validAccount,
      memberships: [
        {
          ...validAccount.memberships[0],
          company: { ...validAccount.memberships[0]?.company, status: undefined },
        },
      ],
    });
  });

  it("rejects malformed identities, dates, booleans, roles and statuses", () => {
    rejects({ ...validAccount, user: { ...validAccount.user, id: "not-a-uuid" } });
    rejects({ ...validAccount, user: { ...validAccount.user, email: "invalid" } });
    rejects({ ...validAccount, user: { ...validAccount.user, created_at: "later" } });
    rejects({ ...validAccount, user: { ...validAccount.user, is_platform_admin: 0 } });
    rejects({
      ...validAccount,
      memberships: [{ ...validAccount.memberships[0], role: "owner" }],
    });
  });

  it("rejects duplicate company memberships", () => {
    rejects({
      ...validAccount,
      memberships: [validAccount.memberships[0], validAccount.memberships[0]],
    });
  });
});

