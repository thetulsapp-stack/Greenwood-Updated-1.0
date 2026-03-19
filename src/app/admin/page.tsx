"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageRenderer from "@/components/visual/PageRenderer";
import { hasAdminAccess } from "@/lib/admin";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import {
  DEFAULT_SITE_SETTINGS,
  createPage,
  createSection,
  sanitizeSettings,
  slugify,
  type FooterLinkGroup,
  type NavLink,
  type SiteSettings,
  type VisualSection,
  type VisualSectionType,
} from "@/lib/siteSettings";
import { cssThemeVars } from "@/lib/colors";

type EditorTab = "pages" | "header" | "footer" | "theme" | "site";
const uid = () => Math.random().toString(36).slice(2, 10);

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
      <span className="font-medium text-[var(--text)]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-[var(--border)] px-3 py-2" />
    </label>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="rounded-xl border border-[var(--border)] px-3 py-2" />
    </label>
  );
}

function SectionTypePicker({ onAdd }: { onAdd: (type: VisualSectionType) => void }) {
  const types: VisualSectionType[] = ["hero", "text", "cards", "media", "cta", "spacer"];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {types.map((type) => (
        <button key={type} type="button" onClick={() => onAdd(type)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium capitalize text-[var(--text)]">
          Add {type}
        </button>
      ))}
    </div>
  );
}

