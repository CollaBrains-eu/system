import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Wordpress } from "../components/Wordpress";
import { checkDomain, wpBoot, type DomainAvailability } from "../lib/wp";
import { templates } from "../data";
import type { Client, Invoice, Site, StudioTemplate } from "../types";
import { Badge, Modal, TemplatePreview } from "./UI";

export function NewSiteModal({
  clients,
  initialTemplate,
  onClose,
  onCreate,
}: {
  clients: Client[];
  initialTemplate: StudioTemplate | null;
  onClose: () => void;
  onCreate: (site: Site) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [client, setClient] = useState(clients[0]?.name || "");
  const [domain, setDomain] = useState("");
  const [template, setTemplate] = useState<StudioTemplate>(
    initialTemplate || templates[0],
  );
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const slug =
    path ||
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const networkDomain = wpBoot?.networkDomain || "northco.network";
  const isSubdomain = wpBoot?.multisiteType === "Subdomain";
  const networkAddress = isSubdomain
    ? `${slug}.${networkDomain}`
    : `${networkDomain}/${slug}`;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Give your new website a name to continue.");
      return;
    }
    if (!slug) {
      setError("Enter a valid network address.");
      return;
    }
    setLoading(true);
    setError("");
    const newSite: Site = {
      id: Date.now(),
      name: name.trim(),
      client,
      domain: domain.trim() || networkAddress,
      networkPath: `/${slug}/`,
      status: "Draft",
      template: template.name,
      updated: "Just now",
      visits: "—",
      storage: 0.2,
      theme: template.color,
      accent: template.accent,
      initials: name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };
    try {
      await onCreate(newSite);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The website could not be created.",
      );
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Create a new website"
      subtitle="Provision a client site on your WordPress Multisite network."
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={submit}>
        <div className="modal-form-content">
          <div className="form-step-heading">
            <span>1</span>
            <div>
              <strong>Website details</strong>
              <p>Name the site and assign it to a client.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Website name
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Miller & Co."
              />
            </label>
            <label>
              Client
              <select
                value={client}
                onChange={(event) => setClient(event.target.value)}
              >
                {clients.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label className="full-field">
              Network address
              <div className="domain-input-prefix">
                {!isSubdomain && <span>{networkDomain}/</span>}
                <input
                  value={path}
                  onChange={(event) =>
                    setPath(
                      event.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  placeholder={slug || "client-site"}
                />
                <span>{isSubdomain ? `.${networkDomain}` : "/"}</span>
              </div>
              <small>WordPress site ID will be assigned automatically.</small>
            </label>
          </div>
          <div className="form-step-heading">
            <span>2</span>
            <div>
              <strong>Choose a starting point</strong>
              <p>You can customize every detail after provisioning.</p>
            </div>
          </div>
          <div className="modal-template-options">
            {templates.slice(0, 4).map((item) => (
              <button
                type="button"
                className={template.id === item.id ? "active" : ""}
                onClick={() => setTemplate(item)}
                key={item.id}
              >
                <div>
                  <TemplatePreview template={item} />
                  {template.id === item.id && (
                    <span>
                      <Check size={12} />
                    </span>
                  )}
                </div>
                <strong>{item.name}</strong>
                <small>{item.category}</small>
              </button>
            ))}
          </div>
          <div className="form-step-heading">
            <span>3</span>
            <div>
              <strong>
                Connect a domain <em>Optional</em>
              </strong>
              <p>Map an existing domain or register it later through Oxxa.</p>
            </div>
          </div>
          <label>
            Custom domain
            <div className="input-with-icon">
              <Globe2 size={16} />
              <input
                value={domain}
                onChange={(event) =>
                  setDomain(event.target.value.toLowerCase())
                }
                placeholder="www.clientwebsite.com"
              />
            </div>
          </label>
          {domain && (
            <div className="checkbox-row">
              <ShieldCheck size={16} />
              <span>
                <strong>No domain is ordered during site creation</strong>
                <small>
                  Use Register domain afterward to check availability and
                  confirm Oxxa pricing.
                </small>
              </span>
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
        </div>
        <footer className="modal-footer">
          <span>
            <ShieldCheck size={14} /> Super admin protected
          </span>
          <div>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={loading}>
              {loading ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Wordpress size={17} />
              )}
              {loading ? "Provisioning…" : "Create website"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}

export function DomainSearchModal({
  onClose,
  onRegister,
}: {
  onClose: () => void;
  onRegister: (result: DomainAvailability) => Promise<void>;
}) {
  const [input, setInput] = useState("craftedspaces");
  const [tld, setTld] = useState(".com");
  const [results, setResults] = useState<DomainAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [checkout, setCheckout] = useState<DomainAvailability | null>(null);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");

  async function search(event?: React.FormEvent) {
    event?.preventDefault();
    const clean = input
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/[^a-z0-9.-]/g, "")
      .replace(/\.$/, "");
    if (!clean) {
      setError("Enter a domain name to check.");
      return;
    }
    setLoading(true);
    setSearched(true);
    setError("");
    setCheckout(null);
    const primary = clean.includes(".") ? clean : `${clean}${tld}`;
    const base = primary.split(".")[0];
    try {
      const checks = [primary, `${base}.nl`, `${base}.studio`, `${base}.design`]
        .filter((item, index, array) => array.indexOf(item) === index)
        .slice(0, 4);
      const data = await Promise.all(
        checks.map((domain) => checkDomain(domain)),
      );
      setResults(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Oxxa could not check this domain. Please try again.",
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    if (!checkout) return;
    setRegistering(true);
    setError("");
    try {
      await onRegister(checkout);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Registration failed. No changes were made.",
      );
      setRegistering(false);
    }
  }

  return (
    <Modal
      title="Find the perfect domain"
      subtitle="Real-time availability and reseller pricing through Oxxa."
      onClose={onClose}
      size="lg"
    >
      <div className="domain-search-modal-content">
        <form className="domain-search-box" onSubmit={search}>
          <Globe2 size={20} />
          <input
            autoFocus
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Your next big idea"
            aria-label="Domain name"
          />
          {!input.includes(".") && (
            <select
              value={tld}
              onChange={(event) => setTld(event.target.value)}
              aria-label="Domain extension"
            >
              <option>.com</option>
              <option>.nl</option>
              <option>.studio</option>
              <option>.design</option>
              <option>.shop</option>
              <option>.co</option>
            </select>
          )}
          <button className="button button-primary" disabled={loading}>
            {loading ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <Search size={17} />
            )}
            {loading ? "Checking…" : "Check availability"}
          </button>
        </form>
        {error && <div className="form-error">{error}</div>}
        {!searched ? (
          <div className="domain-search-intro">
            <span>
              <Sparkles size={24} />
            </span>
            <h3>Your next project starts here.</h3>
            <p>
              Search more than 1,200 extensions. Register and connect your
              domain to any network site.
            </p>
            <div>
              <Badge tone="green">
                <Check size={12} /> Real-time Oxxa API
              </Badge>
              <Badge>
                <LockKeyhole size={12} /> Secure registration
              </Badge>
            </div>
          </div>
        ) : loading ? (
          <div className="domain-results-loading">
            {[1, 2, 3].map((item) => (
              <div key={item}>
                <span />
                <span />
              </div>
            ))}
          </div>
        ) : (
          <div className="domain-results">
            <div className="domain-results-label">
              SEARCH RESULTS <span>{results.length} extensions</span>
            </div>
            {results.map((result, index) => (
              <div
                className={`domain-result ${index === 0 ? "primary-result" : ""}`}
                key={result.domain}
              >
                <span
                  className={`domain-result-icon ${result.available ? "available" : "taken"}`}
                >
                  {result.available ? <Check size={18} /> : "×"}
                </span>
                <div>
                  <strong>{result.domain}</strong>
                  <span>{result.message}</span>
                </div>
                {result.available &&
                wpBoot &&
                !wpBoot.testMode &&
                result.price <= 0 ? (
                  <Badge tone="orange">Price on request</Badge>
                ) : result.available ? (
                  <>
                    <span className="domain-price">
                      <strong>€{result.price.toFixed(2)}</strong>
                      <small>/ first year</small>
                    </span>
                    <button
                      className={`button ${index === 0 ? "button-primary" : "button-secondary"}`}
                      onClick={() => setCheckout(result)}
                    >
                      Register <Plus size={15} />
                    </button>
                  </>
                ) : (
                  <Badge>Unavailable</Badge>
                )}
              </div>
            ))}
            {results.length === 0 && (
              <div className="small-empty">
                No results returned. Try a different name or extension.
              </div>
            )}
          </div>
        )}
        {checkout && (
          <div className="domain-checkout">
            <div>
              <span className="domain-checkout-icon">
                <Globe2 size={20} />
              </span>
              <div>
                <strong>Register {checkout.domain}</strong>
                <p>
                  1 year · €{checkout.price.toFixed(2)} · Auto-renew enabled
                </p>
              </div>
            </div>
            <div className="domain-checkout-note">
              <ShieldCheck size={15} />
              <span>
                {wpBoot?.testMode
                  ? "Oxxa test mode is on. This validates the workflow without processing a registration order."
                  : wpBoot
                    ? "This will submit a paid registration to your connected Oxxa account."
                    : "Preview only — no real domain will be registered in demo mode."}
              </span>
            </div>
            <footer>
              <button
                className="button button-secondary"
                onClick={() => setCheckout(null)}
              >
                Back
              </button>
              <button
                className="button button-primary"
                disabled={registering}
                onClick={register}
              >
                {registering ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {registering
                  ? "Registering…"
                  : `${wpBoot?.testMode ? "Confirm test" : "Confirm registration"} · €${checkout.price.toFixed(2)}`}
              </button>
            </footer>
          </div>
        )}
      </div>
      <footer className="domain-modal-note">
        <LockKeyhole size={13} /> Registration is always confirmed before
        submitting to Oxxa.
      </footer>
    </Modal>
  );
}

export function NewClientModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (client: Client) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [mrr, setMrr] = useState("99");
  const [status, setStatus] = useState<Client["status"]>("Lead");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name || !contact || !email.includes("@")) {
      setError("Add a company, contact name and valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onCreate({
        id: Date.now(),
        name,
        contact,
        email,
        sites: 0,
        mrr: Number(mrr) || 0,
        status,
        initials: name
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        color: "#e2e7db",
        since: "Nov 2026",
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The client could not be saved.",
      );
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Add a new client"
      subtitle="Create a client record for sites, services and billing."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-form-content">
          <div className="new-client-avatar">
            <span>
              {name ? (
                name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              ) : (
                <Plus size={21} />
              )}
            </span>
            <div>
              <strong>Client profile</strong>
              <p>You can invite them to the portal later.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="full-field">
              Company or client name
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Miller & Co."
              />
            </label>
            <label>
              Primary contact
              <input
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                placeholder="Full name"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hello@company.com"
              />
            </label>
            <label>
              Monthly service plan
              <div className="currency-input">
                <span>€</span>
                <input
                  type="number"
                  min="0"
                  value={mrr}
                  onChange={(event) => setMrr(event.target.value)}
                />
              </div>
            </label>
            <label>
              Initial status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as Client["status"])
                }
              >
                <option>Lead</option>
                <option>Active</option>
                <option>Paused</option>
              </select>
            </label>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <footer className="modal-footer">
          <span />
          <div>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={loading}>
              {loading ? <LoaderCircle size={16} className="spin" /> : null}
              {loading ? "Saving…" : "Add client"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}

export function NewInvoiceModal({
  clients,
  onClose,
  onCreate,
}: {
  clients: Client[];
  onClose: () => void;
  onCreate: (invoice: Invoice) => Promise<void>;
}) {
  const [client, setClient] = useState(clients[0]?.name || "");
  const [amount, setAmount] = useState("199");
  const [status, setStatus] = useState<Invoice["status"]>("Open");
  const [description, setDescription] = useState(
    "Website hosting & care — November 2026",
  );
  const [issueDate, setIssueDate] = useState("2026-11-07");
  const [dueDate, setDueDate] = useState("2026-11-21");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!client) {
      setError("Add a client before creating an invoice.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onCreate({
        id: `INV-2026-${String(149 + Math.floor(Math.random() * 30)).padStart(4, "0")}`,
        client,
        date: "07 Nov 2026",
        amount: Number(amount) || 0,
        status,
        period: "November 2026",
        description,
        issueDate,
        dueDate,
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The invoice could not be saved.",
      );
      setLoading(false);
    }
  }

  return (
    <Modal
      title="Create an invoice"
      subtitle="Bill a client for hosting, care or studio services."
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="modal-form-content">
          <div className="form-grid">
            <label className="full-field">
              Client
              <select
                value={client}
                onChange={(event) => setClient(event.target.value)}
              >
                {clients.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Amount (incl. VAT)
              <div className="currency-input">
                <span>€</span>
                <input
                  autoFocus
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as Invoice["status"])
                }
              >
                <option>Open</option>
                <option>Paid</option>
                <option>Overdue</option>
              </select>
            </label>
            <label className="full-field">
              Description
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label>
              Issue date
              <input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
              />
            </label>
            <label>
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
          </div>
          <div className="invoice-summary-row">
            <span>Invoice total</span>
            <strong>€{(Number(amount) || 0).toFixed(2)}</strong>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <footer className="modal-footer">
          <span>
            <LockKeyhole size={13} /> Saved as a draft until sent
          </span>
          <div>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button button-primary" disabled={loading}>
              {loading ? <LoaderCircle size={16} className="spin" /> : null}
              {loading ? "Saving…" : "Create invoice"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </footer>
      </form>
    </Modal>
  );
}
