export interface AccountUser {
  id: string;
  email: string;
  fullName: string;
  status: "active" | "disabled";
  isPlatformAdmin: boolean;
  createdAt: string;
}

export interface AccountMembership {
  company: {
    id: string;
    name: string;
    slug: string;
    status: "pending" | "active" | "suspended";
  };
  role: "company_admin" | "company_staff";
  status: "active" | "disabled";
}

export interface Account {
  user: AccountUser;
  memberships: AccountMembership[];
}

