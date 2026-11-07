import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { Badge, PageHeading, statusTone } from "../components/UI";
import {
  wpBoot,
  wpRequest,
  type SslCertificate,
  type SslSnapshot,
} from "../lib/wp";

const emptySnapshot: SslSnapshot = {
  configured: false,
  connected: false,
  certificates: [],
  products: [],
  servers: [],
  lastSync: "",
  testMode: true,
};

const demoSnapshot: SslSnapshot = {
  configured: true,
  connected: true,
  testMode: true,
  lastSync: "",
  certificates: [
    {
      id: "SSL-DEMO-101",
      productId: "dv",
      name: "Domain Validation",
      period: 12,
      domain: "ateliermorrow.com",
      sans: "www.ateliermorrow.com",
      autoRenew: true,
      startDate: "2026-10-16",
      endDate: "2027-10-16",
      status: "Active",
    },
    {
      id: "SSL-DEMO-102",
      productId: "wildcard",
      name: "Wildcard DV",
      period: 12,
      domain: "formagroup.nl",
      sans: "*.formagroup.nl",
      autoRenew: false,
      startDate: "2025-11-29",
      endDate: "2026-11-28",
      status: "Active",
    },
    {
      id: "SSL-DEMO-103",
      productId: "business",
      name: "Business Validation",
      period: 12,
      domain: "northstudio.design",
      sans: "",
      autoRenew: true,
      startDate: "",
      endDate: "",
      status: "Pending",
    },
  ],
  products: [
    {
      id: "dv",
      name: "Domain Validation",
      validation: "DV",
      wildcard: false,
      cnameAuth: true,
      vendor: "Demo CA",
      deliveryTime: "Minutes",
      periods: [
        { months: 12, price: 6.95 },
        { months: 24, price: 12.95 },
      ],
    },
    {
      id: "wildcard",
      name: "Wildcard DV",
      validation: "DV",
      wildcard: true,
      cnameAuth: true,
      vendor: "Demo CA",
      deliveryTime: "Minutes",
      periods: [{ months: 12, price: 49.95 }],
    },
    {
      id: "business",
      name: "Business Validation",
      validation: "OV",
      wildcard: false,
      cnameAuth: false,
      vendor: "Demo CA",
      deliveryTime: "1–3 days",
      periods: [{ months: 12, price: 89.95 }],
    },
  ],
  servers: [
    {
      id: "demo-server-1",
      type: "DirectAdmin",
      name: "Demo hosting server",
      host: "https://da.example.test:2222",
      createdAt: "2026-10-01",
    },
  ],
};

function formatDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
    new Date(`${value}T12:00:00`),
  );
}

function daysUntil(value: string) {
  if (!value) return null;
  const target = new Date(`${value}T23:59:59`).getTime();
  return Math.ceil((target - Date.now()) / 86400000);
}

function countLabel(value: number, singular: string) {
  return `${value} ${singular}${value === 1 ? "" : "s"}`;
}

