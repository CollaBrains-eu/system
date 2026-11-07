import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { Wordpress } from "../components/Wordpress";
import type { Site, SiteStatus } from "../types";
import {
  Badge,
  EmptyState,
  PageHeading,
  SitePreview,
  statusTone,
} from "../components/UI";
import { wpBoot } from "../lib/wp";

interface SitesProps {
  sites: Site[];
  networkName?: string;
  totalSites?: number;
  networkType?: string;
  onNewSite: () => void;
  onSelectSite: (site: Site) => void;
  notify: (title: string, message: string) => void;
}

export default function Sites({
  sites,
  networkName = "North & Co. production network",
  totalSites = 148,
  networkType = "Subdirectory",
  onNewSite,
  onSelectSite,
  notify,
}: SitesProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | SiteStatus>("All");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState("Recently updated");
  const [menu, setMenu] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const result = sites.filter(
      (site) =>
        (filter === "All" || site.status === filter) &&
        `${site.name} ${site.domain} ${site.client}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
    return [...result].sort((a, b) =>
      sort === "Name A–Z"
        ? a.name.localeCompare(b.name)
        : sort === "Storage used"
          ? b.storage - a.storage
          : a.id - b.id,
    );
  }, [sites, filter, query, sort]);

  return (
    <div>
      <PageHeading
        title="Websites"
        description="Create and manage every site in your WordPress Multisite network."
        actions={
          <>
            <button
              className="button button-secondary"
              onClick={() =>
                wpBoot
                  ? window.location.reload()
                  : notify(
                      "Demo sync complete",
                      "Sample site status, storage and domains are up to date.",
                    )
              }
            >
              <Wordpress size={17} /> Sync network
            </button>
            <button className="button button-primary" onClick={onNewSite}>
              <Plus size={18} /> New website
            </button>
          </>
        }
      />
      <div className="network-notice">
        <span className="network-notice-icon">
          <Wordpress size={19} />
        </span>
        <div>
          <strong>{networkName}</strong>
          <span>
            Multisite · {networkType} installation · {totalSites} active sites
          </span>
        </div>
        <span className="network-notice-path">
          northco.network <ArrowRight size={14} /> /client-site/
        </span>
        <Badge tone="green" dot>
          Healthy
        </Badge>
      </div>
      <div className="list-controls">
        <div className="filter-tabs">
          {(["All", "Live", "Draft", "Maintenance"] as const).map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={filter === item ? "active" : ""}
            >
              {item}
              <span>
                {item === "All"
                  ? sites.length
                  : sites.filter((site) => site.status === item).length}
              </span>
            </button>
          ))}
        </div>
        <div className="list-tools">
          <label className="inline-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search websites…"
            />
          </label>
          <div className="view-toggle">
            <button
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List size={17} />
            </button>
            <button
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <Grid2X2 size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="secondary-controls">
        <span>
          {filtered.length} {filtered.length === 1 ? "website" : "websites"}
        </span>
        <label>
          <ArrowDownUp size={14} />
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option>Recently updated</option>
            <option>Name A–Z</option>
            <option>Storage used</option>
          </select>
          <ChevronDown size={13} />
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No websites found"
          description="Try another search or clear the current status filter."
        />
      ) : view === "list" ? (
        <div className="card table-card">
          <div className="table-wrap">
            <table className="data-table sites-full-table">
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" aria-label="Select all sites" />
                  </th>
                  <th>Website</th>
                  <th>Client</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Storage</th>
                  <th>Last updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((site) => (
                  <tr key={site.id} onClick={() => onSelectSite(site)}>
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${site.name}`}
                      />
                    </td>
                    <td>
                      <div className="website-cell">
                        <div className="site-table-thumb">
                          <SitePreview site={site} />
                        </div>
                        <div>
                          <strong>{site.name}</strong>
                          <span>{site.domain}</span>
                        </div>
                      </div>
                    </td>
                    <td>{site.client}</td>
                    <td>
                      <span className="template-label">{site.template}</span>
                    </td>
                    <td>
                      <Badge tone={statusTone(site.status)} dot>
                        {site.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="storage-cell">
                        <span>{site.storage} GB</span>
                        <div>
                          <i
                            style={{
                              width: `${Math.min(site.storage * 8, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">{site.updated}</td>
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
                              notify(
                                "Opening WordPress admin",
                                `A secure admin session for ${site.name} would open here.`,
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
        </div>
      ) : (
        <div className="sites-card-grid">
          {filtered.map((site) => (
            <article
              className="site-grid-card card"
              key={site.id}
              onClick={() => onSelectSite(site)}
            >
              <div className="site-grid-preview">
                <SitePreview site={site} large />
                <Badge tone={statusTone(site.status)} dot>
                  {site.status}
                </Badge>
              </div>
              <div className="site-grid-content">
                <div>
                  <h3>{site.name}</h3>
                  <p>{site.domain}</p>
                </div>
                <button className="tiny-button">
                  <MoreHorizontal size={18} />
                </button>
                <footer>
                  <span>{site.template}</span>
                  <span>{site.updated}</span>
                </footer>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="pagination">
        <span>
          Showing {filtered.length} of {sites.length} websites
        </span>
        <div>
          <button disabled>Previous</button>
          <button className="active">1</button>
          <button disabled={sites.length < 7}>2</button>
          <button disabled={sites.length < 7}>Next</button>
        </div>
      </div>
    </div>
  );
}
