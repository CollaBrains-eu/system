export type PageId =
  | "overview"
  | "sites"
  | "clients"
  | "domains"
  | "hosting"
  | "billing"
  | "studio"
  | "templates"
  | "settings"
  | "setup";

export type SiteStatus = "Live" | "Draft" | "Maintenance";

export interface Site {
  id: number;
  name: string;
  client: string;
  domain: string;
  networkPath: string;
  status: SiteStatus;
  template: string;
  updated: string;
  visits: string;
  storage: number;
  theme: string;
  accent: string;
  initials: string;
}

export interface Domain {
  id: number;
  name: string;
  client: string;
  expiry: string;
  autoRenew: boolean;
  status: "Active" | "Expiring soon" | "Pending" | "Expired";
  site: string;
  dns: "Connected" | "Action needed" | "Not verified";
  nsgroup?: string;
  registrant?: string;
  lastRenewed?: string;
}

export interface Client {
  id: number;
  name: string;
  contact: string;
  email: string;
  sites: number;
  mrr: number;
  status: "Active" | "Lead" | "Paused";
  initials: string;
  color: string;
  since: string;
}

export interface Invoice {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: "Paid" | "Open" | "Overdue";
  period: string;
  description?: string;
  issueDate?: string;
  dueDate?: string;
}

export interface StudioTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  accent: string;
  sites: number;
  style:
    "editorial" | "commerce" | "portfolio" | "business" | "restaurant" | "saas";
}

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type?: "success" | "info";
}
