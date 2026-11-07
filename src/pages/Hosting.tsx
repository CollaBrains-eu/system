import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { UsageRing } from "../components/Charts";
import { Badge, PageHeading } from "../components/UI";
import type { Site } from "../types";
import { wpBoot } from "../lib/wp";

export default function Hosting({
  sites,
  notify,
}: {
  sites: Site[];
  notify: (title: string, message: string) => void;
}) {
  return (
    <div>
      <PageHeading
        title="Hosting"
        description="Resources, performance and Oxxa services for your reseller network."
        actions={
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
                  "Package options loaded",
                  "Contact your Oxxa account manager to change or upgrade your reseller plan.",
                )
              }
            >
              <Zap size={17} /> Manage package
            </button>
          </>
        }
      />
      <section className="hosting-plan-card card">
        <div className="hosting-plan-brand">
          <span>
            <Cloud size={28} />
          </span>
          <div>
            <small>OXXA RESELLER HOSTING</small>
            <h2>OX Professional</h2>
            <p>Built for ambitious web studios. White-label by default.</p>
          </div>
        </div>
        <div className="hosting-plan-meta">
          <div>
            <span>Monthly plan</span>
            <strong>€49.95</strong>
          </div>
          <div>
            <span>Next renewal</span>
            <strong>01 Dec 2026</strong>
          </div>
          <Badge tone="green" dot>
            Active
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
            <Badge tone="green">Healthy</Badge>
          </header>
          <div className="resource-card-main">
            <UsageRing
              value={68}
              label="170 GB"
              sublabel="of 250 GB"
              size={120}
            />
            <div>
              <strong>68% used</strong>
              <span>80 GB available</span>
              <small>Across 148 websites</small>
            </div>
          </div>
          <footer>
            <span>Projected to last 7 months</span>
            <ArrowUpRight size={15} />
          </footer>
        </article>
        <article className="card resource-card">
          <header>
            <div>
              <Zap size={18} />
              <span>Bandwidth</span>
            </div>
            <Badge tone="green">Healthy</Badge>
          </header>
          <div className="resource-card-main">
            <UsageRing
              value={47}
              label="1.4 TB"
              sublabel="of 3 TB"
              size={120}
              color="#71969b"
            />
            <div>
              <strong>47% used</strong>
              <span>1.6 TB remaining</span>
              <small>Resets in 24 days</small>
            </div>
          </div>
          <footer>
            <span>12% less than last month</span>
            <ArrowUpRight size={15} />
          </footer>
        </article>
        <article className="card resource-card">
          <header>
            <div>
              <Cpu size={18} />
              <span>Server load</span>
            </div>
            <Badge tone="green">Optimal</Badge>
          </header>
          <div className="server-load-chart">
            <div className="server-load-value">
              <strong>
                24<small>%</small>
              </strong>
              <span>6 vCPU cores</span>
            </div>
            <div className="load-bars">
              {[
                32, 44, 38, 52, 45, 62, 48, 35, 28, 40, 31, 25, 34, 29, 24, 30,
                27, 24,
              ].map((value, index) => (
                <i key={index} style={{ height: `${value}%` }} />
              ))}
            </div>
          </div>
          <footer>
            <span>8 GB of 16 GB memory in use</span>
            <MemoryStick size={15} />
          </footer>
        </article>
      </section>
      <section className="hosting-content-grid">
        <article className="card hosting-sites-card">
          <header className="card-header">
            <div>
              <h2>Resource usage by website</h2>
              <p>Storage across your multisite network</p>
            </div>
            <button
              className="text-button"
              onClick={() =>
                notify(
                  "Resource report",
                  "Detailed per-site storage metrics require your hosting control-panel metrics adapter.",
                )
              }
            >
              View all <ArrowRight size={14} />
            </button>
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
                    <strong>{site.storage} GB</strong>
                  </td>
                  <td>{[84, 64, 48, 37, 0][index]} GB</td>
                  <td>
                    <span className="php-label">8.3</span>
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
        </article>
        <aside className="hosting-side">
          <article className="card service-status-card">
            <header className="card-header">
              <div>
                <h2>Services</h2>
                <p>Live Oxxa service health</p>
              </div>
              <span className="live-pulse" />
            </header>
            {[
              { icon: Server, label: "Web servers", detail: "Operational" },
              {
                icon: Database,
                label: "Database cluster",
                detail: "Operational",
              },
              {
                icon: ShieldCheck,
                label: "SSL & security",
                detail: "Protected",
              },
              {
                icon: RefreshCw,
                label: "Daily backups",
                detail: "Last: 4 hours ago",
              },
            ].map(({ icon: Icon, label, detail }) => (
              <div className="service-row" key={label}>
                <span>
                  <Icon size={17} />
                </span>
                <div>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
                <CheckCircle2 size={17} />
              </div>
            ))}
            <footer>
              <span>
                <span className="status-dot" /> All systems operational
              </span>
              <a
                href="https://www.oxxa.com/en"
                target="_blank"
                rel="noreferrer"
              >
                <ArrowUpRight size={15} />
              </a>
            </footer>
          </article>
          <article className="backup-card">
            <div>
              <Check size={20} />
              <span>Network protected</span>
            </div>
            <h3>Yesterday’s backup is ready.</h3>
            <p>148 sites · 68.4 GB · Off-site storage</p>
            <button
              onClick={() =>
                notify(
                  wpBoot
                    ? "Backup provider not connected"
                    : "Demo backup queued",
                  wpBoot
                    ? "Connect your hosting or backup provider to run network backups from this screen."
                    : "A sample network backup has been queued. No live files are changed in preview mode.",
                )
              }
            >
              Create a new backup <ArrowRight size={15} />
            </button>
          </article>
        </aside>
      </section>
    </div>
  );
}
