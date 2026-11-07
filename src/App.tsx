import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Cloud,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Globe2,
  HardDrive,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  Menu,
  Network,
  Palette,
  PanelLeftClose,
  Plus,
  Rocket,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Wordpress } from "./components/Wordpress";
import {
  initialClients,
  initialDomains,
  initialInvoices,
  initialSites,
  templates,
} from "./data";
import type {
  Client,
  Domain,
  Invoice,
  PageId,
  Site,
  StudioTemplate,
  ToastMessage,
} from "./types";
import {
  wpBoot,
  wpRequest,
  type DomainAvailability,
  type DomainSyncResult,
} from "./lib/wp";
import {
  Avatar,
  Badge,
  ConnectedDot,
  Drawer,
  Logo,
  Modal,
  SitePreview,
  Switch,
  TemplatePreview,
  statusTone,
} from "./components/UI";
import {
  DomainSearchModal,
  NewClientModal,
  NewInvoiceModal,
  NewSiteModal,
} from "./components/Modals";
import Dashboard from "./pages/Dashboard";
import Sites from "./pages/Sites";
import Domains from "./pages/Domains";
import Clients from "./pages/Clients";
import Hosting from "./pages/Hosting";
import Billing from "./pages/Billing";
import Studio from "./pages/Studio";
import Templates from "./pages/Templates";
import Settings from "./pages/Settings";
import Setup from "./pages/Setup";
import DesignEditor from "./pages/DesignEditor";

const navigation: {
  section: string;
  items: {
    id: PageId;
    label: string;
    icon: ComponentType<
      SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number }
    >;
    count?: string;
  }[];
}[] = [
  {
    section: "WORKSPACE",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "sites", label: "Websites", icon: Wordpress, count: "148" },
      { id: "clients", label: "Clients", icon: Users },
    ],
  },
  {
    section: "RESELLER",
    items: [
      { id: "domains", label: "Domains", icon: Globe2, count: "386" },
      { id: "hosting", label: "Hosting", icon: Server },
      { id: "billing", label: "Billing", icon: CreditCard },
    ],
  },
  {
    section: "WEB STUDIO",
    items: [
      { id: "studio", label: "Design studio", icon: Palette },
      { id: "templates", label: "Template library", icon: LayoutTemplate },
    ],
  },
];
const pageLabels: Record<PageId, string> = {
  overview: "Overview",
  sites: "Websites",
  clients: "Clients",
  domains: "Domains",
  hosting: "Hosting",
  billing: "Billing",
  studio: "Design studio",
  templates: "Template library",
  settings: "Network settings",
  setup: "Setup guide",
};

type ModalType = "site" | "domain" | "client" | "invoice" | null;

