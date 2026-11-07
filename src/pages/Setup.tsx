import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  ExternalLink,
  Globe2,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Network,
  PlugZap,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Wordpress } from "../components/Wordpress";
import { Badge, Switch } from "../components/UI";
import {
  checkDomain,
  wpBoot,
  wpRequest,
  type DomainAvailability,
  type SystemStatus,
} from "../lib/wp";
import type { PageId } from "../types";

const demoStatus: SystemStatus = {
  multisite: true,
  canProvision: true,
  openssl: true,
  simplexml: true,
  https: true,
  themeInstalled: true,
  themeEnabled: true,
  credentials: false,
  registrationReady: false,
  testMode: true,
  siteCount: 148,
  phpVersion: "8.3.14",
  wpVersion: "6.9",
  serverIp: "203.0.113.42",
};

interface SetupProps {
  navigate: (page: PageId) => void;
  notify: (title: string, message: string) => void;
}

export default function Setup({ navigate, notify }: SetupProps) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState(wpBoot?.settings?.username || "");
  const [password, setPassword] = useState("");
  const [testMode, setTestMode] = useState(wpBoot?.testMode ?? true);
  const [connected, setConnected] = useState(false);
  const [registrant, setRegistrant] = useState(
    wpBoot?.settings?.registrantIdentity || "",
  );
  const [adminIdentity, setAdminIdentity] = useState(
    wpBoot?.settings?.adminIdentity || "",
  );
  const [nsgroup, setNsgroup] = useState(wpBoot?.settings?.nsgroup || "");
  const [testDomain, setTestDomain] = useState("craftedspaces.com");
  const [lookup, setLookup] = useState<DomainAvailability | null>(null);
  const [lookupComplete, setLookupComplete] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadStatus() {
    setLoadError("");
    try {
      if (wpBoot) {
        const result = await wpRequest<SystemStatus>("status");
        setStatus(result);
        setTestMode(result.testMode);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 350));
        setStatus(demoStatus);
      }
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "The system check could not be loaded.",
      );
    }
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  const systemReady = useMemo(
    () =>
      Boolean(
        status?.multisite &&
        status.canProvision &&
        status.openssl &&
        status.simplexml &&
        status.https,
      ),
    [status],
  );
  const connectionReady = Boolean(status?.credentials && connected);
  const registrationReady = Boolean(status?.registrationReady);
  const launchReady = Boolean(
    systemReady &&
    connectionReady &&
    registrationReady &&
    status?.themeInstalled &&
    status.themeEnabled &&
    lookupComplete,
  );
  const completed = [
    systemReady,
    connectionReady,
    registrationReady,
    launchReady,
  ].filter(Boolean).length;

  const steps = [
    {
      number: 1,
      title: "System health",
      description: "WordPress and server checks",
      ready: systemReady,
    },
    {
      number: 2,
      title: "Oxxa connection",
      description: "Secure API authentication",
      ready: connectionReady,
    },
    {
      number: 3,
      title: "Registration defaults",
      description: "Identities and nameservers",
      ready: registrationReady,
    },
    {
      number: 4,
      title: "Verify & launch",
      description: "Theme and safe API lookup",
      ready: launchReady,
    },
  ];

  function showError(error: unknown, fallback: string) {
    setFormError(error instanceof Error ? error.message : fallback);
  }

  async function connect() {
    setFormError("");
    if (!username || (!password && !status?.credentials)) {
      setFormError("Enter your Oxxa API username and password to continue.");
      return;
    }
    setBusy(true);
    try {
      if (wpBoot) {
        await wpRequest("settings", {
          method: "POST",
          body: JSON.stringify({
            username,
            password: password || undefined,
            testMode,
          }),
        });
        await wpRequest("connection/test", {
          method: "POST",
          body: JSON.stringify({
            username,
            password: password || undefined,
            testMode,
          }),
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setStatus((current) =>
        current ? { ...current, credentials: true, testMode } : current,
      );
      setPassword("");
      setConnected(true);
      notify(
        "Oxxa connection verified",
        testMode
          ? "The API responded successfully. Test mode is protecting registrations."
          : "The API responded successfully. Live registration mode is enabled.",
      );
    } catch (error) {
      setConnected(false);
      showError(error, "Oxxa could not verify this connection.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDefaults() {
    setFormError("");
    if (!registrant.trim() || !nsgroup.trim()) {
      setFormError(
        "A registrant identity and nameserver group are both required.",
      );
      return;
    }
    setBusy(true);
    try {
      if (wpBoot) {
        await wpRequest("settings", {
          method: "POST",
          body: JSON.stringify({
            registrantIdentity: registrant,
            adminIdentity,
            nsgroup,
          }),
        });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setStatus((current) =>
        current ? { ...current, registrationReady: true } : current,
      );
      notify(
        "Registration defaults saved",
        "New registrations will use these Oxxa identities and nameservers.",
      );
    } catch (error) {
      showError(error, "The registration defaults could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function runLookup(event: React.FormEvent) {
    event.preventDefault();
    setFormError("");
    setLookup(null);
    setLookupComplete(false);
    setBusy(true);
    try {
      const result = await checkDomain(testDomain);
      setLookup(result);
      setLookupComplete(true);
      notify(
        "Safe API lookup complete",
        "Oxxa returned a live availability response. No domain was ordered.",
      );
    } catch (error) {
      showError(
        error,
        "The test lookup failed. Check the connection and IP whitelist.",
      );
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    if (wpBoot) {
      window.location.hash = "overview";
      window.location.reload();
    } else {
      navigate("overview");
      notify(
        "Setup walkthrough complete",
        "Your demo studio is ready to explore.",
      );
    }
  }

  if (!status && !loadError) {
    return (
      <div className="setup-loading">
        <span className="setup-loader">
          <LoaderCircle size={28} className="spin" />
        </span>
        <h1>Checking your network…</h1>
        <p>Reading WordPress and server requirements.</p>
      </div>
    );
  }

  if (loadError || !status) {
    return (
      <div className="setup-loading setup-load-error">
        <span>
          <Cloud size={28} />
        </span>
        <h1>We couldn’t read the system status.</h1>
        <p>{loadError}</p>
        <button className="button button-primary" onClick={loadStatus}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="setup-page">
      <header className="setup-heading">
        <div>
          <div className="eyebrow">NETWORK ONBOARDING</div>
          <h1>Let’s get your studio live.</h1>
          <p>
            Four guided checks to connect WordPress Multisite and Oxxa with
            confidence.
          </p>
        </div>
        <div className="setup-progress-summary">
          <div>
            <span>Setup progress</span>
            <strong>{completed} of 4 complete</strong>
          </div>
          <div className="setup-progress-track">
            <i style={{ width: `${completed * 25}%` }} />
          </div>
          <button onClick={() => navigate("overview")}>
            Skip to dashboard
          </button>
        </div>
      </header>

      <div className="setup-layout">
        <aside className="setup-steps card">
          {steps.map((item) => (
            <button
              key={item.number}
              className={`${step === item.number ? "active" : ""} ${item.ready ? "complete" : ""}`}
              onClick={() => {
                setStep(item.number);
                setFormError("");
              }}
            >
              <span className="setup-step-number">
                {item.ready ? <Check size={15} /> : item.number}
              </span>
              <span>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
          <div className="setup-safe-note">
            <ShieldCheck size={19} />
            <strong>No surprise orders</strong>
            <p>
              The final check is read-only. Domain registration always needs a
              separate confirmation.
            </p>
          </div>
        </aside>

        <main className="setup-main card">
          {step === 1 && (
            <section className="setup-panel">
              <div className="setup-panel-heading">
                <span className="setup-panel-icon">
                  <Server size={22} />
                </span>
                <div>
                  <Badge tone={systemReady ? "green" : "orange"}>
                    {systemReady ? "READY" : "ACTION NEEDED"}
                  </Badge>
                  <h2>
                    Your foundation looks {systemReady ? "good" : "incomplete"}.
                  </h2>
                  <p>
                    Oxxa Studio needs a secure Multisite and a few standard PHP
                    extensions.
                  </p>
                </div>
              </div>
              <div className="setup-version-row">
                <span>
                  WordPress <strong>{status.wpVersion}</strong>
                </span>
                <span>
                  PHP <strong>{status.phpVersion}</strong>
                </span>
                <span>
                  Network sites <strong>{status.siteCount}</strong>
                </span>
              </div>
              <div className="setup-check-list">
                {[
                  {
                    label: "WordPress Multisite",
                    detail: "Network management is available",
                    pass: status.multisite,
                  },
                  {
                    label: "Super admin permission",
                    detail: "manage_network capability confirmed",
                    pass: status.canProvision,
                  },
                  {
                    label: "Encrypted credential storage",
                    detail: "OpenSSL AES-256-GCM support",
                    pass: status.openssl,
                  },
                  {
                    label: "Oxxa XML responses",
                    detail: "PHP SimpleXML extension",
                    pass: status.simplexml,
                  },
                  {
                    label: "Secure admin and website URLs",
                    detail: "HTTPS protects sessions and credentials",
                    pass: status.https,
                  },
                  {
                    label: "WordPress REST API",
                    detail: "Status endpoint responded successfully",
                    pass: true,
                  },
                ].map((check) => (
                  <div className="setup-check-row" key={check.label}>
                    <span className={check.pass ? "pass" : "fail"}>
                      {check.pass ? <Check size={15} /> : "!"}
                    </span>
                    <div>
                      <strong>{check.label}</strong>
                      <small>{check.detail}</small>
                    </div>
                    <Badge tone={check.pass ? "green" : "orange"}>
                      {check.pass ? "Passed" : "Review"}
                    </Badge>
                  </div>
                ))}
              </div>
              <footer className="setup-panel-footer">
                <button className="text-button" onClick={loadStatus}>
                  Run checks again
                </button>
                <button
                  className="button button-primary"
                  disabled={!systemReady}
                  onClick={() => setStep(2)}
                >
                  Connect Oxxa <ArrowRight size={16} />
                </button>
              </footer>
            </section>
          )}

          {step === 2 && (
            <section className="setup-panel">
              <div className="setup-panel-heading">
                <span className="setup-panel-icon">
                  <PlugZap size={22} />
                </span>
                <div>
                  <Badge tone={connectionReady ? "green" : "orange"}>
                    {connectionReady ? "CONNECTED" : "CONNECTION REQUIRED"}
                  </Badge>
                  <h2>Connect your Oxxa reseller account.</h2>
                  <p>
                    WordPress sends API requests server-side. Your password is
                    encrypted and never returned to the browser.
                  </p>
                </div>
              </div>
              <div className="setup-form-grid">
                <label>
                  API username
                  <div className="input-with-icon">
                    <KeyRound size={16} />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Your Oxxa API username"
                    />
                  </div>
                </label>
                <label>
                  API password
                  <div className="input-with-icon">
                    <LockKeyhole size={16} />
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={
                        status.credentials
                          ? "Leave blank to keep saved password"
                          : "Your separate API password"
                      }
                    />
                  </div>
                </label>
                <label className="full-field">
                  Secure XML endpoint
                  <div className="input-with-icon">
                    <Cloud size={16} />
                    <input value="https://api.oxxa.com/command.php" readOnly />
                  </div>
                </label>
              </div>
              <div className="settings-toggle-row">
                <div>
                  <strong>Oxxa test mode</strong>
                  <p>
                    Validate registrations without paid orders. Other account
                    commands may still make changes.
                  </p>
                </div>
                <Switch
                  checked={testMode}
                  onChange={() => setTestMode(!testMode)}
                  label="Oxxa test mode"
                />
              </div>
              {connected && (
                <div className="setup-success-banner">
                  <CheckCircle2 size={19} />
                  <div>
                    <strong>Connection verified</strong>
                    <p>
                      Oxxa accepted the credentials and returned a valid XML
                      response.
                    </p>
                  </div>
                </div>
              )}
              <div className="setup-ip-note">
                <Network size={17} />
                <div>
                  <strong>Remember the IP whitelist</strong>
                  <p>
                    Whitelist your verified public outbound IP in my.oxxa.com
                    before testing.
                    {status.serverIp
                      ? ` Configured address: ${status.serverIp}`
                      : " No public IP is configured in wp-config.php yet."}
                  </p>
                </div>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <footer className="setup-panel-footer">
                <button
                  className="button button-secondary"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <div>
                  {connectionReady && (
                    <button
                      className="button button-soft"
                      onClick={() => setStep(3)}
                    >
                      Continue <ArrowRight size={15} />
                    </button>
                  )}
                  <button
                    className="button button-primary"
                    disabled={busy}
                    onClick={connect}
                  >
                    {busy ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <PlugZap size={16} />
                    )}
                    {busy ? "Testing connection…" : "Save & test connection"}
                  </button>
                </div>
              </footer>
            </section>
          )}

          {step === 3 && (
            <section className="setup-panel">
              <div className="setup-panel-heading">
                <span className="setup-panel-icon">
                  <Globe2 size={22} />
                </span>
                <div>
                  <Badge tone={registrationReady ? "green" : "orange"}>
                    {registrationReady
                      ? "DEFAULTS READY"
                      : "REQUIRED FOR REGISTRATION"}
                  </Badge>
                  <h2>Set safe registration defaults.</h2>
                  <p>
                    Oxxa requires existing identity and nameserver handles when
                    registering a domain.
                  </p>
                </div>
              </div>
              <div className="setup-form-grid">
                <label>
                  Registrant identity
                  <input
                    value={registrant}
                    onChange={(event) => setRegistrant(event.target.value)}
                    placeholder="e.g. ABCD123456"
                  />
                  <small>The legal domain holder’s Oxxa identity handle.</small>
                </label>
                <label>
                  Nameserver group
                  <input
                    value={nsgroup}
                    onChange={(event) => setNsgroup(event.target.value)}
                    placeholder="e.g. NSGR123456"
                  />
                  <small>Your default Oxxa nameserver profile handle.</small>
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
                    registrant.
                  </small>
                </label>
              </div>
              <div className="setup-ip-note">
                <ShieldCheck size={17} />
                <div>
                  <strong>Existing handles only</strong>
                  <p>
                    Find these in your Oxxa portal under Identities and
                    Nameserver groups. No identity is created without your
                    confirmation.
                  </p>
                </div>
              </div>
              {formError && <div className="form-error">{formError}</div>}
              <footer className="setup-panel-footer">
                <button
                  className="button button-secondary"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <div>
                  {registrationReady && (
                    <button
                      className="button button-soft"
                      onClick={() => setStep(4)}
                    >
                      Continue <ArrowRight size={15} />
                    </button>
                  )}
                  <button
                    className="button button-primary"
                    disabled={busy}
                    onClick={saveDefaults}
                  >
                    {busy ? (
                      <LoaderCircle size={16} className="spin" />
                    ) : (
                      <Check size={16} />
                    )}
                    {busy ? "Saving…" : "Save registration defaults"}
                  </button>
                </div>
              </footer>
            </section>
          )}

          {step === 4 && (
            <section className="setup-panel">
              <div className="setup-panel-heading">
                <span className="setup-panel-icon">
                  <Rocket size={22} />
                </span>
                <div>
                  <Badge tone={launchReady ? "green" : "orange"}>
                    {launchReady ? "READY TO LAUNCH" : "FINAL VERIFICATION"}
                  </Badge>
                  <h2>One safe check, then you’re ready.</h2>
                  <p>
                    Confirm the block theme and perform a read-only Oxxa domain
                    availability lookup.
                  </p>
                </div>
              </div>
              <div className="setup-theme-card">
                <span>
                  <Wordpress size={23} />
                </span>
                <div>
                  <strong>Oxxa Studio Blocks</strong>
                  <p>Companion theme for published studio designs.</p>
                </div>
                <Badge tone={status.themeEnabled ? "green" : "orange"} dot>
                  {status.themeInstalled
                    ? status.themeEnabled
                      ? "Network enabled"
                      : "Needs network enable"
                    : "Theme not installed"}
                </Badge>
                {!status.themeEnabled && (
                  <a
                    className="button button-secondary"
                    href={wpBoot ? `${wpBoot.adminUrl}themes.php` : "#"}
                    target={wpBoot ? "_blank" : undefined}
                    rel="noreferrer"
                  >
                    Open themes <ExternalLink size={14} />
                  </a>
                )}
              </div>
              <form className="setup-lookup" onSubmit={runLookup}>
                <label>
                  Read-only domain lookup
                  <div>
                    <Globe2 size={18} />
                    <input
                      value={testDomain}
                      onChange={(event) => {
                        setTestDomain(event.target.value);
                        setLookupComplete(false);
                        setLookup(null);
                      }}
                      placeholder="example.com"
                    />
                    <button
                      className="button button-primary"
                      disabled={busy || !connectionReady}
                    >
                      {busy ? (
                        <LoaderCircle size={16} className="spin" />
                      ) : (
                        <PlugZap size={16} />
                      )}
                      {busy ? "Checking…" : "Test Oxxa lookup"}
                    </button>
                  </div>
                  <small>
                    This calls domain_check only. It does not register, renew,
                    or charge for a domain.
                  </small>
                </label>
              </form>
              {lookup && (
                <div
                  className={`setup-lookup-result ${lookup.available ? "available" : "taken"}`}
                >
                  <span>{lookup.available ? <Check size={18} /> : "×"}</span>
                  <div>
                    <strong>{lookup.domain}</strong>
                    <p>{lookup.message}</p>
                  </div>
                  <Badge tone={lookup.available ? "green" : "neutral"}>
                    {lookup.available
                      ? `€${lookup.price.toFixed(2)} / year`
                      : "Registered"}
                  </Badge>
                </div>
              )}
              {!connectionReady && (
                <div className="form-error">
                  Complete the Oxxa connection step before running the test
                  lookup.
                </div>
              )}
              {formError && <div className="form-error">{formError}</div>}
              {launchReady && (
                <div className="setup-launch-banner">
                  <Sparkles size={23} />
                  <div>
                    <strong>Your studio is ready.</strong>
                    <p>
                      Multisite, Oxxa, registration defaults, theme, and API
                      lookup are verified.
                    </p>
                  </div>
                </div>
              )}
              <footer className="setup-panel-footer">
                <button
                  className="button button-secondary"
                  onClick={() => setStep(3)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <button
                  className="button button-primary"
                  disabled={!launchReady}
                  onClick={finish}
                >
                  <Rocket size={16} /> Open studio dashboard{" "}
                  <ArrowRight size={16} />
                </button>
              </footer>
            </section>
          )}
        </main>
      </div>
      <footer className="setup-support">
        <span>
          <ShieldCheck size={14} /> Credentials stay on your WordPress server.
        </span>
        <a
          href="https://www.oxxa.com/index.php/en/wiki/hoe-gebruik-ik-de-api"
          target="_blank"
          rel="noreferrer"
        >
          Oxxa API setup guide <ExternalLink size={13} />
        </a>
      </footer>
    </div>
  );
}
