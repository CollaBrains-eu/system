import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Mail,
  MoreHorizontal,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import type { Client } from "../types";
import { Avatar, Badge, PageHeading, statusTone } from "../components/UI";

interface ClientsProps {
  clients: Client[];
  onNewClient: () => void;
  onSelect: (client: Client) => void;
  onSettings: () => void;
}

export default function Clients({
  clients,
  onNewClient,
  onSelect,
  onSettings,
}: ClientsProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All clients");
  const filtered = useMemo(
    () =>
      clients.filter(
        (client) =>
          (status === "All clients" || client.status === status) &&
          `${client.name} ${client.contact} ${client.email}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [clients, query, status],
  );
  return (
    <div>
      <PageHeading
        title="Clients"
        description="Your client relationships, websites and recurring services in one place."
        actions={
          <button className="button button-primary" onClick={onNewClient}>
            <Plus size={18} /> Add client
          </button>
        }
      />
      <section className="client-overview-grid">
        <article className="client-overview-main card">
          <div className="compact-stat-icon green">
            <UsersRound size={21} />
          </div>
          <div>
            <span>Total active clients</span>
            <strong>64</strong>
            <small>
              <b>+4</b> this month
            </small>
          </div>
          <div className="client-avatar-stack">
            {clients.slice(0, 4).map((client) => (
              <Avatar
                key={client.id}
                initials={client.initials}
                color={client.color}
              />
            ))}
            <span>+60</span>
          </div>
        </article>
        <article className="card client-small-stat">
          <span>Average revenue / client</span>
          <strong>€200.63</strong>
          <small>
            <ArrowUpRight size={13} /> 8.2% from last month
          </small>
        </article>
        <article className="card client-small-stat">
          <span>New leads</span>
          <strong>8</strong>
          <small>3 awaiting follow-up</small>
        </article>
      </section>
      <div className="list-controls">
        <div className="filter-tabs">
          {["All clients", "Active", "Lead", "Paused"].map((item) => (
            <button
              className={status === item ? "active" : ""}
              onClick={() => setStatus(item)}
              key={item}
            >
              {item}
              {item === "Lead" && (
                <span>
                  {clients.filter((client) => client.status === "Lead").length}
                </span>
              )}
            </button>
          ))}
        </div>
        <label className="inline-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search clients…"
          />
        </label>
      </div>
      <div className="card table-card">
        <div className="table-wrap">
          <table className="data-table clients-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Primary contact</th>
                <th>Websites</th>
                <th>Monthly revenue</th>
                <th>Client since</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((client) => (
                <tr key={client.id} onClick={() => onSelect(client)}>
                  <td>
                    <div className="client-cell">
                      <Avatar initials={client.initials} color={client.color} />
                      <div>
                        <strong>{client.name}</strong>
                        <span>{client.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <UserRound size={14} />
                      {client.contact}
                    </div>
                  </td>
                  <td>
                    <span className="site-count">
                      <Building2 size={14} />
                      {client.sites}
                    </span>
                  </td>
                  <td>
                    <strong>€{client.mrr.toFixed(2)}</strong>
                    <span className="muted-cell"> /mo</span>
                  </td>
                  <td className="muted-cell">{client.since}</td>
                  <td>
                    <Badge tone={statusTone(client.status)} dot>
                      {client.status}
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
          <div className="small-empty">No clients match your search.</div>
        )}
        <footer className="table-footer">
          <span>{filtered.length} client records in this view</span>
          <a
            className="text-button"
            href={`mailto:?bcc=${clients
              .filter((client) => client.status === "Active")
              .map((client) => client.email)
              .join(",")}`}
          >
            <Mail size={14} /> Email active clients
          </a>
        </footer>
      </div>
      <div className="client-bottom-grid">
        <article className="card simple-info-card">
          <div className="simple-info-icon">
            <UserRound size={21} />
          </div>
          <div>
            <h3>Client access, built in</h3>
            <p>
              Give clients secure access to only their own WordPress sites and
              services.
            </p>
          </div>
          <button className="text-button" onClick={onSettings}>
            Manage permissions <ArrowRight size={14} />
          </button>
        </article>
        <article className="card simple-info-card">
          <div className="simple-info-icon lavender">
            <Mail size={21} />
          </div>
          <div>
            <h3>Your brand, everywhere</h3>
            <p>
              White-label emails, invoices and client dashboards. No Oxxa
              branding.
            </p>
          </div>
          <button className="text-button" onClick={onSettings}>
            White-label settings <ArrowRight size={14} />
          </button>
        </article>
      </div>
    </div>
  );
}
