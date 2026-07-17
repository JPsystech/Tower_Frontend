export type Tenant = {
  id: number;
  company_name: string;
  company_code: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: number;
  tenant_id: number | null;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  roles: string[];
  tenant: Tenant | null;
};

export type Role = {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export type SessionPayload = {
  access_token: string;
  token_type: "bearer";
  user: {
    id: number;
    tenant_id: number | null;
    full_name: string;
    email: string;
    phone: string | null;
    status: string;
  };
  tenant: {
    id: number;
    company_name: string;
    company_code: string;
    status: string;
  } | null;
  roles: string[];
};

export type ApiError = {
  detail?: string;
  message?: string;
};
