import { useMemo, useState } from "react";
import { ArrowRight, Check, Eye, Plus, Search, Sparkles } from "lucide-react";
import { templates } from "../data";
import type { StudioTemplate } from "../types";
import { Modal, PageHeading, TemplatePreview } from "../components/UI";

export default function Templates({
  onUseTemplate,
  onOpenEditor,
}: {
  onUseTemplate: (template: StudioTemplate) => void;
  onOpenEditor: (template: StudioTemplate) => void;
}) {
  const [category, setCategory] = useState("All templates");
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<StudioTemplate | null>(null);
  const categories = [
    "All templates",
    "Portfolio",
    "Architecture",
    "Hospitality",
    "E-commerce",
    "Creative studio",
    "SaaS",
  ];
  const filtered = useMemo(
    () =>
      templates.filter(
        (template) =>
          (category === "All templates" || template.category === category) &&
          `${template.name} ${template.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [category, query],
  );
  return (
    <div>
      <PageHeading
        title="Template library"
        description="Thoughtfully crafted starting points for your next client website."
        actions={
          <button
            className="button button-primary"
            onClick={() => onOpenEditor(templates[0])}
          >
            <Plus size={18} /> Create from scratch
          </button>
        }
      />
      <div className="template-library-banner">
        <div className="template-banner-icon">
          <Sparkles size={24} />
        </div>
        <div>
          <strong>One network. Every template.</strong>
          <p>
            Templates are shared across your multisite network and ready to
            provision in minutes.
          </p>
        </div>
        <span>
          6 templates <i /> 71 active sites
        </span>
      </div>
      <div className="template-controls">
        <div className="filter-tabs template-filter-tabs">
          {categories.map((item) => (
            <button
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="inline-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search templates…"
          />
        </label>
      </div>
      <section className="template-grid">
        {filtered.map((template) => (
          <article className="template-card" key={template.id}>
            <div
              className="template-card-preview"
              onClick={() => setPreview(template)}
            >
              <TemplatePreview template={template} />
              <div className="template-preview-hover">
                <button
                  className="button button-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPreview(template);
                  }}
                >
                  <Eye size={16} /> Preview template
                </button>
              </div>
              <span className="template-category-pill">
                {template.category}
              </span>
            </div>
            <div className="template-card-info">
              <div>
                <h3>{template.name}</h3>
                <p>{template.description}</p>
                <span>Used on {template.sites} websites</span>
              </div>
              <button
                className="template-use-button"
                onClick={() => onUseTemplate(template)}
              >
                Use template <ArrowRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </section>
      {filtered.length === 0 && (
        <div className="small-empty card">No templates match your search.</div>
      )}
      {preview && (
        <Modal
          title={preview.name}
          subtitle={`${preview.category} · Network template`}
          onClose={() => setPreview(null)}
          size="xl"
        >
          <div className="template-modal-preview">
            <TemplatePreview template={preview} large />
          </div>
          <div className="template-modal-footer">
            <div>
              <span>
                <Check size={14} /> Responsive blocks
              </span>
              <span>
                <Check size={14} /> Global styles
              </span>
              <span>
                <Check size={14} /> Multisite ready
              </span>
            </div>
            <button
              className="button button-primary"
              onClick={() => {
                onUseTemplate(preview);
                setPreview(null);
              }}
            >
              Use this template <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