function LinkListEditor({ links, onChange }: { links: NavLink[]; onChange: (links: NavLink[]) => void }) {
  const update = (id: string, patch: Partial<NavLink>) => onChange(links.map((link) => (link.id === id ? { ...link, ...patch } : link)));
  const remove = (id: string) => onChange(links.filter((link) => link.id !== id));
  const move = (id: string, direction: -1 | 1) => {
    const index = links.findIndex((link) => link.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= links.length) return;
    const next = [...links];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {links.map((link) => (
        <div key={link.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Label" value={link.label} onChange={(value) => update(link.id, { label: value })} />
            <TextField label="Href" value={link.href} onChange={(value) => update(link.id, { href: value })} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => move(link.id, -1)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Up</button>
            <button type="button" onClick={() => move(link.id, 1)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Down</button>
            <button type="button" onClick={() => update(link.id, { visible: !link.visible })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{link.visible ? "Hide" : "Show"}</button>
            <button type="button" onClick={() => update(link.id, { isButton: !link.isButton })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{link.isButton ? "Text style" : "Button style"}</button>
            <button type="button" onClick={() => remove(link.id)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...links, { id: uid(), label: `Link ${links.length + 1}`, href: "/", visible: true }])} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm font-medium text-[var(--primary)]">
        Add link
      </button>
    </div>
  );
}

function FooterGroupsEditor({ groups, onChange }: { groups: FooterLinkGroup[]; onChange: (groups: FooterLinkGroup[]) => void }) {
  const updateGroup = (id: string, patch: Partial<FooterLinkGroup>) => onChange(groups.map((group) => (group.id === id ? { ...group, ...patch } : group)));
  const removeGroup = (id: string) => onChange(groups.filter((group) => group.id !== id));
  const moveGroup = (id: string, direction: -1 | 1) => {
    const index = groups.findIndex((group) => group.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= groups.length) return;
    const next = [...groups];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <TextField label="Group title" value={group.title} onChange={(value) => updateGroup(group.id, { title: value })} />
            </div>
            <button type="button" onClick={() => moveGroup(group.id, -1)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Up</button>
            <button type="button" onClick={() => moveGroup(group.id, 1)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Down</button>
            <button type="button" onClick={() => updateGroup(group.id, { visible: !group.visible })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{group.visible ? "Hide" : "Show"}</button>
            <button type="button" onClick={() => removeGroup(group.id)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">Remove</button>
          </div>
          <LinkListEditor links={group.links} onChange={(links) => updateGroup(group.id, { links })} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...groups, { id: uid(), title: `Group ${groups.length + 1}`, visible: true, links: [] }])} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-alt)] px-4 py-3 text-sm font-medium text-[var(--primary)]">
        Add footer group
      </button>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span>{label}</span>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-14 rounded-xl border border-[var(--border)]" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-[var(--border)] px-3 py-2" />
      </div>
    </label>
  );
}

function StyleEditor({ section, onChange }: { section: VisualSection; onChange: (section: VisualSection) => void }) {
  const patch = (key: string, value: string) => onChange({ ...section, style: { ...section.style, [key]: value } } as VisualSection);
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ColorField label="Background" value={section.style.background} onChange={(v) => patch("background", v)} />
      <ColorField label="Text" value={section.style.text} onChange={(v) => patch("text", v)} />
      <ColorField label="Muted text" value={section.style.muted} onChange={(v) => patch("muted", v)} />
      <ColorField label="Border" value={section.style.border} onChange={(v) => patch("border", v)} />
      <ColorField label="Button background" value={section.style.buttonBackground} onChange={(v) => patch("buttonBackground", v)} />
      <ColorField label="Button text" value={section.style.buttonText} onChange={(v) => patch("buttonText", v)} />
      <ColorField label="Card background" value={section.style.cardBackground} onChange={(v) => patch("cardBackground", v)} />
      <ColorField label="Card text" value={section.style.cardText} onChange={(v) => patch("cardText", v)} />
    </div>
  );
}

function SectionEditor({ section, onChange }: { section: VisualSection; onChange: (section: VisualSection) => void }) {
  const styleBlock = <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-white p-4"><p className="text-sm font-semibold text-[var(--text)]">Section colors</p><StyleEditor section={section} onChange={onChange} /></div>;
  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <TextField label="Section label" value={section.name} onChange={(value) => onChange({ ...section, name: value })} />
          <TextField label="Eyebrow" value={section.eyebrow} onChange={(value) => onChange({ ...section, eyebrow: value })} />
          <TextAreaField label="Headline" value={section.title} onChange={(value) => onChange({ ...section, title: value })} rows={3} />
          <TextAreaField label="Body" value={section.text} onChange={(value) => onChange({ ...section, text: value })} rows={4} />
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Primary label" value={section.primaryLabel} onChange={(value) => onChange({ ...section, primaryLabel: value })} />
            <TextField label="Primary href" value={section.primaryHref} onChange={(value) => onChange({ ...section, primaryHref: value })} />
            <TextField label="Secondary label" value={section.secondaryLabel} onChange={(value) => onChange({ ...section, secondaryLabel: value })} />
            <TextField label="Secondary href" value={section.secondaryHref} onChange={(value) => onChange({ ...section, secondaryHref: value })} />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm">
              <span>Media type</span>
              <select value={section.mediaType} onChange={(e) => onChange({ ...section, mediaType: e.target.value as "image" | "video" })} className="rounded-xl border border-[var(--border)] px-3 py-2"><option value="image">Image</option><option value="video">Video</option></select>
            </label>
            <TextField label="Media alt" value={section.mediaAlt} onChange={(value) => onChange({ ...section, mediaAlt: value })} />
          </div>
          <TextField label="Media URL" value={section.mediaUrl} onChange={(value) => onChange({ ...section, mediaUrl: value })} />
          {styleBlock}
        </div>
      );
    case "text":
      return (
        <div className="space-y-3">
          <TextField label="Section label" value={section.name} onChange={(value) => onChange({ ...section, name: value })} />
          <TextField label="Title" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
          <TextAreaField label="Body" value={section.body} onChange={(value) => onChange({ ...section, body: value })} rows={5} />
          <label className="grid gap-1 text-sm"><span>Alignment</span><select value={section.align} onChange={(e) => onChange({ ...section, align: e.target.value as "left" | "center" })} className="rounded-xl border border-[var(--border)] px-3 py-2"><option value="left">Left</option><option value="center">Center</option></select></label>
          {styleBlock}
        </div>
      );
    case "cards":
      return (
        <div className="space-y-3">
          <TextField label="Section label" value={section.name} onChange={(value) => onChange({ ...section, name: value })} />
          <TextField label="Title" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
          <TextAreaField label="Body" value={section.body} onChange={(value) => onChange({ ...section, body: value })} rows={4} />
          {section.cards.map((card, index) => (
            <div key={card.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <TextField label={`Card ${index + 1} title`} value={card.title} onChange={(value) => onChange({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, title: value } : item) })} />
                <TextField label="Card text" value={card.text} onChange={(value) => onChange({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, text: value } : item) })} />
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => onChange({ ...section, cards: section.cards.map((item) => item.id === card.id ? { ...item, visible: !item.visible } : item) })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{card.visible ? "Hide card" : "Show card"}</button>
                <button type="button" onClick={() => onChange({ ...section, cards: section.cards.filter((item) => item.id !== card.id) })} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">Remove card</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange({ ...section, cards: [...section.cards, { id: uid(), title: `Card ${section.cards.length + 1}`, text: "New card text", visible: true }] })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Add card</button>
          {styleBlock}
        </div>
      );
    case "media":
      return (
        <div className="space-y-3">
          <TextField label="Section label" value={section.name} onChange={(value) => onChange({ ...section, name: value })} />
          <TextField label="Title" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
          <TextAreaField label="Caption" value={section.caption} onChange={(value) => onChange({ ...section, caption: value })} rows={4} />
          <label className="grid gap-1 text-sm"><span>Media type</span><select value={section.mediaType} onChange={(e) => onChange({ ...section, mediaType: e.target.value as "image" | "video" })} className="rounded-xl border border-[var(--border)] px-3 py-2"><option value="image">Image</option><option value="video">Video</option></select></label>
          <TextField label="Media URL" value={section.mediaUrl} onChange={(value) => onChange({ ...section, mediaUrl: value })} />
          {styleBlock}
        </div>
      );
    case "cta":
      return (
        <div className="space-y-3">
          <TextField label="Section label" value={section.name} onChange={(value) => onChange({ ...section, name: value })} />
          <TextField label="Title" value={section.title} onChange={(value) => onChange({ ...section, title: value })} />
          <TextAreaField label="Body" value={section.body} onChange={(value) => onChange({ ...section, body: value })} rows={4} />
          <label className="grid gap-1 text-sm"><span>Mode</span><select value={section.mode} onChange={(e) => onChange({ ...section, mode: e.target.value as "button" | "subscribe" })} className="rounded-xl border border-[var(--border)] px-3 py-2"><option value="subscribe">Subscribe form</option><option value="button">Button only</option></select></label>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label={section.mode === "subscribe" ? "Submit button label" : "Button label"} value={section.buttonLabel} onChange={(value) => onChange({ ...section, buttonLabel: value })} />
            <TextField label="Button href" value={section.buttonHref} onChange={(value) => onChange({ ...section, buttonHref: value })} />
          </div>
          {section.mode === "subscribe" ? <>
            <TextField label="Name placeholder" value={section.namePlaceholder} onChange={(value) => onChange({ ...section, namePlaceholder: value })} />
            <TextField label="Email placeholder" value={section.emailPlaceholder} onChange={(value) => onChange({ ...section, emailPlaceholder: value })} />
            <TextField label="Success message" value={section.successMessage} onChange={(value) => onChange({ ...section, successMessage: value })} />
          </> : null}
          {styleBlock}
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-3">
          <TextField label="Section label" value={section.name} onChange={(value) => onChange({ ...section, name: value })} />
          <label className="grid gap-1 text-sm"><span>Height</span><select value={section.height} onChange={(e) => onChange({ ...section, height: e.target.value as "sm" | "md" | "lg" })} className="rounded-xl border border-[var(--border)] px-3 py-2"><option value="sm">Small</option><option value="md">Medium</option><option value="lg">Large</option></select></label>
        </div>
      );
  }
}


export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const canAccess = hasAdminAccess(user?.email);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("pages");
  const [activePageId, setActivePageId] = useState<string>(DEFAULT_SITE_SETTINGS.pages[0]?.id || "");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(DEFAULT_SITE_SETTINGS.pages[0]?.sections[0]?.id || null);

  useEffect(() => {
    if (!db) return;

    getDoc(doc(db, "siteSettings", "public"))
      .then((snap) => {
        const next = snap.exists() ? sanitizeSettings(snap.data() as Partial<SiteSettings>) : DEFAULT_SITE_SETTINGS;
        setSettings(next);
        setActivePageId(next.pages[0]?.id || "");
        setActiveSectionId(next.pages[0]?.sections[0]?.id || null);
      })
      .catch(() => setSettings(DEFAULT_SITE_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

  const activePage = useMemo(() => settings.pages.find((page) => page.id === activePageId) || settings.pages[0] || null, [settings.pages, activePageId]);
  const activeSection = useMemo(() => activePage?.sections.find((section) => section.id === activeSectionId) || activePage?.sections[0] || null, [activePage, activeSectionId]);

  useEffect(() => {
    if (!settings.pages.length) return;
    const pageExists = settings.pages.some((page) => page.id === activePageId);
    if (!pageExists) {
      setActivePageId(settings.pages[0].id);
      setActiveSectionId(settings.pages[0].sections[0]?.id || null);
      return;
    }
    const current = settings.pages.find((page) => page.id === activePageId);
    const sectionExists = !!current?.sections.some((section) => section.id === activeSectionId);
    if (!sectionExists) {
      setActiveSectionId(current?.sections[0]?.id || null);
    }
  }, [settings.pages, activePageId, activeSectionId]);

  const updatePage = (pageId: string, patch: Partial<SiteSettings["pages"][number]>) => {
    setSettings((prev) => ({ ...prev, pages: prev.pages.map((page) => (page.id === pageId ? { ...page, ...patch } : page)) }));
  };

  const updateSection = (section: VisualSection) => {
    if (!activePage) return;
    updatePage(activePage.id, { sections: activePage.sections.map((item) => (item.id === section.id ? section : item)) });
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    if (!activePage) return;
    const index = activePage.sections.findIndex((section) => section.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= activePage.sections.length) return;
    const next = [...activePage.sections];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    updatePage(activePage.id, { sections: next });
  };

  const duplicateSection = (sectionId: string) => {
    if (!activePage) return;
    const section = activePage.sections.find((item) => item.id === sectionId);
    if (!section) return;
    const copy = { ...section, id: uid(), name: `${section.name} Copy` } as VisualSection;
    const index = activePage.sections.findIndex((s) => s.id === sectionId);
    const next = [...activePage.sections];
    next.splice(index + 1, 0, copy);
    updatePage(activePage.id, { sections: next });
    setActiveSectionId(copy.id);
  };

  const removeSection = (sectionId: string) => {
    if (!activePage) return;
    if (activePage.sections.length <= 1) {
      setError("Each page must keep at least one section.");
      return;
    }
    const next = activePage.sections.filter((item) => item.id !== sectionId);
    updatePage(activePage.id, { sections: next });
    if (activeSectionId === sectionId) setActiveSectionId(next[0]?.id || null);
  };

  const addPageAndEdit = () => {
    const page = createPage(`New Page ${settings.pages.length + 1}`, `/page-${settings.pages.length + 1}`);
    setSettings((prev) => ({ ...prev, pages: [...prev.pages, page] }));
    setActivePageId(page.id);
    setActiveSectionId(page.sections[0]?.id || null);
    setActiveTab("pages");
  };

  const removePage = (pageId: string) => {
    if (settings.pages.length <= 1) {
      setError("You must keep at least one page.");
      return;
    }
    const nextPages = settings.pages.filter((page) => page.id !== pageId);
    setSettings((prev) => ({
      ...prev,
      pages: nextPages,
      header: {
        ...prev.header,
        links: prev.header.links.filter((link) => link.href !== settings.pages.find((page) => page.id === pageId)?.slug),
      },
      footer: {
        ...prev.footer,
        groups: prev.footer.groups.map((group) => ({
          ...group,
          links: group.links.filter((link) => link.href !== settings.pages.find((page) => page.id === pageId)?.slug),
        })),
      },
    }));
    const fallback = nextPages[0];
    setActivePageId(fallback?.id || "");
    setActiveSectionId(fallback?.sections[0]?.id || null);
  };

  const saveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setMessage(null);
      if (!db) throw new Error("Firebase is not configured.");
      await setDoc(doc(db, "siteSettings", "public"), sanitizeSettings(settings), { merge: true });
      setMessage("Saved successfully.");
    } catch (e: any) {
      setError(e?.message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={cssThemeVars(settings.theme)}>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--primary)]">Greenwood visual editor</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Edit header, footer, pages, sections, colors, links, and visibility from one admin panel.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)]">View site</Link>
            <button type="button" onClick={saveAll} disabled={saving || !canAccess} className="rounded-full bg-[var(--primary)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? "Saving..." : "Save all changes"}
            </button>
          </div>
        </div>

        {authLoading ? <div className="rounded-[28px] border border-[var(--border)] bg-white p-8">Loading admin access…</div> : null}
        {!authLoading && !user ? (
          <div className="rounded-[28px] border border-[var(--border)] bg-white p-8">
            <p className="text-[var(--text)]">Please log in to access the editor.</p>
            <Link href="/admin/login" className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">Go to admin login</Link>
          </div>
        ) : null}
        {!authLoading && user && !canAccess ? <div className="rounded-[28px] border border-[var(--border)] bg-white p-8">This admin panel is restricted to approved admin emails. Add your email to <code>NEXT_PUBLIC_ADMIN_EMAILS</code>.</div> : null}
        {message ? <div className="mb-4 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">{message}</div> : null}
        {error ? <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-700">{error}</div> : null}

        {canAccess && !loading ? (
          <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)_430px]">
            <aside className="space-y-3 rounded-[28px] border border-[var(--border)] bg-[rgba(255,253,252,0.9)] p-4 shadow-[var(--shadow-soft)]">
              {(["pages", "header", "footer", "theme", "site"] as EditorTab[]).map((tab) => (
                <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium capitalize ${activeTab === tab ? "bg-[var(--primary)] text-white" : "border border-[var(--border)] bg-white text-[var(--text)]"}`}>
                  {tab}
                </button>
              ))}
            </aside>

            <section className="space-y-6">
              <div className="rounded-[28px] border border-[var(--border)] bg-[rgba(255,253,252,0.9)] p-4 shadow-[var(--shadow-soft)]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-[var(--primary)]">Live preview</h2>
                  <label className="grid min-w-[260px] gap-1 text-sm">
                    <span className="text-[var(--muted)]">Preview page</span>
                    <select value={activePage?.id || ""} onChange={(e) => { const page = settings.pages.find((item) => item.id === e.target.value); setActivePageId(e.target.value); setActiveSectionId(page?.sections[0]?.id || null); }} className="rounded-xl border border-[var(--border)] px-3 py-2">
                      {settings.pages.map((page) => (
                        <option key={page.id} value={page.id}>{page.name} ({page.slug})</option>
                      ))}
                    </select>
                  </label>
                </div>
                {activePage ? <PageRenderer settings={settings} page={activePage} /> : null}
              </div>
            </section>

            <section className="space-y-6 rounded-[28px] border border-[var(--border)] bg-[rgba(255,253,252,0.95)] p-5 shadow-[var(--shadow)]">
              {activeTab === "site" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--primary)]">Site basics</h2>
                  <TextField label="Brand name" value={settings.brandName} onChange={(value) => setSettings({ ...settings, brandName: value })} />
                  <TextField label="Tagline" value={settings.tagline} onChange={(value) => setSettings({ ...settings, tagline: value })} />
                  <TextField label="Service area" value={settings.serviceArea} onChange={(value) => setSettings({ ...settings, serviceArea: value })} />
                  <TextAreaField label="Mission" value={settings.mission} onChange={(value) => setSettings({ ...settings, mission: value })} rows={5} />
                </div>
              ) : null}

              {activeTab === "header" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--primary)]">Header editor</h2>
                  <Toggle checked={settings.header.visible} onChange={(visible) => setSettings({ ...settings, header: { ...settings.header, visible } })} label="Show header" />
                  <Toggle checked={settings.header.sticky} onChange={(sticky) => setSettings({ ...settings, header: { ...settings.header, sticky } })} label="Sticky header" />
                  <Toggle checked={settings.header.showAnnouncement} onChange={(showAnnouncement) => setSettings({ ...settings, header: { ...settings.header, showAnnouncement } })} label="Show announcement bar" />
                  <Toggle checked={settings.header.showLogo} onChange={(showLogo) => setSettings({ ...settings, header: { ...settings.header, showLogo } })} label="Show logo image" />
                  <Toggle checked={settings.header.showPrimaryCta} onChange={(showPrimaryCta) => setSettings({ ...settings, header: { ...settings.header, showPrimaryCta } })} label="Show primary CTA" />
                  <TextField label="Announcement text" value={settings.header.announcementText} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, announcementText: value } })} />
                  <TextField label="Announcement link" value={settings.header.announcementLink} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, announcementLink: value } })} />
                  <TextField label="Logo URL" value={settings.header.logoUrl} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, logoUrl: value } })} />
                  <TextField label="Brand title" value={settings.header.brandName} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, brandName: value } })} />
                  <TextField label="Domain text" value={settings.header.domainText} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, domainText: value } })} />
                  <TextField label="Primary CTA label" value={settings.header.primaryCtaLabel} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, primaryCtaLabel: value } })} />
                  <TextField label="Primary CTA href" value={settings.header.primaryCtaHref} onChange={(value) => setSettings({ ...settings, header: { ...settings.header, primaryCtaHref: value } })} />
                  <div>
                    <p className="mb-2 text-sm font-semibold">Menu links</p>
                    <LinkListEditor links={settings.header.links} onChange={(links) => setSettings({ ...settings, header: { ...settings.header, links } })} />
                  </div>
                </div>
              ) : null}

              {activeTab === "footer" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--primary)]">Footer editor</h2>
                  <Toggle checked={settings.footer.visible} onChange={(visible) => setSettings({ ...settings, footer: { ...settings.footer, visible } })} label="Show footer" />
                  <Toggle checked={settings.footer.showBrandBlock} onChange={(showBrandBlock) => setSettings({ ...settings, footer: { ...settings.footer, showBrandBlock } })} label="Show brand block" />
                  <TextField label="Footer brand title" value={settings.footer.brandTitle} onChange={(value) => setSettings({ ...settings, footer: { ...settings.footer, brandTitle: value } })} />
                  <TextAreaField label="Description" value={settings.footer.description} onChange={(value) => setSettings({ ...settings, footer: { ...settings.footer, description: value } })} rows={4} />
                  <TextField label="Copyright" value={settings.footer.copyright} onChange={(value) => setSettings({ ...settings, footer: { ...settings.footer, copyright: value } })} />
                  <FooterGroupsEditor groups={settings.footer.groups} onChange={(groups) => setSettings({ ...settings, footer: { ...settings.footer, groups } })} />
                </div>
              ) : null}

              {activeTab === "theme" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-[var(--primary)]">Theme editor</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries(settings.theme).map(([key, value]) => (
                      <label key={key} className="grid gap-1 text-sm">
                        <span className="capitalize">{key}</span>
                        <div className="flex gap-2">
                          <input type="color" value={value} onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, [key]: e.target.value } })} className="h-11 w-14 rounded-xl border border-[var(--border)]" />
                          <input value={value} onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, [key]: e.target.value } })} className="w-full rounded-xl border border-[var(--border)] px-3 py-2" />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === "pages" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-[var(--primary)]">Pages editor</h2>
                    <button type="button" onClick={addPageAndEdit} className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]">Add page</button>
                  </div>
                  <label className="grid gap-1 text-sm">
                    <span>Choose page to edit</span>
                    <select value={activePage?.id || ""} onChange={(e) => { const page = settings.pages.find((item) => item.id === e.target.value); setActivePageId(e.target.value); setActiveSectionId(page?.sections[0]?.id || null); }} className="rounded-xl border border-[var(--border)] px-3 py-2">
                      {settings.pages.map((page) => (
                        <option key={page.id} value={page.id}>{page.name} ({page.slug})</option>
                      ))}
                    </select>
                  </label>
                  <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {settings.pages.map((page) => (
                      <div key={page.id} className={`rounded-2xl border px-4 py-3 ${activePage?.id === page.id ? "border-[var(--primary)] bg-[var(--surface-alt)]" : "border-[var(--border)] bg-white"}`}>
                        <button type="button" onClick={() => { setActivePageId(page.id); setActiveSectionId(page.sections[0]?.id || null); }} className="w-full text-left">
                          <div className="font-medium text-[var(--text)]">{page.name}</div>
                          <div className="text-xs text-[var(--muted)]">{page.slug}</div>
                        </button>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => { setActivePageId(page.id); setActiveSectionId(page.sections[0]?.id || null); }} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Edit</button>
                          <button type="button" onClick={() => updatePage(page.id, { visible: !page.visible })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{page.visible ? "Hide page" : "Show page"}</button>
                          <button type="button" onClick={() => updatePage(page.id, { showInMenu: !page.showInMenu })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{page.showInMenu ? "Hide in menu" : "Show in menu"}</button>
                          <button type="button" onClick={() => removePage(page.id)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {activePage ? (
                    <>
                      <TextField label="Page name" value={activePage.name} onChange={(value) => updatePage(activePage.id, { name: value })} />
                      <TextField label="Slug" value={activePage.slug} onChange={(value) => updatePage(activePage.id, { slug: `/${slugify(value).replace(/^\/+/, "") || "page"}` })} />
                      <Toggle checked={activePage.visible} onChange={(visible) => updatePage(activePage.id, { visible })} label="Show page on site" />
                      <Toggle checked={activePage.showInMenu} onChange={(showInMenu) => updatePage(activePage.id, { showInMenu })} label="Show page in menu" />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--text)]">Sections</p>
                          <button type="button" onClick={() => activePage && updatePage(activePage.id, { sections: [...activePage.sections, createSection("hero")] })} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Quick add hero</button>
                        </div>
                        <SectionTypePicker onAdd={(type) => {
                          const section = createSection(type);
                          updatePage(activePage.id, { sections: [...activePage.sections, section] });
                          setActiveSectionId(section.id);
                        }} />
                        {activePage.sections.map((section) => (
                          <div key={section.id} className={`rounded-2xl border p-3 ${activeSection?.id === section.id ? "border-[var(--primary)] bg-[var(--surface-alt)]" : "border-[var(--border)] bg-white"}`}>
                            <button type="button" onClick={() => setActiveSectionId(section.id)} className="w-full text-left">
                              <div className="font-medium capitalize text-[var(--text)]">{section.name}</div>
                              <div className="text-xs text-[var(--muted)]">{section.type}</div>
                            </button>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button type="button" onClick={() => moveSection(section.id, -1)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Up</button>
                              <button type="button" onClick={() => moveSection(section.id, 1)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Down</button>
                              <button type="button" onClick={() => updateSection({ ...section, visible: !section.visible } as VisualSection)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{section.visible ? "Hide" : "Show"}</button>
                              <button type="button" onClick={() => duplicateSection(section.id)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">Duplicate</button>
                              <button type="button" onClick={() => removeSection(section.id)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">Remove</button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {activeSection ? (
                        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="font-semibold text-[var(--primary)]">Edit {activeSection.name}</h3>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => updateSection({ ...activeSection, visible: !activeSection.visible } as VisualSection)} className="rounded-full border border-[var(--border)] px-3 py-1 text-xs">{activeSection.visible ? "Hide section" : "Show section"}</button>
                              <button type="button" onClick={() => removeSection(activeSection.id)} className="rounded-full border border-red-300 px-3 py-1 text-xs text-red-700">Remove section</button>
                            </div>
                          </div>
                          <SectionEditor section={activeSection} onChange={updateSection} />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
