export interface WordPressBoot {
  restUrl: string;
  nonce: string;
  networkName: string;
  userName: string;
  networkDomain?: string;
  multisiteType?: "Subdomain" | "Subdirectory";
  serverIp?: string;
  adminUrl?: string;
  demo: boolean;
  testMode?: boolean;
  directAdmin?: {
    configured: boolean;
    url: string;
    username: string;
  };
  settings?: {
    username: string;
    registrantIdentity: string;
    adminIdentity: string;
    nsgroup: string;
  };
}

declare global {
  interface Window {
    oxxaStudio?: WordPressBoot;
  }
}

export interface SystemStatus {
  multisite: boolean;
  canProvision: boolean;
  openssl: boolean;
  simplexml: boolean;
  https: boolean;
  themeInstalled: boolean;
  themeEnabled: boolean;
  credentials: boolean;
  registrationReady: boolean;
  testMode: boolean;
  siteCount: number;
  phpVersion: string;
  wpVersion: string;
  serverIp: string;
}

export interface DirectAdminSnapshot {
  configured: boolean;
  connected: boolean;
  url: string;
  username: string;
  lastSync: string;
  account?: {
    package: string;
    domain: string;
    type: string;
    suspended: boolean;
  };
  usage?: {
    diskUsedMb: number | null;
    diskLimitMb: number | null;
    diskUnlimited: boolean;
    bandwidthUsedMb: number | null;
    bandwidthLimitMb: number | null;
    bandwidthUnlimited: boolean;
    domainsUsed: number;
    domainsLimit: number | null;
    domainsUnlimited: boolean;
    emailAccounts: number;
    databases: number;
    ftpAccounts: number;
  };
}

export interface DirectAdminMailbox {
  username: string;
  email: string;
  quotaMb: number | null;
  usageMb: number | null;
  sent: number | null;
  dailyLimit: number | null;
  suspended: boolean;
}

export interface DirectAdminMailboxList {
  domain: string;
  mailboxes: DirectAdminMailbox[];
}

export const wpBoot = window.oxxaStudio;

export async function wpRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!wpBoot) {
    throw new Error(
      "Demo mode: connect the WordPress plugin to perform live network actions.",
    );
  }

  const response = await fetch(
    `${wpBoot.restUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": wpBoot.nonce,
        ...options.headers,
      },
      credentials: "same-origin",
    },
  );

  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.message || "The network request could not be completed.",
    );
  return data as T;
}

export interface DomainSyncResult {
  domains: import("../types").Domain[];
  imported: number;
  updated: number;
  total: number;
  syncedAt: string;
  testMode: boolean;
}

export interface DomainAvailability {
  domain: string;
  available: boolean;
  price: number;
  currency: string;
  message: string;
}

export async function checkDomain(domain: string): Promise<DomainAvailability> {
  if (wpBoot) {
    return wpRequest<DomainAvailability>("domain/check", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 850));
  const taken = ["studio", "google", "oxxa", "example", "atelier"].some(
    (word) => domain.startsWith(word),
  );
  const tld = domain.split(".").pop() || "com";
  const prices: Record<string, number> = {
    com: 12.5,
    nl: 8.25,
    studio: 24,
    design: 32,
    shop: 29,
    co: 22.5,
  };
  return {
    domain,
    available: !taken,
    price: prices[tld] || 16,
    currency: "EUR",
    message: taken
      ? "This domain is already registered."
      : "Available to register through Oxxa.",
  };
}
