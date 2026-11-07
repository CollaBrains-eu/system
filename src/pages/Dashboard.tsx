import { useState } from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Cloud,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  MoreHorizontal,
  Plus,
  Server,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Wordpress } from "../components/Wordpress";
import { activity, revenueSeries } from "../data";
import type { PageId, Site } from "../types";
import { RevenueChart, UsageRing } from "../components/Charts";
import { Badge, ConnectedDot, SitePreview, statusTone } from "../components/UI";

interface DashboardProps {
  sites: Site[];
  userName?: string;
  navigate: (page: PageId) => void;
  onNewSite: () => void;
  onDomainSearch: () => void;
  onSelectSite: (site: Site) => void;
  notify: (title: string, message: string) => void;
}

const stats = [
  {
    label: "Monthly recurring revenue",
    value: "€12,840",
    change: "+12.8%",
    detail: "vs. last month",
    icon: CircleDollarSign,
    tone: "green",
  },
  {
    label: "Active websites",
    value: "148",
    change: "+6",
    detail: "this month",
    icon: Wordpress,
    tone: "blue",
  },
  {
    label: "Domains with Oxxa",
    value: "386",
    change: "+18",
    detail: "this quarter",
    icon: Globe2,
    tone: "purple",
  },
  {
    label: "Active clients",
    value: "64",
    change: "+4",
    detail: "this month",
    icon: Users,
    tone: "orange",
  },
];

