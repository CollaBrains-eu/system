import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";
import { Badge } from "./UI";
import {
  wpRequest,
  type DirectAdminMailbox,
  type DirectAdminMailboxList,
} from "../lib/wp";

const demoMailboxes: DirectAdminMailbox[] = [
  {
    username: "hello",
    email: "hello@ateliermorrow.com",
    quotaMb: 2048,
    usageMb: 684.2,
    sent: 18,
    dailyLimit: 200,
    suspended: false,
  },
  {
    username: "studio",
    email: "studio@ateliermorrow.com",
    quotaMb: 1024,
    usageMb: 126.8,
    sent: 4,
    dailyLimit: 100,
    suspended: false,
  },
];

function formatMb(value: number | null) {
  if (value === null) return "—";
  if (value >= 1024) return `${(value / 1024).toFixed(1)} GB`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} MB`;
}

export default function DirectAdminMailboxes({
  domain,
  demo,
  notify,
}: {
  domain: string;
  demo: boolean;
  notify: (title: string, message: string) => void;
}) {
  const [mailboxes, setMailboxes] = useState<DirectAdminMailbox[]>(
    demo ? demoMailboxes : [],
  );
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [username, setUsername] = useState("");
  const [quota, setQuota] = useState(1024);
  const [dailyLimit, setDailyLimit] = useState(200);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loadMailboxes = useCallback(async () => {
    if (demo) return;
    if (!domain) {
      setError("The DirectAdmin account does not report a primary domain.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await wpRequest<DirectAdminMailboxList>(
        `directadmin/mailboxes?domain=${encodeURIComponent(domain)}`,
      );
      setMailboxes(result.mailboxes);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Mailboxes could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [demo, domain]);

  useEffect(() => {
    void loadMailboxes();
  }, [loadMailboxes]);

  async function createMailbox(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    const normalizedUsername = username.trim().toLowerCase();
    if (
      !/^[a-z0-9][a-z0-9._-]{0,62}$/.test(normalizedUsername) ||
      normalizedUsername.endsWith(".") ||
      normalizedUsername.includes("..")
    ) {
      setFormError(
        "Enter a valid mailbox name using letters, numbers, dots, underscores or hyphens.",
      );
      return;
    }
    if (password.length < 12 || password.length > 128) {
      setFormError("Use a password between 12 and 128 characters.");
      return;
    }
    if (password !== confirmation) {
      setFormError("The password confirmation does not match.");
      return;
    }
    setCreating(true);
    try {
      if (demo) {
        await new Promise((resolve) => setTimeout(resolve, 650));
        const normalized = normalizedUsername;
        if (mailboxes.some((mailbox) => mailbox.username === normalized)) {
          throw new Error("This demo mailbox already exists.");
        }
        setMailboxes((current) => [
          ...current,
          {
            username: normalized,
            email: `${normalized}@${domain}`,
            quotaMb: quota,
            usageMb: 0,
            sent: 0,
            dailyLimit,
            suspended: false,
          },
        ]);
      } else {
        await wpRequest("directadmin/mailboxes", {
          method: "POST",
          body: JSON.stringify({
            domain,
            user: username,
            password,
            passwordConfirmation: confirmation,
            quota,
            dailyLimit,
          }),
        });
        await loadMailboxes();
      }
      const address = `${normalizedUsername}@${domain}`;
      setFormOpen(false);
      setUsername("");
      setQuota(1024);
      setDailyLimit(200);
      notify(
        demo ? "Demo mailbox added" : "Mailbox created",
        demo
          ? `${address} was added locally. No DirectAdmin request was made.`
          : `${address} was created through DirectAdmin. The password was not stored by Oxxa Studio.`,
      );
    } catch (requestError) {
      setFormError(
        requestError instanceof Error
          ? requestError.message
          : "The mailbox could not be created.",
      );
    } finally {
      setPassword("");
      setConfirmation("");
      setShowPassword(false);
      setCreating(false);
    }
  }

  return (
    <section className="card directadmin-mailboxes">
      <header className="card-header mailbox-header">
        <div>
          <h2>Email accounts</h2>
          <p>
            {demo
              ? `Illustrative mailboxes for ${domain}`
              : `Real mailboxes on the authenticated account domain ${domain}`}
          </p>
        </div>
        <div className="mailbox-header-actions">
          <Badge tone={demo ? "blue" : "green"} dot>
            {demo ? "Demo mailboxes" : "DirectAdmin"}
          </Badge>
          <button
            className="tiny-button"
            aria-label="Refresh mailboxes"
            disabled={loading || demo}
            title={demo ? "Demo data is stored locally" : "Refresh mailboxes"}
            onClick={() => void loadMailboxes()}
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
          <button
            className="button button-secondary"
            onClick={() => {
              setFormOpen(!formOpen);
              setFormError("");
            }}
          >
            {formOpen ? <X size={16} /> : <Plus size={16} />}
            {formOpen ? "Close" : demo ? "Add demo mailbox" : "Create mailbox"}
          </button>
        </div>
      </header>

      {error && (
        <div className="mailbox-error" role="alert">
          <strong>Mailbox data is unavailable</strong>
          <span>{error}</span>
          <button className="text-button" onClick={() => void loadMailboxes()}>
            Try again
          </button>
        </div>
      )}

      {formOpen && (
        <form className="mailbox-create-form" onSubmit={createMailbox}>
          <div className="mailbox-form-heading">
            <Mail size={19} />
            <div>
              <strong>
                {demo ? "Add an illustrative mailbox" : "Create a real mailbox"}
              </strong>
              <span>
                {demo
                  ? "Only this browser preview will change."
                  : "This executes CMD_API_POP action=create on your DirectAdmin account."}
              </span>
            </div>
          </div>
          <div className="mailbox-form-grid">
            <label>
              Mailbox name
              <div className="mailbox-local-input">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="hello"
                  pattern="[A-Za-z0-9][A-Za-z0-9._\-]{0,62}"
                  maxLength={64}
                  required
                  autoFocus
                />
                <span>@{domain}</span>
              </div>
            </label>
            <label>
              Quota (MB)
              <input
                type="number"
                min={1}
                max={1048576}
                value={quota}
                onChange={(event) => setQuota(Number(event.target.value))}
                required
              />
            </label>
            <label>
              Daily send limit
              <input
                type="number"
                min={0}
                max={100000}
                value={dailyLimit}
                onChange={(event) => setDailyLimit(Number(event.target.value))}
                required
              />
              <small>0 means unlimited.</small>
            </label>
            <label>
              Mailbox password
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={12}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm password
              <input
                type={showPassword ? "text" : "password"}
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                minLength={12}
                maxLength={128}
                required
                autoComplete="new-password"
              />
            </label>
            <button
              type="button"
              className="mailbox-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPassword ? "Hide passwords" : "Show passwords"}
            </button>
          </div>
          <div className="mailbox-security-note">
            <LockKeyhole size={15} />
            Passwords are sent once to DirectAdmin and are never stored or
            returned by Oxxa Studio.
          </div>
          {formError && (
            <div className="mailbox-form-error" role="alert">
              {formError}
            </div>
          )}
          <footer>
            <span>
              {demo
                ? "Local demo only"
                : "Requires CMD_API_POP in your Login Key permissions."}
            </span>
            <button
              className="button button-primary"
              disabled={creating || !domain}
              type="submit"
            >
              {creating ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <Plus size={16} />
              )}
              {creating
                ? "Creating…"
                : demo
                  ? "Add demo mailbox"
                  : "Create mailbox"}
            </button>
          </footer>
        </form>
      )}

      <div className="table-wrap mailbox-table-wrap">
        <table className="data-table mailbox-table">
          <thead>
            <tr>
              <th>Mailbox</th>
              <th>Usage</th>
              <th>Quota</th>
              <th>Sent today</th>
              <th>Daily limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mailboxes.map((mailbox) => (
              <tr key={mailbox.email}>
                <td>
                  <div className="mailbox-address">
                    <span>
                      <Mail size={15} />
                    </span>
                    <strong>{mailbox.email}</strong>
                  </div>
                </td>
                <td>{formatMb(mailbox.usageMb)}</td>
                <td>
                  {mailbox.quotaMb === 0
                    ? "Unlimited"
                    : formatMb(mailbox.quotaMb)}
                </td>
                <td>{mailbox.sent ?? "—"}</td>
                <td>
                  {mailbox.dailyLimit === 0
                    ? "Unlimited"
                    : (mailbox.dailyLimit ?? "—")}
                </td>
                <td>
                  <Badge tone={mailbox.suspended ? "red" : "green"} dot>
                    {mailbox.suspended ? "Suspended" : "Active"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && mailboxes.length === 0 && (
          <div className="small-empty">
            <CheckCircle2 size={17} /> No mailboxes found on this domain.
          </div>
        )}
        {loading && !demo && (
          <div className="mailbox-loading">
            <LoaderCircle size={17} className="spin" /> Reading mailbox data…
          </div>
        )}
      </div>
      <footer className="mailbox-footer">
        <span>{mailboxes.length} mailboxes shown</span>
        <span>
          Deletion and password resets are not available in this release.
        </span>
      </footer>
    </section>
  );
}
