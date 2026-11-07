import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { revenueSeries } from "../data";
import type { Invoice } from "../types";
import { RevenueChart } from "../components/Charts";
import { Badge, PageHeading, statusTone } from "../components/UI";
import { wpBoot } from "../lib/wp";

interface BillingProps {
  invoices: Invoice[];
  onNewInvoice: () => void;
  notify: (title: string, message: string) => void;
}

export default function Billing({
  invoices,
  onNewInvoice,
  notify,
}: BillingProps) {
  const [period, setPeriod] = useState("6 months");
  function exportReport() {
    const csv = [
      "Invoice,Client,Period,Issue date,Amount EUR,Status",
      ...invoices.map((invoice) =>
        [
          invoice.id,
          invoice.client,
          invoice.period,
          invoice.date,
          invoice.amount.toFixed(2),
          invoice.status,
        ]
          .map((value) => `"${String(value).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "oxxa-studio-revenue-2026-11.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify(
      "Report exported",
      `${invoices.length} invoice records were downloaded as a CSV report.`,
    );
  }
  function downloadInvoice(invoice: Invoice) {
    const content = `NORTH & CO. STUDIO\nINVOICE ${invoice.id}\n\nClient: ${invoice.client}\nBilling period: ${invoice.period}\nIssue date: ${invoice.date}\nAmount: EUR ${invoice.amount.toFixed(2)}\nStatus: ${invoice.status}\n\nThank you for your business.`;
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${invoice.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Invoice downloaded", `${invoice.id} has been downloaded.`);
  }
  return (
    <div>
      <PageHeading
        title="Billing"
        description="Track recurring revenue, hosting costs and client invoices."
        actions={
          <>
            <button className="button button-secondary" onClick={exportReport}>
              <Download size={17} /> Export report
            </button>
            <button className="button button-primary" onClick={onNewInvoice}>
              <Plus size={18} /> New invoice
            </button>
          </>
        }
      />
      <section className="billing-stat-grid">
        <article className="card billing-stat featured">
          <div className="billing-stat-top">
            <span>Monthly recurring revenue</span>
            <span className="stat-icon stat-green">
              <TrendingUp size={18} />
            </span>
          </div>
          <strong>€12,840.00</strong>
          <footer>
            <span className="positive-change">
              <ArrowUpRight size={13} /> 12.8%
            </span>
            <span>vs. last month</span>
          </footer>
        </article>
        <article className="card billing-stat">
          <div className="billing-stat-top">
            <span>Expected this month</span>
            <span className="stat-icon stat-blue">
              <WalletCards size={18} />
            </span>
          </div>
          <strong>€14,280.00</strong>
          <footer>
            <span>42 of 48 invoices paid</span>
          </footer>
        </article>
        <article className="card billing-stat">
          <div className="billing-stat-top">
            <span>Oxxa reseller costs</span>
            <span className="stat-icon stat-purple">
              <ReceiptText size={18} />
            </span>
          </div>
          <strong>€3,842.50</strong>
          <footer>
            <span className="positive-change">
              <ArrowDownRight size={13} /> 2.1%
            </span>
            <span>lower than October</span>
          </footer>
        </article>
        <article className="card billing-stat">
          <div className="billing-stat-top">
            <span>Gross margin</span>
            <span className="stat-icon stat-orange">
              <CircleDollarSign size={18} />
            </span>
          </div>
          <strong>70.1%</strong>
          <footer>
            <span className="positive-change">
              <ArrowUpRight size={13} /> 1.4%
            </span>
            <span>healthy growth</span>
          </footer>
        </article>
      </section>
      <section className="billing-chart-grid">
        <article className="card revenue-card">
          <header className="card-header">
            <div>
              <h2>Revenue growth</h2>
              <p>Recurring services across all clients</p>
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
          <div className="revenue-legend">
            <span>
              <i className="legend-revenue" /> Revenue <strong>€12,840</strong>
            </span>
            <span>
              <i className="legend-cost" /> Oxxa costs <strong>€3,842</strong>
            </span>
          </div>
          <RevenueChart data={revenueSeries[period]} height={240} />
        </article>
        <article className="card payout-card">
          <header className="card-header">
            <div>
              <h2>Outstanding</h2>
              <p>Invoices awaiting payment</p>
            </div>
            <span className="outstanding-total">€1,827</span>
          </header>
          <div className="aging-chart">
            <div className="aging-donut">
              <div>
                <strong>6</strong>
                <span>invoices</span>
              </div>
            </div>
          </div>
          <div className="aging-legend">
            <div>
              <span>
                <i className="aging-current" />
                Not yet due
              </span>
              <strong>€1,138</strong>
            </div>
            <div>
              <span>
                <i className="aging-late" />
                1–30 days overdue
              </span>
              <strong>€689</strong>
            </div>
            <div>
              <span>
                <i className="aging-old" />
                30+ days overdue
              </span>
              <strong>€0</strong>
            </div>
          </div>
          <button
            className="button button-soft full-width"
            onClick={() =>
              notify(
                wpBoot
                  ? "Email provider not connected"
                  : "Demo reminders scheduled",
                wpBoot
                  ? "Connect WordPress transactional email before sending automatic payment reminders."
                  : "Sample payment reminders have been queued for overdue clients.",
              )
            }
          >
            Send payment reminders <ArrowRight size={15} />
          </button>
        </article>
      </section>
      <article className="card table-card invoices-card">
        <header className="card-header">
          <div>
            <h2>Recent invoices</h2>
            <p>November 2026 · All client billing</p>
          </div>
          <span className="muted-cell">{invoices.length} invoices</span>
        </header>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Billing period</th>
                <th>Issue date</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <div className="invoice-id">
                      <FileText size={15} />
                      <strong>{invoice.id}</strong>
                    </div>
                  </td>
                  <td>{invoice.client}</td>
                  <td className="muted-cell">{invoice.period}</td>
                  <td className="muted-cell">{invoice.date}</td>
                  <td>
                    <strong>€{invoice.amount.toFixed(2)}</strong>
                  </td>
                  <td>
                    <Badge tone={statusTone(invoice.status)} dot>
                      {invoice.status}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="tiny-button"
                      aria-label={`Download ${invoice.id}`}
                      onClick={() => downloadInvoice(invoice)}
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}