export default function Dashboard({
  sites,
  userName = "Sophie",
  navigate,
  onNewSite,
  onDomainSearch,
  onSelectSite,
  notify,
}: DashboardProps) {
  const [period, setPeriod] = useState("6 months");
  const [menu, setMenu] = useState<number | null>(null);
  const [healthTab, setHealthTab] = useState<"network" | "resources">(
    "network",
  );

  return (
    <div className="dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <div className="eyebrow">FRIDAY, 7 NOVEMBER</div>
          <h1>
            Good morning, {userName}{" "}
            <span className="welcome-spark">
              <Sparkles size={22} />
            </span>
          </h1>
          <p>Here’s what’s happening across your studio today.</p>
        </div>
        <div className="welcome-actions">
          <button className="button button-secondary" onClick={onDomainSearch}>
            <Globe2 size={17} /> Find a domain
          </button>
          <button className="button button-primary" onClick={onNewSite}>
            <Plus size={18} /> New website
          </button>
        </div>
      </div>

      <section className="stats-grid">
        {stats.map(({ label, value, change, detail, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon stat-${tone}`}>
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <div className="stat-top">
              <span>{label}</span>
              <button
                className="tiny-button"
                aria-label={`View ${label}`}
                onClick={() =>
                  navigate(
                    label.includes("revenue")
                      ? "billing"
                      : label.includes("websites")
                        ? "sites"
                        : label.includes("Domains")
                          ? "domains"
                          : "clients",
                  )
                }
              >
                <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-meta">
              <span className="positive-change">
                <TrendingUp size={13} />
                {change}
              </span>
              <span>{detail}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-main-grid">
        <article className="card revenue-card">
          <header className="card-header">
            <div>
              <h2>Revenue overview</h2>
              <p>Recurring revenue across your network</p>
            </div>
            <div className="segmented-control small">
              {Object.keys(revenueSeries).map((item) => (
                <button
                  className={period === item ? "active" : ""}
                  onClick={() => setPeriod(item)}
                  key={item}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>
          <div className="revenue-summary">
            <strong>€12,840.00</strong>
            <span>
              <ArrowUpRight size={14} /> 12.8%
            </span>
            <small>vs. €11,384 last month</small>
          </div>
          <RevenueChart data={revenueSeries[period]} />
        </article>

        <article className="card network-card">
          <header className="card-header">
            <div>
              <h2>Oxxa network</h2>
              <p>Your reseller environment</p>
            </div>
            <Badge tone="green" dot>
              Connected
            </Badge>
          </header>
          <div className="network-plan">
            <div className="network-plan-icon">
              <Cloud size={24} />
            </div>
            <div>
              <strong>OX Professional</strong>
              <span>Reseller hosting · Monthly</span>
            </div>
            <button className="tiny-button" onClick={() => navigate("hosting")}>
              <ArrowUpRight size={17} />
            </button>
          </div>
          <div className="segmented-control network-tabs">
            <button
              className={healthTab === "network" ? "active" : ""}
              onClick={() => setHealthTab("network")}
            >
              Network health
            </button>
            <button
              className={healthTab === "resources" ? "active" : ""}
              onClick={() => setHealthTab("resources")}
            >
              Resources
            </button>
          </div>
          {healthTab === "network" ? (
            <>
              <div className="uptime-block">
                <div>
                  <span>Network uptime</span>
                  <strong>
                    99.98<small>%</small>
                  </strong>
                  <p>
                    <ConnectedDot /> All systems operational
                  </p>
                </div>
                <div className="uptime-bars">
                  {Array.from({ length: 28 }, (_, i) => (
                    <i key={i} className={i === 17 ? "slight" : ""} />
                  ))}
                </div>
                <div className="uptime-labels">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="network-details">
                <button onClick={() => navigate("sites")}>
                  <span>
                    <Wordpress size={16} /> WordPress sites
                  </span>
                  <strong>
                    148 <ArrowRight size={14} />
                  </strong>
                </button>
                <button onClick={() => navigate("domains")}>
                  <span>
                    <Globe2 size={16} /> Active domains
                  </span>
                  <strong>
                    386 <ArrowRight size={14} />
                  </strong>
                </button>
                <button
                  onClick={() =>
                    notify(
                      "SSL certificates are healthy",
                      "All 148 active sites have a valid SSL certificate.",
                    )
                  }
                >
                  <span>
                    <CheckCircle2 size={16} /> SSL coverage
                  </span>
                  <strong>
                    100% <ArrowRight size={14} />
                  </strong>
                </button>
              </div>
            </>
          ) : (
            <div className="resource-panel">
              <div className="resource-ring-wrap">
                <UsageRing
                  value={68}
                  label="68%"
                  sublabel="of 250 GB"
                  size={124}
                />
                <div>
                  <strong>170 GB used</strong>
                  <span>80 GB available</span>
                  <button
                    className="text-button"
                    onClick={() => navigate("hosting")}
                  >
                    Manage resources <ArrowRight size={14} />
                  </button>
                </div>
              </div>
              <div className="resource-line">
                <span>Bandwidth</span>
                <strong>1.4 / 3 TB</strong>
                <div>
                  <i style={{ width: "47%" }} />
                </div>
              </div>
              <div className="resource-line">
                <span>Memory</span>
                <strong>11 / 16 GB</strong>
                <div>
                  <i style={{ width: "69%" }} />
                </div>
              </div>
            </div>
          )}
          <footer className="network-footer">
            <span>
              <Zap size={13} /> Last synced just now
            </span>
            <button
              onClick={() =>
                notify(
                  "Oxxa is up to date",
                  "Your domains and network services were synced successfully.",
                )
              }
            >
              <Activity size={14} /> Sync now
            </button>
          </footer>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="card projects-card">
          <header className="card-header">
            <div>
              <h2>Recent websites</h2>
              <p>Latest activity across your multisite network</p>
            </div>
            <button className="text-button" onClick={() => navigate("sites")}>
              View all websites <ArrowRight size={15} />
            </button>
          </header>
          <div className="table-wrap">
            <table className="data-table projects-table">
              <thead>
                <tr>
                  <th>Website</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Last updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sites.slice(0, 5).map((site) => (
                  <tr key={site.id} onClick={() => onSelectSite(site)}>
                    <td>
                      <div className="website-cell">
                        <div className="site-table-thumb">
                          <SitePreview site={site} />
                        </div>
                        <div>
                          <strong>{site.name}</strong>
                          <span>
                            <span className="wp-mini">W</span>
                            {site.domain}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="client-name">{site.client}</span>
                    </td>
                    <td>
                      <Badge tone={statusTone(site.status)} dot>
                        {site.status}
                      </Badge>
                    </td>
                    <td>
                      <span className="muted-cell">{site.updated}</span>
                    </td>
                    <td className="row-actions">
                      <button
                        className="tiny-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setMenu(menu === site.id ? null : site.id);
                        }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menu === site.id && (
                        <div
                          className="row-menu"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onSelectSite(site);
                              setMenu(null);
                            }}
                          >
                            <ExternalLink size={14} /> Site details
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `https://${site.domain}`,
                              );
                              notify(
                                "Address copied",
                                `${site.domain} is copied to your clipboard.`,
                              );
                              setMenu(null);
                            }}
                          >
                            <Copy size={14} /> Copy URL
                          </button>
                          <button
                            onClick={() => {
                              notify(
                                "Opening WordPress",
                                `Securely opening the network admin for ${site.name}.`,
                              );
                              setMenu(null);
                            }}
                          >
                            <Wordpress size={14} /> WP admin
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card activity-card">
          <header className="card-header">
            <div>
              <h2>Studio activity</h2>
              <p>Updates from your team</p>
            </div>
            <button
              className="tiny-button"
              onClick={() =>
                notify(
                  "You’re all caught up",
                  "There are no older activity items in this demo workspace.",
                )
              }
            >
              <MoreHorizontal size={18} />
            </button>
          </header>
          <div className="activity-list">
            {activity.map((item, index) => (
              <div className="activity-item" key={item.title}>
                <div className={`activity-icon activity-${item.color}`}>
                  {item.type === "publish" ? (
                    <ArrowUpRight size={16} />
                  ) : item.type === "domain" ? (
                    <Globe2 size={16} />
                  ) : item.type === "client" ? (
                    <Users size={16} />
                  ) : (
                    <Server size={16} />
                  )}
                </div>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                </div>
                {index < activity.length - 1 && <i className="activity-line" />}
              </div>
            ))}
          </div>
          <div className="quick-create">
            <div>
              <span className="quick-create-icon">
                <FileText size={18} />
              </span>
              <div>
                <strong>Start something new</strong>
                <p>Launch a site from a template.</p>
              </div>
            </div>
            <button className="button button-soft" onClick={onNewSite}>
              Create website <Plus size={15} />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
