import { useEffect, type ReactNode } from "react";
import { Check, ChevronDown, Globe2, X } from "lucide-react";
import type { Site, StudioTemplate } from "../types";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`brand ${compact ? "brand-compact" : ""}`}
      aria-label="Oxxa Studio"
    >
      <svg
        className="brand-mark"
        width="30"
        height="30"
        viewBox="0 0 30 30"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 9.5C4 6.462 6.462 4 9.5 4h3C15.538 4 18 6.462 18 9.5v3c0 3.038-2.462 5.5-5.5 5.5h-3C6.462 18 4 15.538 4 12.5v-3Z"
          fill="currentColor"
        />
        <path
          d="M12 17.5c0-3.038 2.462-5.5 5.5-5.5h3c3.038 0 5.5 2.462 5.5 5.5v3c0 3.038-2.462 5.5-5.5 5.5h-3c-3.038 0-5.5-2.462-5.5-5.5v-3Z"
          fill="currentColor"
          opacity=".55"
        />
      </svg>
      {!compact && (
        <>
          <span className="brand-word">oxxa</span>
          <span className="brand-divider" />
          <span className="brand-studio">STUDIO</span>
        </>
      )}
    </div>
  );
}

export function Avatar({
  initials,
  color = "#dce5d4",
  size = "md",
}: {
  initials: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span className={`avatar avatar-${size}`} style={{ background: color }}>
      {initials}
    </span>
  );
}

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: ReactNode;
  tone?: "green" | "orange" | "red" | "blue" | "purple" | "neutral";
  dot?: boolean;
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function statusTone(
  status: string,
): "green" | "orange" | "red" | "blue" | "purple" | "neutral" {
  if (["Live", "Active", "Paid", "Connected"].includes(status)) return "green";
  if (["Maintenance", "Expiring soon", "Open", "Lead"].includes(status))
    return "orange";
  if (["Overdue", "Action needed", "Expired"].includes(status)) return "red";
  if (status === "Draft" || status === "Pending") return "blue";
  return "neutral";
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`switch ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
    >
      <span />
    </button>
  );
}

export function Modal({
  children,
  onClose,
  title,
  subtitle,
  size = "md",
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", close);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function Drawer({
  children,
  onClose,
  title,
  subtitle,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
}) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);
  return (
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside className="detail-drawer">
        <header className="drawer-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={19} />
          </button>
        </header>
        {children}
      </aside>
    </div>
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function SitePreview({
  site,
  large = false,
}: {
  site: Site;
  large?: boolean;
}) {
  return (
    <div
      className={`site-preview ${large ? "site-preview-large" : ""}`}
      style={
        {
          background: site.theme,
          "--site-accent": site.accent,
        } as React.CSSProperties
      }
    >
      <div className="preview-browser-bar">
        <i />
        <i />
        <i />
        <span>{site.domain}</span>
      </div>
      <div className="preview-site-nav">
        <b>
          {site.name.split(" ")[0]}
          <em>.</em>
        </b>
        <span>
          <i /> <i /> <i />
        </span>
      </div>
      <div className="preview-site-hero">
        <div>
          <small>INDEPENDENT & CONSIDERED</small>
          <strong>
            {site.template === "Portfolio"
              ? "Spaces for\nbetter living."
              : site.template === "Hospitality"
                ? "Good coffee.\nSlow mornings."
                : "Thoughtful work,\nmade to last."}
          </strong>
          <span className="preview-cta">
            EXPLORE MORE <b>↗</b>
          </span>
        </div>
        <div className="preview-art">
          <span />
          <i>{site.initials}</i>
        </div>
      </div>
    </div>
  );
}

export function TemplatePreview({
  template,
  large = false,
}: {
  template: StudioTemplate;
  large?: boolean;
}) {
  const titles: Record<string, string> = {
    editorial: "Objects with\na story.",
    portfolio: "Space, light\n& purpose.",
    restaurant: "Meet at noon.",
    commerce: "Less, but\nbetter.",
    business: "We make brands\nmatter.",
    saas: "Work, simplified.",
  };
  return (
    <div
      className={`template-preview template-${template.style} ${large ? "template-preview-large" : ""}`}
      style={
        {
          background: template.color,
          "--template-accent": template.accent,
        } as React.CSSProperties
      }
    >
      <div className="template-nav">
        <b>
          {template.name}
          <i>.</i>
        </b>
        <div>
          <span>Work</span>
          <span>About</span>
          <span>Contact</span>
        </div>
        <span className="template-nav-button">Let’s talk</span>
      </div>
      <div className="template-body">
        <div className="template-copy">
          <small>{template.category.toUpperCase()} · EST. 2018</small>
          <h3>{titles[template.style]}</h3>
          <p>
            Thoughtful ideas and meaningful experiences, created with purpose.
          </p>
          <span className="template-link">
            Discover our work <b>↗</b>
          </span>
        </div>
        <div className="template-visual">
          <div className="visual-shape shape-one" />
          <div className="visual-shape shape-two" />
          <span>{template.name.charAt(0)}</span>
        </div>
      </div>
      <div className="template-footer">
        <span>SELECTED WORK · 2026</span>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

export function SelectButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button className="select-button" onClick={onClick}>
      {children}
      <ChevronDown size={15} />
    </button>
  );
}

export function ConnectedDot() {
  return (
    <span className="connected-dot">
      <Check size={9} strokeWidth={3} />
    </span>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span>
        <Globe2 size={25} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
