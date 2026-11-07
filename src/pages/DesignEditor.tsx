import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Copy,
  Eye,
  Grid2X2,
  Image,
  Laptop,
  Layers3,
  LayoutTemplate,
  Minus,
  Monitor,
  MoreHorizontal,
  MousePointer2,
  Palette,
  Plus,
  Redo2,
  Search,
  Settings2,
  Smartphone,
  Sparkles,
  Tablet,
  Type,
  Undo2,
  X,
} from "lucide-react";
import type { StudioTemplate } from "../types";
import { Logo } from "../components/UI";
import { wpBoot, wpRequest } from "../lib/wp";

export default function DesignEditor({
  template,
  onExit,
  notify,
}: {
  template: StudioTemplate;
  onExit: () => void;
  notify: (title: string, message: string) => void;
}) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">(
    "desktop",
  );
  const [leftTab, setLeftTab] = useState("Pages");
  const [inspectorTab, setInspectorTab] = useState("Design");
  const [page, setPage] = useState("Homepage");
  const [pages, setPages] = useState([
    "Homepage",
    "About",
    "Selected work",
    "Contact",
  ]);
  const [selected, setSelected] = useState("Hero");
  const [heading, setHeading] = useState(
    template.style === "portfolio"
      ? "Space, light\n& purpose."
      : template.style === "restaurant"
        ? "Meet at noon."
        : "Objects with\na story.",
  );
  const [eyebrow, setEyebrow] = useState(
    `${template.category.toUpperCase()} · EST. 2018`,
  );
  const [accent, setAccent] = useState(template.accent);
  const [background, setBackground] = useState(template.color);
  const [font, setFont] = useState("Manrope");
  const [fontSize, setFontSize] = useState(64);
  const [radius, setRadius] = useState(2);
  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [addedSection, setAddedSection] = useState(false);
  const [zoom, setZoom] = useState(80);

  function addPage() {
    const name = `New page ${pages.length - 2}`;
    setPages([...pages, name]);
    setPage(name);
    notify("Page added", `${name} was added to this design.`);
  }

  async function publish() {
    setPublishing(true);
    try {
      if (wpBoot)
        await wpRequest("designs", {
          method: "POST",
          body: JSON.stringify({
            template: template.id,
            heading,
            eyebrow,
            accent,
            background,
            font,
            fontSize,
            radius,
          }),
        });
      setPublished(true);
      notify(
        "Design published",
        "Your shared styles and homepage content are now live for sites using this network template.",
      );
    } catch (error) {
      notify(
        "Design could not be published",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className={`design-editor ${preview ? "is-previewing" : ""}`}>
      <header className="editor-topbar">
        <div className="editor-topbar-left">
          <button className="editor-back" onClick={onExit}>
            <ArrowLeft size={18} />
          </button>
          <Logo compact />
          <span className="editor-divider" />
          <div className="editor-document-name">
            <strong>
              {template.name === "Editorial"
                ? "Atelier Morrow"
                : `${template.name} website`}
            </strong>
            <span>
              {page} <ChevronDown size={12} />
            </span>
          </div>
          <span className="save-status">
            <Check size={13} /> {published ? "Published" : "Saved"}
          </span>
        </div>
        <div className="editor-history">
          <button
            title="Undo"
            onClick={() =>
              notify(
                "Nothing to undo",
                "Your design is already at its earliest unsaved state.",
              )
            }
          >
            <Undo2 size={17} />
          </button>
          <button
            title="Redo"
            onClick={() =>
              notify(
                "Nothing to redo",
                "There are no reverted changes to restore.",
              )
            }
          >
            <Redo2 size={17} />
          </button>
        </div>
        <div className="editor-topbar-right">
          <div className="viewport-switch">
            <button
              className={device === "desktop" ? "active" : ""}
              onClick={() => setDevice("desktop")}
              title="Desktop"
            >
              <Monitor size={17} />
            </button>
            <button
              className={device === "tablet" ? "active" : ""}
              onClick={() => setDevice("tablet")}
              title="Tablet"
            >
              <Tablet size={17} />
            </button>
            <button
              className={device === "mobile" ? "active" : ""}
              onClick={() => setDevice("mobile")}
              title="Mobile"
            >
              <Smartphone size={17} />
            </button>
          </div>
          <button
            className={`button button-secondary editor-preview-button ${preview ? "active" : ""}`}
            onClick={() => setPreview(!preview)}
          >
            {preview ? <X size={16} /> : <Eye size={16} />}
            {preview ? "Exit preview" : "Preview"}
          </button>
          <button
            className="button button-primary"
            disabled={publishing}
            onClick={publish}
          >
            {publishing
              ? "Publishing…"
              : published
                ? "Update live site"
                : "Publish"}
            {!publishing && <ChevronDown size={14} />}
          </button>
          <button className="editor-more">
            <MoreHorizontal size={19} />
          </button>
        </div>
      </header>
      <div className="editor-workspace">
        {!preview && (
          <aside className="editor-left-panel">
            <div className="editor-panel-tabs">
              {["Pages", "Blocks", "Layers"].map((tab) => (
                <button
                  className={leftTab === tab ? "active" : ""}
                  onClick={() => setLeftTab(tab)}
                  key={tab}
                >
                  {tab}
                </button>
              ))}
            </div>
            {leftTab === "Pages" ? (
              <>
                <label className="editor-panel-search">
                  <Search size={14} />
                  <input placeholder="Find a page…" />
                </label>
                <div className="editor-section-title">
                  <span>PAGES</span>
                  <button onClick={addPage}>
                    <Plus size={15} />
                  </button>
                </div>
                <div className="editor-page-list">
                  {pages.map((item) => (
                    <button
                      className={page === item ? "active" : ""}
                      onClick={() => setPage(item)}
                      key={item}
                    >
                      <LayoutTemplate size={15} />
                      <span>{item}</span>
                      {item === "Homepage" && <small>Home</small>}
                      <MoreHorizontal size={14} />
                    </button>
                  ))}
                </div>
                <button className="editor-add-page" onClick={addPage}>
                  <Plus size={15} /> Add new page
                </button>
                <div className="editor-left-divider" />
                <div className="editor-section-title">
                  <span>TEMPLATE PARTS</span>
                </div>
                <button className="editor-template-part">
                  <Layers3 size={15} />
                  <span>Header</span>
                  <ChevronRight size={14} />
                </button>
                <button className="editor-template-part">
                  <Layers3 size={15} />
                  <span>Footer</span>
                  <ChevronRight size={14} />
                </button>
              </>
            ) : leftTab === "Blocks" ? (
              <>
                <label className="editor-panel-search">
                  <Search size={14} />
                  <input placeholder="Find a block…" />
                </label>
                <div className="editor-section-title">
                  <span>BASIC BLOCKS</span>
                </div>
                <div className="block-grid">
                  {[
                    { icon: Type, label: "Text" },
                    { icon: Image, label: "Image" },
                    { icon: Grid2X2, label: "Columns" },
                    { icon: MousePointer2, label: "Button" },
                    { icon: LayoutTemplate, label: "Section" },
                    { icon: Sparkles, label: "Hero" },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      onClick={() => {
                        setAddedSection(true);
                        notify(
                          `${label} block added`,
                          `A new ${label.toLowerCase()} block was added below the hero.`,
                        );
                      }}
                    >
                      <Icon size={20} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <div className="editor-section-title">
                  <span>STUDIO SECTIONS</span>
                </div>
                <div className="studio-block-thumbs">
                  <button onClick={() => setAddedSection(true)}>
                    <span />
                    <span />
                    <span />
                  </button>
                  <button onClick={() => setAddedSection(true)}>
                    <span />
                    <span />
                    <span />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="editor-section-title">
                  <span>PAGE STRUCTURE</span>
                </div>
                <div className="layer-tree">
                  <button>
                    <ChevronDown size={13} />
                    <Layers3 size={14} />
                    Header
                  </button>
                  <button className="active">
                    <ChevronDown size={13} />
                    <Layers3 size={14} />
                    Hero
                  </button>
                  <button className="nested">
                    <Type size={14} />
                    Heading
                  </button>
                  <button className="nested">
                    <Image size={14} />
                    Visual
                  </button>
                  {addedSection && (
                    <button>
                      <ChevronDown size={13} />
                      <Layers3 size={14} />
                      New section
                    </button>
                  )}
                  <button>
                    <ChevronDown size={13} />
                    <Layers3 size={14} />
                    Footer
                  </button>
                </div>
              </>
            )}
            <div className="editor-help">
              <CircleHelp size={16} />
              <span>Need help designing?</span>
              <ChevronRight size={14} />
            </div>
          </aside>
        )}
        <main className="editor-canvas-wrap">
          <div className="canvas-breadcrumb">
            <span>{page}</span>
            <ChevronRight size={12} />
            <strong>{selected}</strong>
          </div>
          <div
            className={`editor-canvas editor-canvas-${device}`}
            style={{ "--editor-zoom": zoom / 100 } as React.CSSProperties}
          >
            <div
              className="editable-website"
              style={
                {
                  background,
                  "--editable-accent": accent,
                  fontFamily: font,
                } as React.CSSProperties
              }
            >
              <nav
                className={selected === "Header" ? "selected-block" : ""}
                onClick={() => setSelected("Header")}
              >
                <b>
                  {template.name}
                  <i>.</i>
                </b>
                <div>
                  <span>Work</span>
                  <span>About</span>
                  <span>Journal</span>
                </div>
                <button style={{ borderRadius: radius }}>
                  Let’s talk <ArrowLeft size={10} />
                </button>
              </nav>
              <section
                className={`editable-hero ${selected === "Hero" ? "selected-block" : ""}`}
                onClick={() => setSelected("Hero")}
              >
                <div className="editable-copy">
                  <small>{eyebrow}</small>
                  <h1 style={{ fontSize: `${fontSize}px`, fontFamily: font }}>
                    {heading}
                  </h1>
                  <p>
                    Thoughtful ideas and meaningful experiences,
                    <br />
                    created with care and a sense of purpose.
                  </p>
                  <button style={{ background: accent, borderRadius: radius }}>
                    Explore our work <span>↗</span>
                  </button>
                </div>
                <div className="editable-visual">
                  <div
                    className="editable-visual-shape one"
                    style={{ background: accent }}
                  />
                  <div className="editable-visual-shape two" />
                  <span>{template.name.charAt(0)}</span>
                  <small>SELECTED / 2026</small>
                </div>
                {selected === "Hero" && !preview && (
                  <>
                    <i className="block-handle top-left" />
                    <i className="block-handle top-right" />
                    <i className="block-handle bottom-left" />
                    <i className="block-handle bottom-right" />
                    <span className="block-label">
                      Hero <Settings2 size={11} />
                    </span>
                  </>
                )}
              </section>
              {addedSection && (
                <section
                  className="editable-new-section selected-block"
                  onClick={() => setSelected("New section")}
                >
                  <small>OUR APPROACH</small>
                  <h2>
                    Made with intention.
                    <br />
                    Built to endure.
                  </h2>
                  <div>
                    <span />
                    <span />
                    <span />
                  </div>
                </section>
              )}
              <footer>
                <span>SELECTED WORK · 2026</span>
                <div>
                  <i />
                  <i />
                  <i />
                </div>
              </footer>
            </div>
          </div>
          <div className="canvas-bottom-bar">
            <div>
              <MousePointer2 size={14} />
              <span>Select</span>
            </div>
            <span className="canvas-size">
              {device === "desktop"
                ? "1440 × 900"
                : device === "tablet"
                  ? "768 × 1024"
                  : "390 × 844"}
            </span>
            <div className="zoom-controls">
              <button onClick={() => setZoom(Math.max(40, zoom - 10))}>
                <Minus size={14} />
              </button>
              <button onClick={() => setZoom(80)}>{zoom}%</button>
              <button onClick={() => setZoom(Math.min(110, zoom + 10))}>
                <Plus size={14} />
              </button>
            </div>
          </div>
        </main>
        {!preview && (
          <aside className="editor-right-panel">
            <div className="editor-panel-tabs">
              {["Design", "Settings"].map((tab) => (
                <button
                  className={inspectorTab === tab ? "active" : ""}
                  onClick={() => setInspectorTab(tab)}
                  key={tab}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="inspector-selected">
              <span>
                <Layers3 size={15} />
              </span>
              <div>
                <strong>{selected}</strong>
                <small>Section</small>
              </div>
              <button>
                <MoreHorizontal size={15} />
              </button>
            </div>
            {inspectorTab === "Design" ? (
              <div className="inspector-content">
                <section className="inspector-section">
                  <header>
                    <span>CONTENT</span>
                    <ChevronDown size={13} />
                  </header>
                  <label>
                    Eyebrow
                    <input
                      value={eyebrow}
                      onChange={(event) => setEyebrow(event.target.value)}
                    />
                  </label>
                  <label>
                    Heading
                    <textarea
                      value={heading}
                      onChange={(event) => setHeading(event.target.value)}
                      rows={3}
                    />
                  </label>
                </section>
                <section className="inspector-section">
                  <header>
                    <span>TYPOGRAPHY</span>
                    <ChevronDown size={13} />
                  </header>
                  <label>
                    Typeface
                    <select
                      value={font}
                      onChange={(event) => setFont(event.target.value)}
                    >
                      <option>Manrope</option>
                      <option>Georgia</option>
                      <option>Arial</option>
                      <option>Courier New</option>
                    </select>
                  </label>
                  <div className="inspector-inline">
                    <label>
                      Size
                      <div className="unit-input">
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(event) =>
                            setFontSize(Number(event.target.value))
                          }
                        />
                        <span>px</span>
                      </div>
                    </label>
                    <label>
                      Weight
                      <select>
                        <option>Regular</option>
                        <option>Medium</option>
                        <option>Bold</option>
                      </select>
                    </label>
                  </div>
                </section>
                <section className="inspector-section">
                  <header>
                    <span>COLORS</span>
                    <ChevronDown size={13} />
                  </header>
                  <label>
                    Accent color
                    <div className="color-input">
                      <i style={{ background: accent }} />
                      <input
                        value={accent.toUpperCase()}
                        onChange={(event) => setAccent(event.target.value)}
                      />
                    </div>
                  </label>
                  <div className="color-swatches">
                    {[
                      template.accent,
                      "#17211b",
                      "#a45c3f",
                      "#62744d",
                      "#3c707b",
                      "#715c8b",
                    ].map((color, index) => (
                      <button
                        className={accent === color ? "active" : ""}
                        style={{ background: color }}
                        onClick={() => setAccent(color)}
                        key={`${color}-${index}`}
                      >
                        {accent === color && <Check size={12} />}
                      </button>
                    ))}
                    <button className="add-color">
                      <Plus size={13} />
                    </button>
                  </div>
                  <label>
                    Background
                    <div className="color-input">
                      <i style={{ background }} />
                      <input
                        value={background.toUpperCase()}
                        onChange={(event) => setBackground(event.target.value)}
                      />
                    </div>
                  </label>
                </section>
                <section className="inspector-section">
                  <header>
                    <span>LAYOUT</span>
                    <ChevronDown size={13} />
                  </header>
                  <label>
                    Button radius
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={radius}
                      onChange={(event) =>
                        setRadius(Number(event.target.value))
                      }
                    />
                    <span className="range-value">{radius}px</span>
                  </label>
                  <label>
                    Content width
                    <select>
                      <option>Contained · 1280px</option>
                      <option>Full width</option>
                      <option>Narrow · 960px</option>
                    </select>
                  </label>
                </section>
              </div>
            ) : (
              <div className="inspector-content">
                <section className="inspector-section">
                  <header>
                    <span>PAGE SETTINGS</span>
                    <ChevronDown size={13} />
                  </header>
                  <label>
                    Page title
                    <input value={`${page} — ${template.name}`} readOnly />
                  </label>
                  <label>
                    Page slug
                    <input
                      value={page.toLowerCase().replaceAll(" ", "-")}
                      readOnly
                    />
                  </label>
                </section>
                <section className="inspector-section">
                  <header>
                    <span>VISIBILITY</span>
                    <ChevronDown size={13} />
                  </header>
                  <label>
                    Who can see this page?
                    <select>
                      <option>Everyone</option>
                      <option>Network administrators</option>
                      <option>Logged-in users</option>
                    </select>
                  </label>
                </section>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
