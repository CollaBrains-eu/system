import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Download,
  Globe2,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Domain } from "../types";
import { Badge, PageHeading, Switch, statusTone } from "../components/UI";

interface DomainsProps {
  domains: Domain[];
  onDomainSearch: () => void;
  onToggle: (id: number) => void;
  onSelect: (domain: Domain) => void;
  notify: (title: string, message: string) => void;
}

export default function Domains({
  domains,
  onDomainSearch,
  onToggle,
  onSelect,
  notify,
}: DomainsProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All domains");
  const filtered = useMemo(
    () =>
      domains.filter((domain) => {
        const matchesQuery = `${domain.name} ${domain.client}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "All domains" ||
          (filter === "Expiring soon"
            ? domain.status === "Expiring soon"
            : filter === "Auto-renew on"
              ? domain.autoRenew
              : domain.dns === "Action needed");
        return matchesQuery && matchesFilter;
      }),
    [domains, query, filter],
  );

  function exportDomains() {
    const csv = [
      "Domain,Client,Expiry,Auto renew,Status",
      ...filtered.map(
        (domain) =>
          `${domain.name},${domain.client},${domain.expiry},${domain.autoRenew ? "Yes" : "No"},${domain.status}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "oxxa-domains.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify(
      "Export ready",
      `${filtered.length} domain records were exported to CSV.`,
    );
  }

  return (
    <div>
      <PageHeading
        title="Domains"
        description="Register, renew and connect domains — directly through your Oxxa reseller account."
        actions={
          <>
            <button className="button button-secondary" onClick={exportDomains}>
              <Download size={17} /> Export
            </button>
            <button className="button button-primary" onClick={onDomainSearch}>
              <Plus size={18} /> Register domain
            </button>
          </>
        }
      />
      <section className="domain-stats compact-stats">
        <article className="card">
          <div className="compact-stat-icon green">
            <Globe2 size={20} />
          </div>
          <div>
            <span>Total domains</span>
            <strong>386</strong>
            <small>Across 64 clients</small>
          </div>
        </article>
        <article className="card">
          <div className="compact-stat-icon orange">
            <Clock3 size={20} />
          </div>
          <div>
            <span>Expiring in 30 days</span>
            <strong>12</strong>
            <small>€184.50 renewal value</small>
          </div>
        </article>
        <article className="card">
          <div className="compact-stat-icon blue">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span>Auto-renew enabled</span>
            <strong>94.8%</strong>
            <small>366 protected domains</small>
          </div>
        </article>
        <article className="card oxxa-mini-status">
          <div>
            <Badge tone="green" dot>
              Oxxa connected
            </Badge>
            <strong>Everything in sync</strong>
            <small>Last checked 1 minute ago</small>
          </div>
          <button
            className="tiny-button"
            onClick={() =>
              notify(
                "Oxxa sync complete",
                "Your latest domain statuses have been imported.",
              )
            }
          >
            <ArrowUpRight size={18} />
          </button>
        </article>
      </section>
      <div className="list-controls domains-controls">
        <div className="filter-tabs">
          {["All domains", "Expiring soon", "Auto-renew on", "DNS issues"].map(
            (item) => (
              <button
                className={filter === item ? "active" : ""}
                onClick={() => setFilter(item)}
                key={item}
              >
                {item}
                {item === "Expiring soon" && <span>2</span>}
              </button>
            ),
          )}
        </div>
        <label className="inline-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search domain or client…"
          />
        </label>
      </div>
      <div className="card table-card">
        <div className="table-wrap">
          <table className="data-table domains-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Client</th>
                <th>Website</th>
                <th>Expiry date</th>
                <th>Auto-renew</th>
                <th>DNS</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((domain) => (
                <tr key={domain.id} onClick={() => onSelect(domain)}>
                  <td>
                    <div className="domain-name-cell">
                      <span>
                        <Globe2 size={16} />
                      </span>
                      <strong>{domain.name}</strong>
                    </div>
                  </td>
                  <td>{domain.client}</td>
                  <td>
                    {domain.site === "Not mapped" ? (
                      <span className="muted-cell">Not mapped</span>
                    ) : (
                      domain.site
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        domain.status === "Expiring soon" ? "expiry-soon" : ""
                      }
                    >
                      {domain.expiry}
                    </span>
                  </td>
                  <td>
                    <Switch
                      checked={domain.autoRenew}
                      onChange={() => onToggle(domain.id)}
                      label={`Auto-renew ${domain.name}`}
                    />
                  </td>
                  <td>
                    <span
                      className={`dns-status ${domain.dns === "Connected" ? "connected" : "warning"}`}
                    >
                      {domain.dns === "Connected" ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <Clock3 size={14} />
                      )}
                      {domain.dns}
                    </span>
                  </td>
                  <td>
                    <Badge tone={statusTone(domain.status)} dot>
                      {domain.status}
                    </Badge>
                  </td>
                  <td>
                    <button className="tiny-button">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="small-empty">
            No domains match your current filters.
          </div>
        )}
        <footer className="table-footer">
          <span>Showing {filtered.length} of 386 domains</span>
          <button
            className="text-button"
            onClick={() =>
              notify(
                "Oxxa domain portfolio",
                "The live WordPress integration supports paginated Oxxa domain lists. This preview shows a sample portfolio.",
              )
            }
          >
            View complete Oxxa portfolio <ArrowRight size={14} />
          </button>
        </footer>
      </div>
    </div>
  );
}
