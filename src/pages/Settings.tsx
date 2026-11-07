import { useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Cloud,
  ExternalLink,
  Globe2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Network,
  Palette,
  PlugZap,
  Save,
  Server,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Wordpress } from "../components/Wordpress";
import { Badge, PageHeading, Switch } from "../components/UI";
import { wpBoot, wpRequest } from "../lib/wp";

export default function Settings({
  notify,
  initialTab = "Oxxa connection",
}: {
  notify: (title: string, message: string) => void;
  initialTab?: string;
}) {
  const [tab, setTab] = useState(initialTab);
  const [username, setUsername] = useState(wpBoot?.settings?.username || "");
  const [password, setPassword] = useState("");
  const [testMode, setTestMode] = useState(wpBoot?.testMode ?? true);
  const [registrantIdentity, setRegistrantIdentity] = useState(
    wpBoot?.settings?.registrantIdentity || "",
  );
  const [adminIdentity, setAdminIdentity] = useState(
    wpBoot?.settings?.adminIdentity || "",
  );
  const [nsgroup, setNsgroup] = useState(wpBoot?.settings?.nsgroup || "");
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState(false);
  const [directAdminUrl, setDirectAdminUrl] = useState(
    wpBoot?.directAdmin?.url || "",
  );
  const [directAdminUsername, setDirectAdminUsername] = useState(
    wpBoot?.directAdmin?.username || "",
  );
  const [directAdminPassword, setDirectAdminPassword] = useState("");
  const [directAdminTesting, setDirectAdminTesting] = useState(false);
  const [directAdminTested, setDirectAdminTested] = useState(false);
  const [networkName, setNetworkName] = useState(
    wpBoot?.networkName || "North & Co. Studio",
  );
  const [networkDomain, setNetworkDomain] = useState(
    wpBoot?.networkDomain || "northco.network",
  );
  const [autoSsl, setAutoSsl] = useState(true);
  const [autoBackups, setAutoBackups] = useState(true);
  const [adminEmail, setAdminEmail] = useState("studio@northco.design");
  const [brandColor, setBrandColor] = useState("#C6EF85");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [domainAlerts, setDomainAlerts] = useState(true);

  async function testConnection() {
    setTesting(true);
    setTested(false);
    try {
      if (wpBoot)
        await wpRequest("connection/test", {
          method: "POST",
          body: JSON.stringify({
            username: username || undefined,
            password: password || undefined,
            testMode,
          }),
        });
      else await new Promise((resolve) => setTimeout(resolve, 1100));
      setTested(true);
      notify(
        "Oxxa connection successful",
        wpBoot
          ? "Your credentials and IP whitelist were verified."
          : "Demo connection verified. Add live credentials in WordPress to manage real domains.",
      );
    } catch (error) {
      notify(
        "Connection needs attention",
        error instanceof Error
          ? error.message
          : "Please check your Oxxa credentials.",
      );
    } finally {
      setTesting(false);
    }
  }

  async function testDirectAdmin() {
    setDirectAdminTesting(true);
    setDirectAdminTested(false);
    try {
      if (wpBoot)
        await wpRequest("directadmin/test", {
          method: "POST",
          body: JSON.stringify({
            url: directAdminUrl || undefined,
            username: directAdminUsername || undefined,
            password: directAdminPassword || undefined,
          }),
        });
      else await new Promise((resolve) => setTimeout(resolve, 1000));
      setDirectAdminTested(true);
      notify(
        wpBoot
          ? "DirectAdmin connection successful"
          : "Demo connection verified",
        wpBoot
          ? "Account configuration and user-level usage were read successfully. Save settings before synchronizing Hosting."
          : "No DirectAdmin request was made. Add a scoped Login Key in WordPress for live data.",
      );
    } catch (error) {
      notify(
        "DirectAdmin needs attention",
        error instanceof Error
          ? error.message
          : "Check the URL, Login Key, IP allowlist and command permissions.",
      );
    } finally {
      setDirectAdminTesting(false);
    }
  }

  async function saveSettings() {
    try {
      if (wpBoot)
        await wpRequest("settings", {
          method: "POST",
          body: JSON.stringify({
            username: username || undefined,
            password: password || undefined,
            testMode,
            registrantIdentity,
            adminIdentity,
            nsgroup,
            networkName,
            autoSsl,
            autoBackups,
            brandColor,
            emailUpdates,
            domainAlerts,
            directAdminUrl,
            directAdminUsername,
            directAdminPassword: directAdminPassword || undefined,
          }),
        });
      else await new Promise((resolve) => setTimeout(resolve, 400));
      setPassword("");
      setDirectAdminPassword("");
      notify(
        "Settings saved",
        "Your network and reseller preferences have been updated.",
      );
    } catch (error) {
      notify(
        "Could not save settings",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  const tabs = [
    {
      label: "Oxxa connection",
      icon: PlugZap,
      description: "API & reseller account",
    },
    {
      label: "DirectAdmin",
      icon: Server,
      description: "Hosting account & usage",
    },
    {
      label: "Multisite network",
      icon: Network,
      description: "Sites & provisioning",
    },
    {
      label: "White label",
      icon: Palette,
      description: "Brand & client experience",
    },
    {
      label: "Notifications",
      icon: Bell,
      description: "Alerts & email updates",
    },
  ];
  return (
    <div>
      <PageHeading
        title="Network settings"
        description="Configure your WordPress network, Oxxa integration and client experience."
        actions={
          <button className="button button-primary" onClick={saveSettings}>
            <Save size={17} /> Save changes
          </button>
        }
      />
      <div className="settings-layout">
        <aside className="card settings-nav">
          {tabs.map(({ label, icon: Icon, description }) => (
            <button
              className={tab === label ? "active" : ""}
              onClick={() => setTab(label)}
              key={label}
            >
              <span>
                <Icon size={18} />
              </span>
              <div>
                <strong>{label}</strong>
                <small>{description}</small>
              </div>
              <ChevronRight size={15} />
            </button>
          ))}
          <div className="settings-security-note">
            <ShieldCheck size={19} />
            <div>
              <strong>Network protected</strong>
              <p>Only super admins can access these settings.</p>
            </div>
          </div>
        </aside>
        <div className="settings-content">
          {tab === "Oxxa connection" && (
            <>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>Oxxa API connection</h2>
                    <p>
                      Securely connect your Oxxa reseller account to WordPress.
                    </p>
                  </div>
                  <Badge tone={wpBoot?.demo ? "orange" : "green"} dot>
                    {wpBoot
                      ? wpBoot.demo
                        ? "Setup required"
                        : testMode
                          ? "Test mode"
                          : "Configured"
                      : "Demo mode"}
                  </Badge>
                </header>
                <div className="settings-info-banner">
                  <span>
                    <LockKeyhole size={18} />
                  </span>
                  <div>
                    <strong>Your credentials stay private</strong>
                    <p>
                      Passwords are encrypted and stored server-side. They are
                      never exposed to site visitors or other network users.
                    </p>
                  </div>
                </div>
                <div className="settings-form-grid">
                  <label>
                    API username
                    <div className="input-with-icon">
                      <KeyRound size={16} />
                      <input
                        value={username}
                        onChange={(event) => {
                          setUsername(event.target.value);
                          setTested(false);
                        }}
                        placeholder={
                          wpBoot ? "••••••••••••" : "Your Oxxa API username"
                        }
                      />
                    </div>
                    <small>
                      Found under My Account → API in your Oxxa portal.
                    </small>
                  </label>
                  <label>
                    API password
                    <div className="input-with-icon">
                      <LockKeyhole size={16} />
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setTested(false);
                        }}
                        placeholder={
                          wpBoot
                            ? "Leave blank to keep current password"
                            : "Your Oxxa API password"
                        }
                      />
                    </div>
                    <small>
                      Use your separate API password, not your portal login.
                    </small>
                  </label>
                  <label className="full-field">
                    API endpoint
                    <div className="input-with-icon">
                      <Cloud size={16} />
                      <input
                        value="https://api.oxxa.com/command.php"
                        readOnly
                      />
                    </div>
                    <small>
                      Oxxa’s secure XML command endpoint. Requests are sent by
                      WordPress.
                    </small>
                  </label>
                  <label>
                    Registrant identity
                    <input
                      value={registrantIdentity}
                      onChange={(event) =>
                        setRegistrantIdentity(event.target.value)
                      }
                      placeholder="e.g. ABCD123456"
                    />
                    <small>
                      Required for registration. Find identity handles in
                      my.oxxa.com.
                    </small>
                  </label>
                  <label>
                    Nameserver group
                    <input
                      value={nsgroup}
                      onChange={(event) => setNsgroup(event.target.value)}
                      placeholder="e.g. NSGR123456"
                    />
                    <small>
                      Required. Your default Oxxa nameserver profile.
                    </small>
                  </label>
                  <label className="full-field">
                    Admin identity (optional)
                    <input
                      value={adminIdentity}
                      onChange={(event) => setAdminIdentity(event.target.value)}
                      placeholder="Defaults to the registrant identity"
                    />
                    <small>
                      Technical and billing identities also default to the
                      registrant unless configured through the REST settings
                      adapter.
                    </small>
                  </label>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <strong>Test mode</strong>
                    <p>
                      Validate registrations without paid orders. Other
                      management commands can still make real changes.
                    </p>
                  </div>
                  <Switch
                    checked={testMode}
                    onChange={() => setTestMode(!testMode)}
                    label="Oxxa test mode"
                  />
                </div>
                <footer className="settings-section-footer">
                  <div>
                    {tested && (
                      <span className="connection-success">
                        <Check size={15} /> Connection verified
                      </span>
                    )}
                  </div>
                  <button
                    className="button button-secondary"
                    disabled={testing}
                    onClick={testConnection}
                  >
                    {testing ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <PlugZap size={16} />
                    )}
                    {testing ? "Testing connection…" : "Test connection"}
                  </button>
                </footer>
              </section>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>IP whitelist</h2>
                    <p>
                      Allow this server to communicate with your Oxxa account.
                    </p>
                  </div>
                </header>
                <div className="ip-address-row">
                  <div>
                    <span>Public outbound IPv4 address</span>
                    <strong>
                      {wpBoot
                        ? wpBoot.serverIp || "Ask your hosting provider"
                        : "203.0.113.42"}
                    </strong>
                  </div>
                  <Badge tone="orange">
                    {wpBoot?.serverIp
                      ? "Verify in Oxxa"
                      : "Verification needed"}
                  </Badge>
                </div>
                <p className="settings-footnote">
                  Add your verified public outbound IP under My Account → API →
                  IP whitelist in{" "}
                  <a
                    href="https://my.oxxa.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    my.oxxa.com <ExternalLink size={12} />
                  </a>
                  .{" "}
                  {wpBoot
                    ? "You can set OXXA_STUDIO_PUBLIC_IP in wp-config.php after confirming it with your host."
                    : "The address above is reserved for documentation and used only in preview mode."}
                </p>
              </section>
            </>
          )}
          {tab === "DirectAdmin" && (
            <>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>DirectAdmin hosting API</h2>
                    <p>
                      Connect one DirectAdmin account for real user-level
                      package and usage data.
                    </p>
                  </div>
                  <Badge
                    tone={
                      directAdminTested
                        ? "green"
                        : wpBoot?.directAdmin?.configured
                          ? "blue"
                          : "orange"
                    }
                    dot
                  >
                    {directAdminTested
                      ? "Verified"
                      : wpBoot?.directAdmin?.configured
                        ? "Configured"
                        : wpBoot
                          ? "Not configured"
                          : "Demo mode"}
                  </Badge>
                </header>
                <div className="settings-info-banner">
                  <span>
                    <LockKeyhole size={18} />
                  </span>
                  <div>
                    <strong>Use a restricted Login Key</strong>
                    <p>
                      Create a key under DirectAdmin → Advanced Features → Login
                      Keys. Allow CMD_API_SHOW_USER_CONFIG and
                      CMD_API_SHOW_USER_USAGE for account sync. Add CMD_API_POP
                      only when mailbox listing and creation are needed.
                      Restrict its IP where possible. The key is encrypted by
                      WordPress.
                    </p>
                  </div>
                </div>
                <div className="settings-form-grid">
                  <label className="full-field">
                    DirectAdmin base URL
                    <div className="input-with-icon">
                      <Cloud size={16} />
                      <input
                        type="url"
                        value={directAdminUrl}
                        onChange={(event) => {
                          setDirectAdminUrl(event.target.value);
                          setDirectAdminTested(false);
                        }}
                        placeholder="https://hosting.example.com:2222"
                      />
                    </div>
                    <small>
                      HTTPS only, without a path or credentials. Port 2222 is
                      added when omitted.
                    </small>
                  </label>
                  <label>
                    DirectAdmin username
                    <div className="input-with-icon">
                      <KeyRound size={16} />
                      <input
                        value={directAdminUsername}
                        onChange={(event) => {
                          setDirectAdminUsername(event.target.value);
                          setDirectAdminTested(false);
                        }}
                        placeholder="Hosting account username"
                        autoComplete="username"
                      />
                    </div>
                  </label>
                  <label>
                    Login Key
                    <div className="input-with-icon">
                      <LockKeyhole size={16} />
                      <input
                        type="password"
                        value={directAdminPassword}
                        onChange={(event) => {
                          setDirectAdminPassword(event.target.value);
                          setDirectAdminTested(false);
                        }}
                        placeholder={
                          wpBoot?.directAdmin?.configured
                            ? "Leave blank to keep the current key"
                            : "Restricted DirectAdmin Login Key"
                        }
                        autoComplete="new-password"
                      />
                    </div>
                    <small>
                      Not your main password. Clear the URL or username and save
                      to remove the stored key.
                    </small>
                  </label>
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <strong>Account sync & explicit mailbox creation</strong>
                    <p>
                      Tests and syncs read account configuration and usage.
                      Mailboxes are listed on Hosting and created only after you
                      submit the mailbox form. No mailbox deletion, password
                      reset, DNS, database, FTP, package or backup command is
                      executed.
                    </p>
                  </div>
                  <a
                    className="text-button"
                    href="https://docs.directadmin.com/developer/api/legacy-api.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    API documentation <ExternalLink size={13} />
                  </a>
                </div>
                <footer className="settings-section-footer">
                  <div>
                    {directAdminTested && (
                      <span className="connection-success">
                        <Check size={15} /> Account and usage verified
                      </span>
                    )}
                  </div>
                  <button
                    className="button button-secondary"
                    disabled={directAdminTesting}
                    onClick={testDirectAdmin}
                  >
                    {directAdminTesting ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <PlugZap size={16} />
                    )}
                    {directAdminTesting
                      ? "Reading account…"
                      : "Test connection"}
                  </button>
                </footer>
              </section>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>Save, then synchronize</h2>
                    <p>
                      Test first, choose Save changes, then open Hosting → Sync
                      DirectAdmin to cache the verified data for your network.
                    </p>
                  </div>
                </header>
              </section>
            </>
          )}
          {tab === "Multisite network" && (
            <>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>Network identity</h2>
                    <p>
                      The primary details for your WordPress Multisite
                      installation.
                    </p>
                  </div>
                  <Badge tone="green" dot>
                    Multisite active
                  </Badge>
                </header>
                <div className="settings-form-grid">
                  <label>
                    Network name
                    <div className="input-with-icon">
                      <Wordpress size={16} />
                      <input
                        value={networkName}
                        onChange={(event) => setNetworkName(event.target.value)}
                      />
                    </div>
                  </label>
                  <label>
                    Network admin email
                    <div className="input-with-icon">
                      <UsersRound size={16} />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(event) => setAdminEmail(event.target.value)}
                      />
                    </div>
                  </label>
                  <label className="full-field">
                    Primary network domain
                    <div className="input-with-icon">
                      <Globe2 size={16} />
                      <input
                        value={networkDomain}
                        onChange={(event) =>
                          setNetworkDomain(event.target.value)
                        }
                      />
                    </div>
                    <small>
                      New websites use subdirectory addresses on this domain.
                    </small>
                  </label>
                </div>
              </section>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>Site provisioning</h2>
                    <p>
                      Defaults applied when your team creates a new client
                      website.
                    </p>
                  </div>
                </header>
                <div className="settings-toggle-row">
                  <div>
                    <strong>Automatic SSL provisioning</strong>
                    <p>
                      Request and install SSL when a mapped domain is connected.
                    </p>
                  </div>
                  <Switch
                    checked={autoSsl}
                    onChange={() => setAutoSsl(!autoSsl)}
                    label="Automatic SSL"
                  />
                </div>
                <div className="settings-toggle-row">
                  <div>
                    <strong>Daily network backups</strong>
                    <p>
                      Back up every network site and retain restore points for
                      30 days.
                    </p>
                  </div>
                  <Switch
                    checked={autoBackups}
                    onChange={() => setAutoBackups(!autoBackups)}
                    label="Daily backups"
                  />
                </div>
              </section>
            </>
          )}
          {tab === "White label" && (
            <>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>Your studio brand</h2>
                    <p>White-label the experience for your team and clients.</p>
                  </div>
                </header>
                <div className="settings-form-grid">
                  <label>
                    Studio display name
                    <div className="input-with-icon">
                      <Palette size={16} />
                      <input defaultValue="North & Co. Studio" />
                    </div>
                  </label>
                  <label>
                    Accent color
                    <div className="color-input settings-color">
                      <i style={{ background: brandColor }} />
                      <input
                        value={brandColor}
                        onChange={(event) => setBrandColor(event.target.value)}
                      />
                    </div>
                  </label>
                  <label className="full-field">
                    Client support URL
                    <div className="input-with-icon">
                      <ExternalLink size={16} />
                      <input defaultValue="https://northco.design/support" />
                    </div>
                  </label>
                </div>
              </section>
              <section className="card settings-section">
                <header>
                  <div>
                    <h2>Client dashboard</h2>
                    <p>
                      Your identity stays front and center. Oxxa remains
                      invisible to clients.
                    </p>
                  </div>
                </header>
                <div className="white-label-preview">
                  <div className="white-label-logo">
                    <span>N</span>
                    <strong>North & Co.</strong>
                  </div>
                  <div>
                    <strong>Your client portal, your brand.</strong>
                    <p>
                      Custom logo, colors, domain, invoices and email
                      notifications.
                    </p>
                  </div>
                  <Badge tone="green">White label on</Badge>
                </div>
              </section>
            </>
          )}
          {tab === "Notifications" && (
            <section className="card settings-section">
              <header>
                <div>
                  <h2>Email notifications</h2>
                  <p>Choose which network events reach your inbox.</p>
                </div>
              </header>
              {[
                {
                  title: "Weekly studio summary",
                  text: "Revenue, new sites and activity every Monday morning.",
                  value: emailUpdates,
                  set: setEmailUpdates,
                },
                {
                  title: "Domain expiry alerts",
                  text: "Receive alerts 30, 14 and 7 days before a domain expires.",
                  value: domainAlerts,
                  set: setDomainAlerts,
                },
                {
                  title: "Failed backup alerts",
                  text: "Get notified immediately if a scheduled network backup fails.",
                  value: true,
                  set: () =>
                    notify(
                      "Critical alerts stay enabled",
                      "Failed backup alerts cannot be disabled for network administrators.",
                    ),
                },
                {
                  title: "Successful payment receipts",
                  text: "Receive a copy whenever a client invoice is paid.",
                  value: false,
                  set: () =>
                    notify(
                      "Preference updated",
                      "Payment receipt notifications can be changed in the live plugin.",
                    ),
                },
              ].map((item) => (
                <div className="settings-toggle-row" key={item.title}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                  <Switch
                    checked={item.value}
                    onChange={() => item.set(!item.value)}
                    label={item.title}
                  />
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