export default function App() {
  const initialHash = window.location.hash.replace("#", "") as PageId;
  const [page, setPage] = useState<PageId>(
    Object.keys(pageLabels).includes(initialHash)
      ? initialHash
      : wpBoot?.demo
        ? "setup"
        : "overview",
  );
  const [sites, setSites] = useState(initialSites);
  const [domains, setDomains] = useState(initialDomains);
  const [domainSyncing, setDomainSyncing] = useState(false);
  const [domainLastSync, setDomainLastSync] = useState("");
  const [domainSyncError, setDomainSyncError] = useState("");
  const [clients, setClients] = useState(initialClients);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<StudioTemplate | null>(null);
  const [editorTemplate, setEditorTemplate] = useState<StudioTemplate | null>(
    null,
  );
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [createMenu, setCreateMenu] = useState(false);
  const [workspaceMenu, setWorkspaceMenu] = useState(false);
  const [settingsTab, setSettingsTab] = useState("Oxxa connection");
  const [workspace, setWorkspace] = useState("Production network");
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [unread, setUnread] = useState(true);

  const notify = useCallback((title: string, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, title, message }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      4500,
    );
  }, []);

  const navigate = useCallback((next: PageId) => {
    setPage(next);
    window.location.hash = next;
    setMobileNav(false);
    setCreateMenu(false);
    setCommandOpen(false);
    setCommandQuery("");
    setSelectedSite(null);
    setSelectedDomain(null);
    setSelectedClient(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  function openSettings(tab = "Oxxa connection") {
    setSettingsTab(tab);
    setWorkspaceMenu(false);
    navigate("settings");
  }

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    const hashChange = () => {
      const hash = window.location.hash.replace("#", "") as PageId;
      if (Object.keys(pageLabels).includes(hash)) {
        setEditorTemplate(null);
        setPage(hash);
      }
    };
    window.addEventListener("keydown", keyboard);
    window.addEventListener("hashchange", hashChange);
    return () => {
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("hashchange", hashChange);
    };
  }, []);

  useEffect(() => {
    if (!wpBoot) return;
    let active = true;
    wpRequest<{
      sites: Site[];
      domains: Domain[];
      clients: Client[];
      invoices: Invoice[];
      domainLastSync?: string;
    }>("network")
      .then((data) => {
        if (!active) return;
        setSites(data.sites || []);
        setDomains(data.domains || []);
        setClients(data.clients || []);
        setInvoices(data.invoices || []);
        setDomainLastSync(data.domainLastSync || "");
      })
      .catch((error) =>
        notify(
          "Network data could not be loaded",
          error instanceof Error
            ? error.message
            : "Check your WordPress connection.",
        ),
      );
    return () => {
      active = false;
    };
  }, [notify]);

  function openNewSite(template: StudioTemplate | null = null) {
    setSelectedTemplate(template);
    setModal("site");
    setCreateMenu(false);
  }
  async function createSite(site: Site) {
    let created = site;
    if (wpBoot)
      created = await wpRequest<Site>("sites", {
        method: "POST",
        body: JSON.stringify({
          name: site.name,
          client: site.client,
          path: site.networkPath,
          domain: site.domain,
          template: site.template,
        }),
      });
    else await new Promise((resolve) => setTimeout(resolve, 1100));
    setSites((current) => [created, ...current]);
    setModal(null);
    setSelectedTemplate(null);
    navigate("sites");
    notify(
      "Website provisioned",
      `${created.name} is ready on your Multisite network.`,
    );
  }
  async function registerDomain(result: DomainAvailability) {
    let testMode = Boolean(wpBoot?.testMode);
    if (wpBoot) {
      const response = await wpRequest<{ test_mode: boolean }>(
        "domain/register",
        {
          method: "POST",
          body: JSON.stringify({ domain: result.domain, years: 1 }),
        },
      );
      testMode = response.test_mode;
    } else await new Promise((resolve) => setTimeout(resolve, 1200));
    const domain: Domain = {
      id: Date.now(),
      name: result.domain,
      client: "Unassigned",
      expiry: testMode ? "Test registration" : "07 Nov 2027",
      autoRenew: true,
      status: "Pending",
      site: "Not mapped",
      dns: "Action needed",
    };
    setDomains((current) => [domain, ...current]);
    setModal(null);
    navigate("domains");
    notify(
      testMode ? "Test registration completed" : "Domain registered",
      testMode
        ? `${result.domain} passed Oxxa’s test workflow. Disable test mode for a live registration.`
        : `${result.domain} was added to your Oxxa portfolio.`,
    );
  }

  async function createClient(client: Client) {
    let created = client;
    if (wpBoot)
      created = await wpRequest<Client>("clients", {
        method: "POST",
        body: JSON.stringify(client),
      });
    setClients((current) => [created, ...current]);
    setModal(null);
    notify(
      "Client added",
      `${created.name} is ready for websites and services.`,
    );
  }

  async function createInvoice(invoice: Invoice) {
    let created = invoice;
    if (wpBoot)
      created = await wpRequest<Invoice>("invoices", {
        method: "POST",
        body: JSON.stringify(invoice),
      });
    setInvoices((current) => [created, ...current]);
    setModal(null);
    notify(
      "Invoice created",
      `${created.id} has been saved for ${created.client}.`,
    );
  }
  async function syncDomains() {
    if (domainSyncing) return;
    setDomainSyncing(true);
    setDomainSyncError("");
    try {
      let result: DomainSyncResult;
      if (wpBoot?.demo) {
        throw new Error(
          "Connect your Oxxa API credentials in the Setup guide before synchronizing a live portfolio.",
        );
      } else if (wpBoot) {
        result = await wpRequest<DomainSyncResult>("domains/sync", {
          method: "POST",
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 950));
        result = {
          domains,
          imported: 0,
          updated: domains.length,
          total: domains.length,
          syncedAt: new Date().toISOString(),
          testMode: true,
        };
      }
      setDomains(result.domains);
      setDomainLastSync(result.syncedAt);
      notify(
        wpBoot ? "Oxxa portfolio synchronized" : "Demo portfolio refreshed",
        wpBoot
          ? `${result.total} domains checked · ${result.imported} imported · ${result.updated} refreshed. No orders were placed.`
          : `${result.total} sample domains were refreshed locally. No Oxxa API request was made.`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The Oxxa portfolio could not be synchronized.";
      setDomainSyncError(message);
      notify("Domain sync needs attention", message);
    } finally {
      setDomainSyncing(false);
    }
  }

  function toggleDomain(id: number) {
    setDomains((current) =>
      current.map((domain) =>
        domain.id === id ? { ...domain, autoRenew: !domain.autoRenew } : domain,
      ),
    );
    setSelectedDomain((current) =>
      current?.id === id
        ? { ...current, autoRenew: !current.autoRenew }
        : current,
    );
    const domain = domains.find((item) => item.id === id);
    if (domain) {
      notify(
        "Renewal preference updated",
        `${domain.name} auto-renew is now ${domain.autoRenew ? "off" : "on"}.`,
      );
      if (wpBoot)
        wpRequest("domain/autorenew", {
          method: "POST",
          body: JSON.stringify({
            domain: domain.name,
            enabled: !domain.autoRenew,
          }),
        }).catch((error) => {
          setDomains((current) =>
            current.map((item) =>
              item.id === id ? { ...item, autoRenew: domain.autoRenew } : item,
            ),
          );
          setSelectedDomain((current) =>
            current?.id === id
              ? { ...current, autoRenew: domain.autoRenew }
              : current,
          );
          notify(
            "Oxxa could not update renewal",
            error instanceof Error
              ? error.message
              : "The preference was restored.",
          );
        });
    }
  }
  function toggleSiteStatus(id: number) {
    const update = (site: Site) =>
      site.id === id
        ? {
            ...site,
            status:
              site.status === "Maintenance"
                ? ("Live" as const)
                : ("Maintenance" as const),
          }
        : site;
    setSites((current) => current.map(update));
    setSelectedSite((current) => (current ? update(current) : current));
    const currentSite = sites.find((site) => site.id === id);
    const nextStatus =
      currentSite?.status === "Maintenance" ? "Live" : "Maintenance";
    if (wpBoot)
      wpRequest(`sites/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: nextStatus }),
      }).catch((error) => {
        if (currentSite) {
          setSites((current) =>
            current.map((site) => (site.id === id ? currentSite : site)),
          );
          setSelectedSite((current) =>
            current?.id === id ? currentSite : current,
          );
        }
        notify(
          "WordPress could not update the site",
          error instanceof Error
            ? error.message
            : "Please refresh and try again.",
        );
      });
    notify(
      "Site status updated",
      "Maintenance mode has been changed for this network site.",
    );
  }

  if (editorTemplate)
    return (
      <DesignEditor
        template={editorTemplate}
        onExit={() => setEditorTemplate(null)}
        notify={notify}
      />
    );

  return (
    <div
      className={`app-shell ${sidebarCompact ? "sidebar-compact" : ""} ${wpBoot ? "is-wordpress" : ""}`}
    >
      {mobileNav && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside className={`app-sidebar ${mobileNav ? "mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Logo compact={sidebarCompact} />
          <button
            className="sidebar-collapse"
            onClick={() => setSidebarCompact(!sidebarCompact)}
            aria-label="Toggle sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
          <button
            className="mobile-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileNav(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-switcher-wrap">
          <button
            className="workspace-switcher"
            onClick={() => setWorkspaceMenu(!workspaceMenu)}
          >
            <span className="workspace-avatar">N</span>
            {!sidebarCompact && (
              <>
                <span>
                  <strong>{wpBoot?.networkName || "North & Co. Studio"}</strong>
                  <small>{workspace}</small>
                </span>
                <ChevronsUpDown size={14} />
              </>
            )}
          </button>
          {workspaceMenu && (
            <div className="workspace-menu">
              <span>WORKSPACES</span>
              {(wpBoot
                ? ["Production network"]
                : ["Production network", "Staging network"]
              ).map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setWorkspace(item);
                    setWorkspaceMenu(false);
                    notify(
                      "Workspace switched",
                      `You are now viewing the ${item.toLowerCase()}.`,
                    );
                  }}
                >
                  <span className="workspace-avatar">
                    {item === "Production network" ? "N" : "S"}
                  </span>
                  <div>
                    <strong>
                      {wpBoot?.networkName || "North & Co. Studio"}
                    </strong>
                    <small>{item}</small>
                  </div>
                  {workspace === item && <Check size={14} />}
                </button>
              ))}
              <button
                className="workspace-settings"
                onClick={() => {
                  openSettings();
                }}
              >
                <Settings2 size={14} /> Network settings
              </button>
            </div>
          )}
        </div>
        <nav className="sidebar-nav">
          {navigation.map((group) => (
            <div className="nav-group" key={group.section}>
              {!sidebarCompact && (
                <span className="nav-section-label">{group.section}</span>
              )}
              {group.items.map(({ id, label, icon: Icon, count }) => (
                <button
                  title={sidebarCompact ? label : undefined}
                  className={`nav-item ${page === id ? "active" : ""}`}
                  onClick={() => navigate(id)}
                  key={id}
                >
                  <Icon size={18} strokeWidth={1.8} />
                  {!sidebarCompact && (
                    <>
                      <span>{label}</span>
                      {count && (
                        <small>
                          {wpBoot && id === "sites"
                            ? sites.length
                            : wpBoot && id === "domains"
                              ? domains.length
                              : count}
                        </small>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {!sidebarCompact &&
            (wpBoot ? (
              <div className="sidebar-resource">
                <div>
                  <span>DirectAdmin hosting</span>
                  <strong>Read-only</strong>
                </div>
                <small>
                  Open Hosting to synchronize verified account usage. No sample
                  live metrics are shown.
                </small>
                <button onClick={() => navigate("hosting")}>
                  Open DirectAdmin hosting <ArrowUpRight size={13} />
                </button>
              </div>
            ) : (
              <div className="sidebar-resource">
                <div>
                  <span>Demo network storage</span>
                  <strong>68%</strong>
                </div>
                <div className="sidebar-progress">
                  <i />
                </div>
                <small>170 GB of 250 GB · sample data</small>
                <button onClick={() => navigate("hosting")}>
                  View demo resources <ArrowUpRight size={13} />
                </button>
              </div>
            ))}
          <button
            className={`nav-item settings-nav-item ${page === "setup" ? "active" : ""}`}
            onClick={() => navigate("setup")}
            title="Setup guide"
          >
            <Rocket size={18} />
            {!sidebarCompact && <span>Setup guide</span>}
            {wpBoot?.demo && <small>1</small>}
          </button>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            onClick={() => openSettings()}
            title="Network settings"
          >
            <Settings2 size={18} />
            {!sidebarCompact && <span>Network settings</span>}
          </button>
          <a
            className="nav-item"
            href="https://www.oxxa.com/en/domain-names/api"
            target="_blank"
            rel="noreferrer"
            title="Help & documentation"
          >
            <LifeBuoy size={18} />
            {!sidebarCompact && <span>Help & documentation</span>}
          </a>
          <div className="sidebar-user">
            <Avatar initials="SM" color="#d9e4c7" size="sm" />
            {!sidebarCompact && (
              <>
                <div>
                  <strong>{wpBoot?.userName || "Sophie Martin"}</strong>
                  <span>Super admin</span>
                </div>
                <button
                  onClick={() =>
                    notify(
                      "Account menu",
                      "Your WordPress user profile and session settings are managed by WordPress.",
                    )
                  }
                >
                  <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={20} />
            </button>
            <div className="breadcrumbs">
              <span>
                {workspace === "Production network" ? "Workspace" : "Staging"}
              </span>
              <ChevronRight size={13} />
              <strong>{pageLabels[page]}</strong>
            </div>
            <Badge
              tone={
                workspace !== "Production network" ||
                wpBoot?.demo ||
                wpBoot?.testMode
                  ? "orange"
                  : "green"
              }
              dot
            >
              {wpBoot?.demo
                ? "Setup mode"
                : wpBoot?.testMode
                  ? "Oxxa test"
                  : workspace === "Production network"
                    ? "Production"
                    : "Staging"}
            </Badge>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              aria-label="Search Oxxa Studio"
              onClick={() => setCommandOpen(true)}
            >
              <Search size={16} />
              <span>Search anything…</span>
              <kbd>⌘ K</kbd>
            </button>
            <button
              className="topbar-icon help-button"
              onClick={() =>
                notify(
                  "How can we help?",
                  "Open Help & documentation in the sidebar for Oxxa API guidance.",
                )
              }
              aria-label="Help"
            >
              <CircleHelp size={19} />
            </button>
            <div className="notification-wrap">
              <button
                className="topbar-icon"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUnread(false);
                }}
                aria-label="Notifications"
              >
                <Bell size={19} />
                {unread && <i />}
              </button>
              {notificationsOpen && (
                <>
                  <button
                    className="popover-dismiss"
                    onClick={() => setNotificationsOpen(false)}
                    aria-label="Close notifications"
                  />
                  <div className="notifications-popover">
                    <header>
                      <div>
                        <h3>Notifications</h3>
                        <Badge tone="green">3 new</Badge>
                      </div>
                      <button onClick={() => setNotificationsOpen(false)}>
                        <X size={16} />
                      </button>
                    </header>
                    <div className="notification-list">
                      <button
                        onClick={() => {
                          navigate("domains");
                          setNotificationsOpen(false);
                        }}
                      >
                        <span className="notification-icon orange">
                          <Globe2 size={17} />
                        </span>
                        <div>
                          <strong>2 domains expire this month</strong>
                          <p>Auto-renew is enabled for both domains.</p>
                          <small>1 hour ago</small>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          navigate("billing");
                          setNotificationsOpen(false);
                        }}
                      >
                        <span className="notification-icon green">
                          <CreditCard size={17} />
                        </span>
                        <div>
                          <strong>Payment received</strong>
                          <p>Atelier Morrow paid €289.00.</p>
                          <small>3 hours ago</small>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          navigate("sites");
                          setNotificationsOpen(false);
                        }}
                      >
                        <span className="notification-icon blue">
                          <Wordpress size={17} />
                        </span>
                        <div>
                          <strong>WordPress 6.9 is available</strong>
                          <p>Review the network update when you’re ready.</p>
                          <small>Yesterday</small>
                        </div>
                      </button>
                    </div>
                    <footer>
                      <button
                        onClick={() => {
                          notify(
                            "All caught up",
                            "All notifications have been marked as read.",
                          );
                          setNotificationsOpen(false);
                        }}
                      >
                        Mark all as read <Check size={14} />
                      </button>
                    </footer>
                  </div>
                </>
              )}
            </div>
            <span className="topbar-divider" />
            <div className="create-menu-wrap">
              <button
                className="button button-primary topbar-create"
                aria-label="Create new"
                onClick={() => setCreateMenu(!createMenu)}
              >
                <Plus size={17} />
                <span>Create new</span>
                <ChevronDown size={14} />
              </button>
              {createMenu && (
                <>
                  <button
                    className="popover-dismiss"
                    onClick={() => setCreateMenu(false)}
                    aria-label="Close create menu"
                  />
                  <div className="create-popover">
                    <span>CREATE NEW</span>
                    <button onClick={() => openNewSite()}>
                      <i>
                        <Wordpress size={17} />
                      </i>
                      <div>
                        <strong>Website</strong>
                        <small>Provision a Multisite site</small>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setModal("client");
                        setCreateMenu(false);
                      }}
                    >
                      <i>
                        <Users size={17} />
                      </i>
                      <div>
                        <strong>Client</strong>
                        <small>Add a client record</small>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setModal("domain");
                        setCreateMenu(false);
                      }}
                    >
                      <i>
                        <Globe2 size={17} />
                      </i>
                      <div>
                        <strong>Domain</strong>
                        <small>Search & register with Oxxa</small>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setModal("invoice");
                        setCreateMenu(false);
                      }}
                    >
                      <i>
                        <FileText size={17} />
                      </i>
                      <div>
                        <strong>Invoice</strong>
                        <small>Bill a client</small>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="page-content">
          {page === "overview" && (
            <Dashboard
              sites={sites}
              userName={wpBoot?.userName?.split(" ")[0] || "Sophie"}
              navigate={navigate}
              onNewSite={() => openNewSite()}
              onDomainSearch={() => setModal("domain")}
              onSelectSite={setSelectedSite}
              notify={notify}
            />
          )}
          {page === "sites" && (
            <Sites
              sites={sites}
              networkName={
                wpBoot
                  ? `${wpBoot.networkName} network`
                  : "North & Co. production network"
              }
              totalSites={wpBoot ? sites.length : 148}
              networkType={wpBoot?.multisiteType || "Subdirectory"}
              onNewSite={() => openNewSite()}
              onSelectSite={setSelectedSite}
              notify={notify}
            />
          )}
          {page === "domains" && (
            <Domains
              domains={domains}
              onDomainSearch={() => setModal("domain")}
              onToggle={toggleDomain}
              onSelect={setSelectedDomain}
              onSync={syncDomains}
              syncing={domainSyncing}
              lastSync={domainLastSync}
              syncError={domainSyncError}
              notify={notify}
            />
          )}
          {page === "clients" && (
            <Clients
              clients={clients}
              onNewClient={() => setModal("client")}
              onSelect={setSelectedClient}
              onSettings={() => openSettings()}
            />
          )}
          {page === "hosting" && (
            <Hosting
              sites={sites}
              notify={notify}
              onSettings={() => openSettings("DirectAdmin")}
            />
          )}
          {page === "billing" && (
            <Billing
              invoices={invoices}
              onNewInvoice={() => setModal("invoice")}
              notify={notify}
            />
          )}
          {page === "studio" && (
            <Studio
              sites={sites}
              onOpenEditor={setEditorTemplate}
              onUseTemplate={openNewSite}
              notify={notify}
            />
          )}
          {page === "templates" && (
            <Templates
              onUseTemplate={openNewSite}
              onOpenEditor={setEditorTemplate}
            />
          )}
          {page === "settings" && (
            <Settings notify={notify} initialTab={settingsTab} />
          )}
          {page === "setup" && <Setup navigate={navigate} notify={notify} />}
        </main>
        <footer className="app-footer">
          <span>
            <Logo compact /> Oxxa Studio for WordPress Multisite
          </span>
          <span>
            {wpBoot?.demo ? (
              <>
                <Cloud size={13} /> Oxxa setup required
              </>
            ) : (
              <>
                <ConnectedDot /> Oxxa connected <i /> Last sync 1 min ago
              </>
            )}
          </span>
        </footer>
      </div>

      {modal === "site" && (
        <NewSiteModal
          clients={clients}
          initialTemplate={selectedTemplate}
          onClose={() => {
            setModal(null);
            setSelectedTemplate(null);
          }}
          onCreate={createSite}
        />
      )}
      {modal === "domain" && (
        <DomainSearchModal
          onClose={() => setModal(null)}
          onRegister={registerDomain}
        />
      )}
      {modal === "client" && (
        <NewClientModal
          onClose={() => setModal(null)}
          onCreate={createClient}
        />
      )}
      {modal === "invoice" && (
        <NewInvoiceModal
          clients={clients}
          onClose={() => setModal(null)}
          onCreate={createInvoice}
        />
      )}

      {selectedSite && (
        <Drawer
          title={selectedSite.name}
          subtitle={`WordPress site #${selectedSite.id}`}
          onClose={() => setSelectedSite(null)}
        >
          <div className="drawer-site-preview">
            <SitePreview site={selectedSite} large />
          </div>
          <div className="drawer-status-line">
            <Badge tone={statusTone(selectedSite.status)} dot>
              {selectedSite.status}
            </Badge>
            <span>Updated {selectedSite.updated}</span>
          </div>
          <div className="drawer-primary-actions">
            <a
              className="button button-primary"
              href={`https://${selectedSite.domain}`}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} /> Visit website
            </a>
            <button
              className="button button-secondary"
              onClick={() =>
                notify(
                  "Opening WordPress admin",
                  `A secure super admin session for ${selectedSite.name} would open here.`,
                )
              }
            >
              <Wordpress size={16} /> WP admin
            </button>
          </div>
          <section className="drawer-section">
            <h3>Website details</h3>
            <dl>
              <div>
                <dt>Client</dt>
                <dd>{selectedSite.client}</dd>
              </div>
              <div>
                <dt>Domain</dt>
                <dd>{selectedSite.domain}</dd>
              </div>
              <div>
                <dt>Network path</dt>
                <dd>{selectedSite.networkPath}</dd>
              </div>
              <div>
                <dt>Template</dt>
                <dd>{selectedSite.template}</dd>
              </div>
              <div>
                <dt>Monthly visits</dt>
                <dd>{selectedSite.visits}</dd>
              </div>
              <div>
                <dt>Storage used</dt>
                <dd>{selectedSite.storage} GB</dd>
              </div>
            </dl>
          </section>
          <section className="drawer-section">
            <h3>Network controls</h3>
            <div className="settings-toggle-row">
              <div>
                <strong>Maintenance mode</strong>
                <p>Temporarily hide this site from visitors.</p>
              </div>
              <Switch
                checked={selectedSite.status === "Maintenance"}
                onChange={() => toggleSiteStatus(selectedSite.id)}
                label="Maintenance mode"
              />
            </div>
            <button
              className="drawer-action-row"
              onClick={() => {
                setSelectedSite(null);
                setEditorTemplate(
                  templates.find(
                    (template) =>
                      template.name.toLowerCase() ===
                      selectedSite.template.toLowerCase(),
                  ) || templates[0],
                );
              }}
            >
              <Palette size={16} />
              <span>
                <strong>Open in design studio</strong>
                <small>Edit pages and global styles</small>
              </span>
              <ChevronRight size={15} />
            </button>
            <button
              className="drawer-action-row"
              onClick={() =>
                notify(
                  wpBoot
                    ? "Backup provider not connected"
                    : "Demo backup queued",
                  wpBoot
                    ? "Connect a backup provider before creating restore points from Oxxa Studio."
                    : `${selectedSite.name} has been added to the sample backup queue.`,
                )
              }
            >
              <Cloud size={16} />
              <span>
                <strong>Back up this website</strong>
                <small>Create an on-demand restore point</small>
              </span>
              <ChevronRight size={15} />
            </button>
          </section>
        </Drawer>
      )}
      {selectedDomain && (
        <Drawer
          title={selectedDomain.name}
          subtitle="Oxxa domain management"
          onClose={() => setSelectedDomain(null)}
        >
          <div className="domain-drawer-hero">
            <span>
              <Globe2 size={28} />
            </span>
            <Badge tone={statusTone(selectedDomain.status)} dot>
              {selectedDomain.status}
            </Badge>
            <h3>{selectedDomain.name}</h3>
            <p>
              {selectedDomain.dns === "Connected"
                ? "DNS is connected and resolving correctly."
                : selectedDomain.dns === "Action needed"
                  ? "DNS needs your attention before the site can go live."
                  : "DNS connectivity has not been verified by portfolio sync."}
            </p>
          </div>
          <section className="drawer-section">
            <h3>Registration</h3>
            <dl>
              <div>
                <dt>Registrar</dt>
                <dd>Oxxa.com</dd>
              </div>
              <div>
                <dt>Client</dt>
                <dd>{selectedDomain.client}</dd>
              </div>
              <div>
                <dt>Expiry date</dt>
                <dd>{selectedDomain.expiry}</dd>
              </div>
              <div>
                <dt>Mapped website</dt>
                <dd>{selectedDomain.site}</dd>
              </div>
              {selectedDomain.nsgroup && (
                <div>
                  <dt>Nameserver group</dt>
                  <dd>{selectedDomain.nsgroup}</dd>
                </div>
              )}
              {selectedDomain.registrant && (
                <div>
                  <dt>Registrant identity</dt>
                  <dd>{selectedDomain.registrant}</dd>
                </div>
              )}
              {selectedDomain.lastRenewed && (
                <div>
                  <dt>Last renewed</dt>
                  <dd>{selectedDomain.lastRenewed}</dd>
                </div>
              )}
            </dl>
            <div className="settings-toggle-row">
              <div>
                <strong>Automatic renewal</strong>
                <p>Renew through Oxxa before expiry.</p>
              </div>
              <Switch
                checked={selectedDomain.autoRenew}
                onChange={() => toggleDomain(selectedDomain.id)}
                label="Automatic renewal"
              />
            </div>
          </section>
          <section className="drawer-section">
            <div className="drawer-section-heading">
              <h3>DNS records</h3>
              <Badge
                tone={selectedDomain.dns === "Connected" ? "green" : "orange"}
              >
                {selectedDomain.dns}
              </Badge>
            </div>
            {!wpBoot ? (
              <>
                <p className="drawer-data-note">
                  Illustrative demo records — not read from Oxxa.
                </p>
                <div className="dns-record">
                  <span>A</span>
                  <div>
                    <strong>@</strong>
                    <small>203.0.113.42</small>
                  </div>
                  <CheckCircle2 size={15} />
                </div>
                <div className="dns-record">
                  <span>CNAME</span>
                  <div>
                    <strong>www</strong>
                    <small>{selectedDomain.name}</small>
                  </div>
                  <CheckCircle2 size={15} />
                </div>
                <div className="dns-record">
                  <span>MX</span>
                  <div>
                    <strong>@</strong>
                    <small>mail.example.test</small>
                  </div>
                  <CheckCircle2 size={15} />
                </div>
                <button
                  className="button button-secondary full-width"
                  onClick={() =>
                    notify(
                      "Demo DNS refreshed",
                      "Sample records were refreshed locally. No Oxxa DNS request was made.",
                    )
                  }
                >
                  <Activity size={16} /> Refresh demo records
                </button>
              </>
            ) : (
              <div className="dns-provider-info">
                <ShieldCheck size={22} />
                <strong>
                  {selectedDomain.nsgroup
                    ? `Oxxa nameserver group ${selectedDomain.nsgroup}`
                    : "DNS zone not inspected"}
                </strong>
                <p>
                  Portfolio sync imports registration data only. It does not
                  read zone records or verify public DNS resolution.
                </p>
                <a
                  className="button button-secondary full-width"
                  href="https://www.oxxa.com/en/domain-names/api"
                  target="_blank"
                  rel="noreferrer"
                >
                  Oxxa DNS API documentation <ExternalLink size={15} />
                </a>
              </div>
            )}
          </section>
        </Drawer>
      )}
      {selectedClient && (
        <Drawer
          title={selectedClient.name}
          subtitle={`Client since ${selectedClient.since}`}
          onClose={() => setSelectedClient(null)}
        >
          <div className="client-drawer-hero">
            <Avatar
              initials={selectedClient.initials}
              color={selectedClient.color}
              size="lg"
            />
            <div>
              <h3>{selectedClient.name}</h3>
              <p>{selectedClient.email}</p>
              <Badge tone={statusTone(selectedClient.status)} dot>
                {selectedClient.status}
              </Badge>
            </div>
          </div>
          <div className="client-drawer-stats">
            <div>
              <span>Websites</span>
              <strong>{selectedClient.sites}</strong>
            </div>
            <div>
              <span>Monthly revenue</span>
              <strong>€{selectedClient.mrr}</strong>
            </div>
          </div>
          <section className="drawer-section">
            <h3>Primary contact</h3>
            <dl>
              <div>
                <dt>Name</dt>
                <dd>{selectedClient.contact}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedClient.email}</dd>
              </div>
            </dl>
            <a
              className="button button-secondary full-width"
              href={`mailto:${selectedClient.email}`}
            >
              Send email <ArrowUpRight size={15} />
            </a>
          </section>
          <section className="drawer-section">
            <div className="drawer-section-heading">
              <h3>Client websites</h3>
              <button
                className="text-button"
                onClick={() => {
                  setSelectedClient(null);
                  openNewSite();
                }}
              >
                <Plus size={14} /> Add site
              </button>
            </div>
            {sites
              .filter((site) => site.client === selectedClient.name)
              .map((site) => (
                <button
                  className="drawer-client-site"
                  key={site.id}
                  onClick={() => {
                    setSelectedClient(null);
                    setSelectedSite(site);
                  }}
                >
                  <span style={{ background: site.theme, color: site.accent }}>
                    {site.initials}
                  </span>
                  <div>
                    <strong>{site.name}</strong>
                    <small>{site.domain}</small>
                  </div>
                  <ChevronRight size={15} />
                </button>
              ))}
            {sites.filter((site) => site.client === selectedClient.name)
              .length === 0 && (
              <div className="small-empty">No websites assigned yet.</div>
            )}
          </section>
        </Drawer>
      )}

      {commandOpen && (
        <Modal
          title="Search Oxxa Studio"
          subtitle="Jump to a page, website or action."
          onClose={() => {
            setCommandOpen(false);
            setCommandQuery("");
          }}
          size="md"
        >
          <div className="command-content">
            <label className="command-search">
              <Search size={19} />
              <input
                autoFocus
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
                placeholder="Search websites, clients, domains…"
              />
              <kbd>ESC</kbd>
            </label>
            <div className="command-results">
              <span className="command-label">PAGES & ACTIONS</span>
              {navigation
                .flatMap((group) => group.items)
                .filter((item) =>
                  item.label.toLowerCase().includes(commandQuery.toLowerCase()),
                )
                .slice(0, commandQuery ? 9 : 4)
                .map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => navigate(id)}>
                    <span>
                      <Icon size={17} />
                    </span>
                    <strong>{label}</strong>
                    <small>Go to page</small>
                    <ArrowRight size={14} />
                  </button>
                ))}
              {commandQuery &&
                sites
                  .filter((site) =>
                    `${site.name} ${site.domain}`
                      .toLowerCase()
                      .includes(commandQuery.toLowerCase()),
                  )
                  .map((site) => (
                    <button
                      key={site.id}
                      onClick={() => {
                        setSelectedSite(site);
                        setCommandOpen(false);
                        setCommandQuery("");
                      }}
                    >
                      <span>
                        <Wordpress size={17} />
                      </span>
                      <strong>{site.name}</strong>
                      <small>{site.domain}</small>
                      <ArrowRight size={14} />
                    </button>
                  ))}
              <span className="command-label">QUICK ACTIONS</span>
              <button
                onClick={() => {
                  setCommandOpen(false);
                  openNewSite();
                }}
              >
                <span>
                  <Plus size={17} />
                </span>
                <strong>Create a new website</strong>
                <small>Action</small>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => {
                  setCommandOpen(false);
                  setModal("domain");
                }}
              >
                <span>
                  <Globe2 size={17} />
                </span>
                <strong>Find and register a domain</strong>
                <small>Action</small>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <span>
              <Check size={17} />
            </span>
            <div>
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button
              onClick={() =>
                setToasts((current) =>
                  current.filter((item) => item.id !== toast.id),
                )
              }
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