function price(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function Ssl({
  notify,
  onSettings,
}: {
  notify: (title: string, message: string) => void;
  onSettings: () => void;
}) {
  const demo = !wpBoot;
  const [snapshot, setSnapshot] = useState<SslSnapshot>(
    wpBoot ? emptySnapshot : demoSnapshot,
  );
  const [loading, setLoading] = useState(Boolean(wpBoot));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!wpBoot) return;
    let active = true;
    wpRequest<SslSnapshot>("ssl")
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "The SSL inventory could not be loaded.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function synchronize() {
    if (!demo && !snapshot.configured) {
      onSettings();
      notify(
        "Connect Oxxa first",
        "Add and verify your Oxxa API credentials before reading the SSL inventory.",
      );
      return;
    }
    setSyncing(true);
    setError("");
    try {
      let result: SslSnapshot;
      if (demo) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        result = { ...demoSnapshot, lastSync: new Date().toISOString() };
      } else {
        result = await wpRequest<SslSnapshot>("ssl/sync", {
          method: "POST",
        });
      }
      setSnapshot(result);
      notify(
        demo
          ? "Demo SSL inventory refreshed"
          : "Oxxa SSL inventory synchronized",
        demo
          ? "Sample certificates, products and servers were refreshed locally. No Oxxa request was made."
          : `${countLabel(result.certificates.length, "certificate")}, ${countLabel(result.products.length, "product")} and ${countLabel(result.servers.length, "server")} were read. No orders or changes were made.`,
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "The Oxxa SSL inventory could not be synchronized.";
      setError(message);
      notify("SSL sync needs attention", message);
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(
    () =>
      snapshot.certificates.filter((certificate) =>
        `${certificate.domain} ${certificate.name} ${certificate.status}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [snapshot.certificates, query],
  );
  const active = snapshot.certificates.filter((certificate) =>
    ["active", "issued", "valid", "complete"].includes(
      certificate.status.toLowerCase(),
    ),
  ).length;
  const expiring = snapshot.certificates.filter((certificate) => {
    const days = daysUntil(certificate.endDate);
    return days !== null && days >= 0 && days <= 30;
  }).length;
  const autoRenew = snapshot.certificates.filter(
    (certificate) => certificate.autoRenew,
  ).length;

  const heading = (
    <PageHeading
      title="SSL certificates"
      description="Oxxa certificate inventory, products and automatic installation servers."
      actions={
        <>
          {!demo && (
            <button className="button button-secondary" onClick={onSettings}>
              <Settings2 size={16} /> Oxxa settings
            </button>
          )}
          <button
            className="button button-primary"
            disabled={syncing || loading}
            onClick={() => void synchronize()}
          >
            {syncing ? (
              <LoaderCircle size={17} className="spin" />
            ) : (
              <RefreshCw size={17} />
            )}
            {syncing
              ? "Reading Oxxa…"
              : demo
                ? "Refresh demo"
                : "Sync SSL inventory"}
          </button>
        </>
      }
    />
  );

  if (wpBoot && !snapshot.connected) {
    return (
      <div>
        {heading}
        <section className="card ssl-connect">
          {loading ? (
            <>
              <LoaderCircle size={29} className="spin" />
              <h2>Loading SSL inventory…</h2>
              <p>No Oxxa request has been made by this page yet.</p>
            </>
          ) : (
            <>
              <span>
                <ShieldCheck size={29} />
              </span>
              <Badge tone={snapshot.configured ? "blue" : "orange"} dot>
                {snapshot.configured ? "Oxxa configured" : "Oxxa not connected"}
              </Badge>
              <h2>
                {snapshot.configured
                  ? "Run your first read-only SSL sync."
                  : "Connect Oxxa to manage SSL."}
              </h2>
              <p>
                Read existing certificates, product configurations and
                SSL-installation servers. This release never places an order,
                changes auto-renew or creates a server credential.
              </p>
              {error && (
                <div className="ssl-error" role="alert">
                  {error}
                </div>
              )}
              <div>
                <button
                  className="button button-secondary"
                  onClick={onSettings}
                >
                  <Settings2 size={16} /> Open Oxxa settings
                </button>
                {snapshot.configured && (
                  <button
                    className="button button-primary"
                    disabled={syncing}
                    onClick={() => void synchronize()}
                  >
                    <RefreshCw size={16} className={syncing ? "spin" : ""} />
                    {syncing ? "Reading inventory…" : "Sync SSL inventory"}
                  </button>
                )}
              </div>
              <small>
                Commands used: ssl_list, ssl_product_list and server_list.
              </small>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div>
      {heading}
      {error && (
        <div className="ssl-error standalone" role="alert">
          {error} Cached values remain visible.
        </div>
      )}
      <div className="ssl-readonly-note">
        <LockKeyhole size={17} />
        <div>
          <strong>
            {demo ? "Illustrative SSL workspace" : "Read-only SSL inventory"}
          </strong>
          <span>
            {demo
              ? "All certificates, prices and servers below are sample data."
              : "No certificate orders, cancellations, renewals, server updates or installations are executed."}
          </span>
        </div>
        <Badge tone={demo ? "blue" : "green"} dot>
          {demo ? "Demo data" : "Oxxa synchronized"}
        </Badge>
      </div>

      <section className="compact-stats ssl-stats">
        <article className="card">
          <div className="compact-stat-icon green">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span>Certificates</span>
            <strong>{snapshot.certificates.length}</strong>
            <small>{active} active or issued</small>
          </div>
        </article>
        <article className="card">
          <div className="compact-stat-icon orange">
            <CalendarClock size={20} />
          </div>
          <div>
            <span>Expiring in 30 days</span>
            <strong>{expiring}</strong>
            <small>Based on Oxxa end dates</small>
          </div>
        </article>
        <article className="card">
          <div className="compact-stat-icon blue">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span>Auto-renew enabled</span>
            <strong>{autoRenew}</strong>
            <small>Provider setting, not changed here</small>
          </div>
        </article>
        <article className="card">
          <div className="compact-stat-icon purple">
            <Server size={20} />
          </div>
          <div>
            <span>Install servers</span>
            <strong>{snapshot.servers.length}</strong>
            <small>For Oxxa SSL automation</small>
          </div>
        </article>
      </section>

      <section className="card table-card ssl-certificates">
        <header className="card-header ssl-section-heading">
          <div>
            <h2>Certificate inventory</h2>
            <p>
              Existing certificates read from your Oxxa account. Last sync:{" "}
              {snapshot.lastSync
                ? formatDate(snapshot.lastSync.slice(0, 10))
                : demo
                  ? "Demo not refreshed"
                  : "—"}
            </p>
          </div>
          <label className="inline-search">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search certificate…"
            />
          </label>
        </header>
        <div className="table-wrap">
          <table className="data-table ssl-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Certificate</th>
                <th>Status</th>
                <th>Valid from</th>
                <th>Expires</th>
                <th>Auto-renew</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((certificate) => (
                <CertificateRow
                  certificate={certificate}
                  key={certificate.id}
                />
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <div className="small-empty">
              No certificates match your search.
            </div>
          )}
        </div>
        <footer className="table-footer">
          <span>
            Showing {filtered.length} of {snapshot.certificates.length}{" "}
            certificates
          </span>
          <span>CSR, identity and validation content is not cached.</span>
        </footer>
      </section>

      <section className="ssl-secondary-grid">
        <article className="card ssl-products">
          <header className="card-header">
            <div>
              <h2>Oxxa SSL products</h2>
              <p>Configurations and API prices per requested period.</p>
            </div>
            <Badge tone="neutral">
              {countLabel(snapshot.products.length, "product")}
            </Badge>
          </header>
          <div className="ssl-product-list">
            {snapshot.products.map((product) => (
              <div className="ssl-product-row" key={product.id}>
                <span className="ssl-product-icon">
                  <ShieldCheck size={18} />
                </span>
                <div className="ssl-product-name">
                  <strong>{product.name}</strong>
                  <small>
                    {product.vendor || "Oxxa SSL"}
                    {product.deliveryTime ? ` · ${product.deliveryTime}` : ""}
                  </small>
                </div>
                <div className="ssl-product-flags">
                  {product.validation && (
                    <Badge tone="blue">{product.validation}</Badge>
                  )}
                  {product.wildcard && <Badge tone="purple">Wildcard</Badge>}
                  {product.cnameAuth && <Badge tone="green">CNAME auth</Badge>}
                </div>
                <div className="ssl-periods">
                  {product.periods.map((period) => (
                    <span key={period.months}>
                      {period.months} months{" "}
                      <strong>{price(period.price)}</strong>
                    </span>
                  ))}
                  {!product.periods.length && <span>Price not supplied</span>}
                </div>
              </div>
            ))}
            {!snapshot.products.length && (
              <div className="small-empty">No SSL products were returned.</div>
            )}
          </div>
          <footer className="ssl-card-footer">
            <ShoppingCart size={14} /> Ordering requires a separate confirmed
            checkout and is not enabled.
          </footer>
        </article>

        <article className="card ssl-servers">
          <header className="card-header">
            <div>
              <h2>Automatic installation servers</h2>
              <p>Server references already stored in your Oxxa account.</p>
            </div>
          </header>
          <div className="ssl-server-list">
            {snapshot.servers.map((server) => (
              <div className="ssl-server-row" key={server.id}>
                <span>
                  <Server size={18} />
                </span>
                <div>
                  <strong>{server.name}</strong>
                  <small>{server.host}</small>
                  <Badge
                    tone={server.type === "DirectAdmin" ? "green" : "blue"}
                  >
                    {server.type}
                  </Badge>
                </div>
                <time>{formatDate(server.createdAt)}</time>
              </div>
            ))}
            {!snapshot.servers.length && (
              <div className="small-empty">
                <Globe2 size={17} /> No Oxxa SSL installation servers found.
              </div>
            )}
          </div>
          <footer className="ssl-card-footer">
            <LockKeyhole size={14} /> Passwords and Login Keys are never
            returned by server_list.
          </footer>
        </article>
      </section>
    </div>
  );
}

function CertificateRow({ certificate }: { certificate: SslCertificate }) {
  const days = daysUntil(certificate.endDate);
  const expiring = days !== null && days >= 0 && days <= 30;
  return (
    <tr>
      <td>
        <div className="ssl-domain-cell">
          <Globe2 size={15} />
          <div>
            <strong>{certificate.domain || "Domain pending"}</strong>
            {certificate.sans && <small>SANs: {certificate.sans}</small>}
          </div>
        </div>
      </td>
      <td>
        <strong className="ssl-certificate-name">{certificate.name}</strong>
        <small className="ssl-period-label">
          {certificate.period || "—"} months
        </small>
      </td>
      <td>
        <Badge tone={statusTone(certificate.status)} dot>
          {certificate.status}
        </Badge>
      </td>
      <td>{formatDate(certificate.startDate)}</td>
      <td>
        <span className={expiring ? "expiry-soon" : ""}>
          {formatDate(certificate.endDate)}
        </span>
        {expiring && <small className="ssl-days-left">{days} days left</small>}
      </td>
      <td>
        <Badge tone={certificate.autoRenew ? "green" : "neutral"}>
          {certificate.autoRenew ? "Enabled" : "Disabled"}
        </Badge>
      </td>
    </tr>
  );
}
