import {
  ArrowRight,
  Clock3,
  Copy,
  Layers3,
  MoreHorizontal,
  Palette,
  PenTool,
  Plus,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { templates } from "../data";
import type { Site, StudioTemplate } from "../types";
import {
  Badge,
  PageHeading,
  SitePreview,
  TemplatePreview,
} from "../components/UI";

export default function Studio({
  sites,
  onOpenEditor,
  onUseTemplate,
  notify,
}: {
  sites: Site[];
  onOpenEditor: (template: StudioTemplate) => void;
  onUseTemplate: (template: StudioTemplate) => void;
  notify: (title: string, message: string) => void;
}) {
  return (
    <div>
      <PageHeading
        title="Design studio"
        description="Design, refine and launch beautiful websites — all inside your network."
        actions={
          <button
            className="button button-primary"
            onClick={() => onOpenEditor(templates[0])}
          >
            <Plus size={18} /> New design
          </button>
        }
      />
      <section className="studio-featured">
        <div className="studio-featured-copy">
          <Badge tone="green">CONTINUE DESIGNING</Badge>
          <h2>Atelier Morrow</h2>
          <p>
            A quiet digital home for thoughtful objects and the people who make
            them.
          </p>
          <div className="studio-featured-meta">
            <span>
              <Clock3 size={14} /> Edited 12 minutes ago
            </span>
            <span>
              <UsersRound size={14} /> 3 collaborators
            </span>
          </div>
          <button
            className="button button-primary"
            onClick={() => onOpenEditor(templates[0])}
          >
            Open in editor <ArrowRight size={16} />
          </button>
        </div>
        <div
          className="studio-featured-preview"
          onClick={() => onOpenEditor(templates[0])}
        >
          <TemplatePreview template={templates[0]} large />
          <span className="preview-open-pill">
            <PenTool size={14} /> Click to continue editing
          </span>
        </div>
        <div className="studio-featured-art">
          <Sparkles size={18} />
        </div>
      </section>
      <section className="studio-section">
        <header className="section-heading">
          <div>
            <h2>Recent designs</h2>
            <p>Pick up where your team left off</p>
          </div>
          <button
            className="text-button"
            onClick={() =>
              notify(
                "Recent projects",
                "Your latest network designs are shown here. Use the template library to browse every starting point.",
              )
            }
          >
            View all projects <ArrowRight size={15} />
          </button>
        </header>
        <div className="studio-project-grid">
          {templates.slice(1, 4).map((template, index) => (
            <article
              className="studio-project card"
              key={template.id}
              onClick={() => onOpenEditor(template)}
            >
              <div className="studio-project-preview">
                <TemplatePreview template={template} />
                <button
                  className="tiny-button studio-project-menu"
                  onClick={(event) => {
                    event.stopPropagation();
                    notify(
                      "Project actions",
                      "Duplicate, rename and export actions are available in the live WordPress plugin.",
                    );
                  }}
                >
                  <MoreHorizontal size={17} />
                </button>
              </div>
              <div className="studio-project-info">
                <div>
                  <h3>{sites[index + 1]?.name || template.name}</h3>
                  <p>
                    Edited {["2 hours ago", "yesterday", "2 days ago"][index]}
                  </p>
                </div>
                <Badge tone={index === 2 ? "orange" : "green"} dot>
                  {index === 2 ? "Draft" : "Published"}
                </Badge>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="studio-tools-grid">
        <article className="card brand-kit-card">
          <header>
            <div className="simple-info-icon lavender">
              <Palette size={20} />
            </div>
            <div>
              <h3>Studio brand kit</h3>
              <p>Consistent styles, everywhere.</p>
            </div>
            <button
              className="text-button"
              onClick={() => onOpenEditor(templates[0])}
            >
              Edit kit <ArrowRight size={14} />
            </button>
          </header>
          <div className="brand-kit-content">
            <div className="brand-colors">
              <span style={{ background: "#17211b" }} />
              <span style={{ background: "#c6ef85" }} />
              <span style={{ background: "#e9e3d8" }} />
              <span style={{ background: "#a45c3f" }} />
              <button
                onClick={() =>
                  notify(
                    "Brand colors",
                    "Your shared network color palette has 4 colors.",
                  )
                }
              >
                <Plus size={15} />
              </button>
            </div>
            <div className="brand-type">
              <strong>Manrope</strong>
              <span>Primary typeface · 6 styles</span>
            </div>
          </div>
        </article>
        <article className="card studio-tool">
          <span className="studio-tool-icon">
            <Layers3 size={22} />
          </span>
          <div>
            <h3>Reusable blocks</h3>
            <p>24 shared sections ready for your next build.</p>
            <button
              className="text-button"
              onClick={() => onOpenEditor(templates[1])}
            >
              Browse block library <ArrowRight size={14} />
            </button>
          </div>
        </article>
        <article className="card studio-tool">
          <span className="studio-tool-icon orange">
            <Copy size={22} />
          </span>
          <div>
            <h3>Start from a template</h3>
            <p>Provision a polished client site in a few clicks.</p>
            <button
              className="text-button"
              onClick={() => onUseTemplate(templates[2])}
            >
              Explore templates <ArrowRight size={14} />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
