import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Cloud,
  Database,
  ExternalLink,
  HardDrive,
  LoaderCircle,
  RefreshCw,
  Server,
  Settings2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { UsageRing } from "../components/Charts";
import DirectAdminMailboxes from "../components/DirectAdminMailboxes";
import { Badge, PageHeading } from "../components/UI";
import type { Site } from "../types";
import { wpBoot, wpRequest, type DirectAdminSnapshot } from "../lib/wp";

function formatMb(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} TB`;
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

function percentage(used: number | null, limit: number | null) {
  if (used === null || limit === null || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export default function Hosting({
  sites,
  notify,
  onSettings,
}: {
  sites: Site[];
  notify: (title: string, message: string) => void;
  onSettings: () => void;
}) {
  const demo = !wpBoot;
  const [snapshot, setSnapshot] = useState<DirectAdminSnapshot | null>(null);
  const [loading, setLoading] = useState(Boolean(wpBoot));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!wpBoot) return;
    let active = true;
    wpRequest<DirectAdminSnapshot>("directadmin")
      .then((data) => {
        if (active) setSnapshot(data);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "DirectAdmin status could not be loaded.",
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
    if (!snapshot?.configured) {
      onSettings();
      notify(
        "Open the DirectAdmin tab",
        "Add the HTTPS URL, username and a restricted Login Key, test them, then save your settings.",
      );
      return;
    }
    setSyncing(true);
    setError("");
    try {
      const result = await wpRequest<DirectAdminSnapshot>("directadmin/sync", {
        method: "POST",
      });
      setSnapshot(result);
      notify(
        "DirectAdmin synchronized",
        `Real user-level usage for ${result.account?.domain || result.username} is now available. No hosting settings were changed.`,
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "DirectAdmin could not be synchronized.";
      setError(message);
      notify("DirectAdmin sync needs attention", message);
    } finally {
      setSyncing(false);
    }
  }

  const heading = (
    <PageHeading
      title="Hosting"
      description="DirectAdmin account resources and your WordPress network inventory."
      actions={
        demo ? (
          <>
            <a
              className="button button-secondary"
              href="https://my.oxxa.com"
              target="_blank"
              rel="noreferrer"
            >
              Oxxa portal <ExternalLink size={16} />
            </a>
            <button
              className="button button-primary"
              onClick={() =>
                notify(
                  "Demo package options",
                  "Package changes are illustrative in preview mode. No hosting plan was changed.",
                )
              }
            >
              <Zap size={17} /> Manage demo package
            </button>
          </>
        ) : (
          <>
            <button className="button button-secondary" onClick={onSettings}>
              <Settings2 size={16} /> DirectAdmin settings
            </button>
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
              {syncing ? "Synchronizing…" : "Sync DirectAdmin"}
            </button>
          </>
        )
      }
    />
  );

  const liveUsage = Boolean(
    wpBoot && snapshot?.connected && snapshot.account && snapshot.usage,
  );
  if (wpBoot && !liveUsage) {
    return (
      <div>
        {heading}
        <section className="card directadmin-connect">
          {loading ? (
            <>
              <LoaderCircle size={28} className="spin" />
              <h2>Loading DirectAdmin status…</h2>
              <p>No hosting data has been requested yet.</p>
            </>
          ) : (
            <>
              <span className="directadmin-connect-icon">
                {snapshot?.configured ? (
                  <Server size={28} />
                ) : (
                  <Cloud size={28} />
                )}
              </span>
              <Badge tone={snapshot?.configured ? "blue" : "orange"} dot>
                {snapshot?.configured
                  ? "Credentials saved"
                  : "DirectAdmin not connected"}
              </Badge>
              <h2>
                {snapshot?.configured
                  ? "Run your first read-only sync."
                  : "Connect real hosting usage."}
              </h2>
              <p>
                {snapshot?.configured
                  ? `${snapshot.url} · ${snapshot.username}. Read the current account configuration and usage; nothing will be created or modified.`
                  : "Use a scoped DirectAdmin Login Key to import package limits, disk usage, bandwidth and account counts. Sample hosting metrics are never used in live mode."}
              </p>
              {error && (
                <div className="directadmin-error" role="alert">
                  {error}
                </div>
              )}
              <div className="directadmin-connect-actions">
                <button
                  className="button button-secondary"
                  onClick={onSettings}
                >
                  <Settings2 size={16} /> Open settings
                </button>
                {snapshot?.configured && (
                  <button
                    className="button button-primary"
                    disabled={syncing}
                    onClick={() => void synchronize()}
                  >
                    <RefreshCw size={16} className={syncing ? "spin" : ""} />
                    {syncing ? "Reading account…" : "Sync account now"}
                  </button>
                )}
              </div>
              <small>
                Required Login Key commands: CMD_API_SHOW_USER_CONFIG and
                CMD_API_SHOW_USER_USAGE.
              </small>
            </>
          )}
        </section>
      </div>
    );
  }

  const usage = snapshot?.usage;
  const account = snapshot?.account;
  const diskPercent = demo
    ? 68
    : percentage(usage?.diskUsedMb ?? null, usage?.diskLimitMb ?? null);
  const bandwidthPercent = demo
    ? 47
    : percentage(
        usage?.bandwidthUsedMb ?? null,
        usage?.bandwidthLimitMb ?? null,
      );
  const diskUsed = demo ? "170 GB" : formatMb(usage?.diskUsedMb);
  const diskLimit = demo
    ? "of 250 GB"
    : usage?.diskUnlimited
      ? "Unlimited quota"
      : `of ${formatMb(usage?.diskLimitMb)}`;
  const bandwidthUsed = demo ? "1.4 TB" : formatMb(usage?.bandwidthUsedMb);
  const bandwidthLimit = demo
    ? "of 3 TB"
    : usage?.bandwidthUnlimited
      ? "Unlimited bandwidth"
      : `of ${formatMb(usage?.bandwidthLimitMb)}`;

  return (
    <div>
      {heading}
      {error && (
        <div className="directadmin-error standalone" role="alert">
          {error} Previously cached values remain visible.
        </div>
      )}
      <section className="hosting-plan-card card">
        <div className="hosting-plan-brand">
          <span>{demo ? <Cloud size={28} /> : <Server size={28} />}</span>
          <div>
            <small>
              {demo ? "DEMO RESELLER HOSTING" : "DIRECTADMIN USER ACCOUNT"}
            </small>
            <h2>{demo ? "OX Professional" : account?.package || "custom"}</h2>
            <p>
              {demo
                ? "Illustrative hosting plan for preview mode."
                : `${account?.domain || snapshot?.url} · ${account?.type || "user"} level`}
            </p>
          </div>
        </div>
        <div className="hosting-plan-meta">
          <div>
            <span>{demo ? "Monthly plan" : "Account"}</span>
            <strong>{demo ? "€49.95" : snapshot?.username}</strong>
          </div>
          <div>
            <span>{demo ? "Next renewal" : "Last synchronized"}</span>
            <strong>
              {demo
                ? "01 Dec 2026"
                : snapshot?.lastSync
                  ? new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(snapshot.lastSync))
                  : "—"}
            </strong>
          </div>
          <Badge
            tone={demo ? "blue" : account?.suspended ? "red" : "green"}
            dot
          >
            {demo ? "Demo data" : account?.suspended ? "Suspended" : "Active"}
          </Badge>
        </div>
      </section>
      <section className="resource-cards">
        <article className="card resource-card">
          <header>
            <div>
              <HardDrive size={18} />
              <span>Storage</span>
            </div>
            <Badge
              tone={
                demo ? "blue" : (diskPercent ?? 0) >= 90 ? "orange" : "green"
              }
            >
              {demo
                ? "Demo"
                : usage?.diskUnlimited
                  ? "Unlimited"
                  : "DirectAdmin"}
            </Badge>
          </header>
          <div className="resource-card-main">
            <UsageRing
              value={diskPercent ?? 0}
              label={diskUsed}
              sublabel={diskLimit}
              size={120}
            />
            <div>
              <strong>
                {diskPercent === null ? diskUsed : `${diskPercent}% used`}
              </strong>
              <span>
                {demo
                  ? "80 GB available"
                  : usage?.diskUnlimited
                    ? "No package disk limit"
                    : `${formatMb(usage?.diskLimitMb !== null && usage?.diskLimitMb !== undefined && usage?.diskUsedMb !== null ? Math.max(0, usage.diskLimitMb - usage.diskUsedMb) : null)} available`}
              </span>
              <small>
                {demo
                  ? "Across 148 sample websites"
                  : "Current user-level account"}
              </small>
            </div>
          </div>
          <footer>
            <span>
              {demo ? "Illustrative forecast" : "Reported by DirectAdmin"}
            </span>
            <ArrowUpRight size={15} />
          </footer>
        </article>
        <article className="card resource-card">
          <header>
            <div>
              <Zap size={18} />
              <span>Bandwidth</span>
            </div>
            <Badge
              tone={
                demo
                  ? "blue"
                  : (bandwidthPercent ?? 0) >= 90
                    ? "orange"
                    : "green"
              }
            >
              {demo
                ? "Demo"
                : usage?.bandwidthUnlimited
                  ? "Unlimited"
                  : "DirectAdmin"}
            </Badge>
          </header>
          <div className="resource-card-main">
            <UsageRing
              value={bandwidthPercent ?? 0}
              label={bandwidthUsed}
              sublabel={bandwidthLimit}
              size={120}
              color="#71969b"
            />
            <div>
              <strong>
                {bandwidthPercent === null
                  ? bandwidthUsed
                  : `${bandwidthPercent}% used`}
              </strong>
              <span>
                {demo
                  ? "1.6 TB remaining"
                  : usage?.bandwidthUnlimited
                    ? "No package bandwidth limit"
                    : `${formatMb(usage?.bandwidthLimitMb !== null && usage?.bandwidthLimitMb !== undefined && usage?.bandwidthUsedMb !== null ? Math.max(0, usage.bandwidthLimitMb - usage.bandwidthUsedMb) : null)} remaining`}
              </span>
              <small>
                {demo
                  ? "Sample accounting period"
                  : "Current DirectAdmin period"}
              </small>
            </div>
          </div>
          <footer>
            <span>
              {demo
                ? "Illustrative comparison"
                : "User-level, not reseller aggregate"}
            </span>
            <ArrowUpRight size={15} />
          </footer>
        </article>
        <article className="card resource-card">
          <header>
            <div>
              <Database size={18} />
              <span>{demo ? "Account inventory" : "Account services"}</span>
            </div>
            <Badge tone={demo ? "blue" : "green"}>
              {demo ? "Demo" : "Live counts"}
            </Badge>
          </header>
          <div className="directadmin-usage-list">
            {[
              {
                label: "Domains",
                value: demo ? 148 : usage?.domainsUsed,
                limit: demo
                  ? 200
                  : usage?.domainsUnlimited
                    ? "Unlimited"
                    : usage?.domainsLimit,
              },
              {
                label: "E-mail accounts",
                value: demo ? 86 : usage?.emailAccounts,
              },
              { label: "Databases", value: demo ? 42 : usage?.databases },
              { label: "FTP accounts", value: demo ? 18 : usage?.ftpAccounts },
            ].map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <strong>
                  {row.value ?? "—"}
                  {row.limit !== undefined && <small> / {row.limit}</small>}
                </strong>
              </div>
            ))}
          </div>
          <footer>
            <span>
              {demo ? "Illustrative account" : "Read from account usage"}
            </span>
            <Database size={15} />
          </footer>
        </article>
      </section>
      <DirectAdminMailboxes
        domain={demo ? "ateliermorrow.com" : account?.domain || ""}
        demo={demo}
        notify={notify}
      />
      <section className="hosting-content-grid">
        <article className="card hosting-sites-card">
          <header className="card-header">
            <div>
              <h2>WordPress site inventory</h2>
              <p>
                {demo
                  ? "Illustrative storage across the sample network"
                  : "Per-site hosting metrics require a separate measurement adapter"}
              </p>
            </div>
          </header>
          <table className="data-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Storage</th>
                <th>Bandwidth</th>
                <th>PHP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sites.slice(0, 5).map((site, index) => (
                <tr key={site.id}>
                  <td>
                    <div className="hosting-site-name">
                      <span>{site.initials}</span>
                      <div>
                        <strong>{site.name}</strong>
                        <small>{site.domain}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{demo ? `${site.storage} GB` : "—"}</strong>
                  </td>
                  <td>{demo ? `${[84, 64, 48, 37, 0][index]} GB` : "—"}</td>
                  <td>
                    <span className="php-label">{demo ? "8.3" : "—"}</span>
                  </td>
                  <td>
                    <Badge
                      tone={site.status === "Maintenance" ? "orange" : "green"}
                      dot
                    >
                      {site.status === "Draft" ? "Inactive" : site.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sites.length && (
            <div className="small-empty">No WordPress sites found.</div>
          )}
        </article>
        <aside className="hosting-side">
          <article className="card service-status-card">
            <header className="card-header">
              <div>
                <h2>Connection status</h2>
                <p>
                  {demo
                    ? "Illustrative service health"
                    : "Only verified API states"}
                </p>
              </div>
              <span className="live-pulse" />
            </header>
            {(demo
              ? [
                  {
                    icon: Server,
                    label: "Demo web servers",
                    detail: "Sample operational",
                  },
                  {
                    icon: Database,
                    label: "Demo database cluster",
                    detail: "Sample operational",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Demo SSL & security",
                    detail: "Sample protected",
                  },
                ]
              : [
                  {
                    icon: Server,
                    label: "DirectAdmin API",
                    detail: "Read successfully",
                  },
                  {
                    icon: ShieldCheck,
                    label: "Hosting account",
                    detail: account?.suspended ? "Suspended" : "Active",
                  },
                  {
                    icon: Database,
                    label: "Server load & service health",
                    detail: "Not monitored by this connection",
                  },
                ]
            ).map(({ icon: Icon, label, detail }) => (
              <div className="service-row" key={label}>
                <span>
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
                {detail.startsWith("Not monitored") ? (
                  <span
                    className="service-unverified"
                    aria-label="Not monitored"
                  >
                    —
                  </span>
                ) : (
                  <CheckCircle2 size={17} />
                )}
              </div>
            ))}
            <footer>
              <span>
                <span className="status-dot" />{" "}
                {demo ? "Demo services" : "API connection verified"}
              </span>
              {!demo && snapshot?.url && (
                <a
                  href={snapshot.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open DirectAdmin"
                >
                  <ArrowUpRight size={15} />
                </a>
              )}
            </footer>
          </article>
          <article className="backup-card">
            <div>
              {demo ? <Check size={20} /> : <ShieldCheck size={20} />}
              <span>{demo ? "Demo backup" : "Backups not connected"}</span>
            </div>
            <h3>
              {demo
                ? "Yesterday’s sample backup is ready."
                : "No backup status is reported."}
            </h3>
            <p>
              {demo
                ? "148 sample sites · illustrative off-site storage"
                : "Connect a backup provider before scheduling or verifying restores."}
            </p>
            <button
              onClick={() =>
                notify(
                  demo ? "Demo backup queued" : "Backup provider not connected",
                  demo
                    ? "A sample backup was queued locally. No live files were changed."
                    : "This DirectAdmin read-only connection does not create or verify backups.",
                )
              }
            >
              {demo ? "Create a demo backup" : "About backups"}{" "}
              <ArrowRight size={15} />
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
}
