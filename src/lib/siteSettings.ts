export type SiteTheme = {
  background: string;
  backgroundSoft: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  primary: string;
  primaryHover: string;
  accent: string;
  border: string;
  success: string;
};

export type NavLink = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
  isButton?: boolean;
};

export type HeaderSettings = {
  visible: boolean;
  sticky: boolean;
  showAnnouncement: boolean;
  announcementText: string;
  announcementLink: string;
  showLogo: boolean;
  logoUrl: string;
  brandName: string;
  domainText: string;
  showPrimaryCta: boolean;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  links: NavLink[];
};

export type FooterLinkGroup = {
  id: string;
  title: string;
  visible: boolean;
  links: NavLink[];
};

export type FooterSettings = {
  visible: boolean;
  showBrandBlock: boolean;
  brandTitle: string;
  description: string;
  copyright: string;
  groups: FooterLinkGroup[];
};

export type VisualSectionType = "hero" | "text" | "cards" | "media" | "cta" | "spacer";

export type SectionStyle = {
  background: string;
  text: string;
  muted: string;
  border: string;
  buttonBackground: string;
  buttonText: string;
  cardBackground: string;
  cardText: string;
};

export type BaseSection = {
  id: string;
  type: VisualSectionType;
  name: string;
  visible: boolean;
  style: SectionStyle;
};

export type HeroSection = BaseSection & {
  type: "hero";
  eyebrow: string;
  title: string;
  text: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  mediaType: "image" | "video";
  mediaUrl: string;
  mediaAlt: string;
};

export type TextSection = BaseSection & {
  type: "text";
  title: string;
  body: string;
  align: "left" | "center";
};

export type CardItem = { id: string; title: string; text: string; visible: boolean };

export type CardsSection = BaseSection & {
  type: "cards";
  title: string;
  body: string;
  cards: CardItem[];
};

export type MediaSection = BaseSection & {
  type: "media";
  title: string;
  caption: string;
  mediaType: "image" | "video";
  mediaUrl: string;
};

export type CtaSection = BaseSection & {
  type: "cta";
  title: string;
  body: string;
  buttonLabel: string;
  buttonHref: string;
  mode: "button" | "subscribe";
  namePlaceholder: string;
  emailPlaceholder: string;
  successMessage: string;
};

export type SpacerSection = BaseSection & {
  type: "spacer";
  height: "sm" | "md" | "lg";
};

export type VisualSection = HeroSection | TextSection | CardsSection | MediaSection | CtaSection | SpacerSection;

export type VisualPage = {
  id: string;
  name: string;
  slug: string;
  visible: boolean;
  showInMenu: boolean;
  sections: VisualSection[];
};

export type SponsorTier = {
  name: string;
  price: string;
  description: string;
  perks: string[];
};

export type SiteSettings = {
  brandName: string;
  tagline: string;
  serviceArea: string;
  mission: string;
  categories: string[];
  theme: SiteTheme;
  header: HeaderSettings;
  footer: FooterSettings;
  pages: VisualPage[];
  sponsorTiers: SponsorTier[];
};

export const DEFAULT_CATEGORIES = [
  "Restaurants",
  "Coffee & Tea",
  "Beauty & Spas",
  "Barbers",
  "Health & Wellness",
  "Shopping",
  "Professional Services",
  "Home Services",
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const baseStyle = {
  background: "#FFFDFC",
  text: "#1D1B18",
  muted: "#6D655B",
  border: "#E7DDCC",
  buttonBackground: "#0F5132",
  buttonText: "#FFFFFF",
  cardBackground: "#F6F0E5",
  cardText: "#1D1B18",
};

export function createSection(type: VisualSectionType): VisualSection {
  const id = uid();
  switch (type) {
    case "hero":
      return {
        id,
        type,
        name: "Hero",
        visible: true,
        style: { ...baseStyle },
        eyebrow: "LOCALGREENWOOD.COM",
        title: "The trusted local directory for discovering and supporting Black-owned businesses.",
        text: "Greenwood helps communities discover, trust, and support Black-owned businesses through a polished local experience.",
        primaryLabel: "Browse directory",
        primaryHref: "/directory",
        secondaryLabel: "List your business",
        secondaryHref: "/submit",
        mediaType: "image",
        mediaUrl: "/greenwood-logo.jpg",
        mediaAlt: "Greenwood logo",
      };
    case "text":
      return {
        id,
        type,
        name: "Text section",
        visible: true,
        style: { ...baseStyle },
        title: "Tell people what Greenwood stands for",
        body: "Use this block for your story, mission, launch message, sponsorship pitch, or founder note.",
        align: "left",
      };
    case "cards":
      return {
        id,
        type,
        name: "Cards section",
        visible: true,
        style: { ...baseStyle },
        title: "Why Greenwood works",
        body: "Add up to three highlights here.",
        cards: [
          { id: uid(), title: "Discover", text: "Help people find businesses fast.", visible: true },
          { id: uid(), title: "Support", text: "Drive visibility and foot traffic.", visible: true },
          { id: uid(), title: "Grow", text: "Create sponsor-ready placements.", visible: true },
        ],
      };
    case "media":
      return {
        id,
        type,
        name: "Media section",
        visible: true,
        style: { ...baseStyle },
        title: "Show your product or promo video",
        caption: "Paste an image or video URL here.",
        mediaType: "image",
        mediaUrl: "",
      };
    case "cta":
      return {
        id,
        type,
        name: "Call to action",
        visible: true,
        style: {
          ...baseStyle,
          background: "#0F5132",
          text: "#FFFFFF",
          muted: "rgba(255,255,255,0.82)",
          buttonBackground: "#FFFFFF",
          buttonText: "#0F5132",
          cardBackground: "#FFFFFF",
          cardText: "#1D1B18",
        },
        title: "Join the Greenwood launch list",
        body: "Be the first to discover new Black-owned businesses, receive updates, and get early access to the Greenwood directory.",
        buttonLabel: "Subscribe",
        buttonHref: "/signup",
        mode: "subscribe",
        namePlaceholder: "Your name",
        emailPlaceholder: "Email address",
        successMessage: "Thanks for subscribing to Greenwood.",
      };
    case "spacer":
      return {
        id,
        type,
        name: "Spacer",
        visible: true,
        style: { ...baseStyle },
        height: "md",
      };
  }
}

export function createPage(name: string, slug: string): VisualPage {
  return {
    id: uid(),
    name,
    slug,
    visible: true,
    showInMenu: true,
    sections: [createSection("hero"), createSection("text"), createSection("cta")],
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brandName: "Greenwood",
  tagline: "Discover Black-owned businesses with confidence.",
  serviceArea: "Detroit",
  mission: "Greenwood helps communities find, trust, and support Black-owned businesses through a polished local directory designed to increase foot traffic, visibility, and circulation of dollars.",
  categories: DEFAULT_CATEGORIES,
  theme: {
    background: "#F6F0E5",
    backgroundSoft: "#FBF7EF",
    surface: "#FFFDFC",
    surfaceAlt: "#F3EBD9",
    text: "#1D1B18",
    muted: "#6D655B",
    primary: "#0F5132",
    primaryHover: "#146A42",
    accent: "#C8A951",
    border: "#E7DDCC",
    success: "#1C7C54",
  },
  header: {
    visible: true,
    sticky: true,
    showAnnouncement: true,
    announcementText: "Coming soon on localgreenwood.com",
    announcementLink: "/submit",
    showLogo: true,
    logoUrl: "/greenwood-logo.jpg",
    brandName: "Greenwood",
    domainText: "localgreenwood.com",
    showPrimaryCta: true,
    primaryCtaLabel: "List your business",
    primaryCtaHref: "/submit",
    links: [
      { id: uid(), label: "Home", href: "/", visible: true },
      { id: uid(), label: "Directory", href: "/directory", visible: true },
      { id: uid(), label: "Sponsors", href: "/partners", visible: true },
      { id: uid(), label: "About", href: "/about", visible: true },
    ],
  },
  sponsorTiers: [
    { name: "Community Supporter", price: "$500/mo", description: "For aligned local brands.", perks: ["Homepage logo placement", "Partner page listing", "Monthly recap"] },
    { name: "Category Sponsor", price: "$1,500/mo", description: "Own a category with premium visibility.", perks: ["Category exclusivity", "Featured placement", "Quarterly recap"] },
    { name: "Presenting Partner", price: "$3,500+/mo", description: "Best for anchor partners and institutions.", perks: ["Hero placement", "Lead capture visibility", "Co-branded campaign options"] },
  ],
  footer: {
    visible: true,
    showBrandBlock: true,
    brandTitle: "Greenwood",
    description: "A polished, mobile-first directory built to help Black-owned businesses get discovered and supported.",
    copyright: "© Greenwood • localgreenwood.com",
    groups: [
      { id: uid(), title: "Explore", visible: true, links: [
          { id: uid(), label: "Directory", href: "/directory", visible: true },
          { id: uid(), label: "Submit your business", href: "/submit", visible: true },
        ] },
      { id: uid(), title: "Company", visible: true, links: [
          { id: uid(), label: "About", href: "/about", visible: true },
          { id: uid(), label: "Partners", href: "/partners", visible: true },
        ] },
    ],
  },
  pages: [
    { id: uid(), name: "Home", slug: "/", visible: true, showInMenu: true, sections: [createSection("hero"), createSection("cards"), createSection("text"), createSection("cta")] },
    { id: uid(), name: "About", slug: "/about", visible: true, showInMenu: true, sections: [
      { ...createSection("hero"), title: "About Greenwood", text: "Tell your story, mission, and why this directory matters.", primaryLabel: "Browse directory", primaryHref: "/directory", secondaryLabel: "Partner with Greenwood", secondaryHref: "/partners" } as HeroSection,
      { ...createSection("text"), title: "Our mission", body: "Greenwood helps communities discover and support Black-owned businesses through a polished, mobile-first directory experience." } as TextSection,
      { ...createSection("cta"), title: "Want to support the mission?", body: "Connect as a partner, business owner, or supporter.", buttonLabel: "Contact us", buttonHref: "/partners", mode: "button" } as CtaSection,
    ] },
    { id: uid(), name: "Partners", slug: "/partners", visible: true, showInMenu: true, sections: [
      { ...createSection("hero"), title: "Built to pitch partners with confidence.", text: "Use this page to explain the problem, the solution, and the value Greenwood creates for sponsors.", primaryLabel: "Become a partner", primaryHref: "/partners", secondaryLabel: "View directory", secondaryHref: "/directory" } as HeroSection,
      createSection("cards"),
      { ...createSection("cta"), mode: "button", buttonLabel: "List your business", buttonHref: "/submit" } as CtaSection,
    ] },
  ],
};

function sanitizeLink(link: Partial<NavLink> | undefined | null): NavLink {
  return { id: String(link?.id || uid()), label: String(link?.label || "Link"), href: String(link?.href || "/"), visible: link?.visible !== false, isButton: !!link?.isButton };
}

function sanitizeStyle(style: Partial<SectionStyle> | undefined | null): SectionStyle {
  return { ...baseStyle, ...(style || {}) };
}

function sanitizeSection(section: Partial<VisualSection> | undefined | null): VisualSection {
  switch (section?.type) {
    case "hero":
      return { ...createSection("hero"), ...section, type: "hero", style: sanitizeStyle((section as any)?.style) } as HeroSection;
    case "text":
      return { ...createSection("text"), ...section, type: "text", style: sanitizeStyle((section as any)?.style) } as TextSection;
    case "cards":
      return {
        ...createSection("cards"), ...section, type: "cards", style: sanitizeStyle((section as any)?.style),
        cards: Array.isArray((section as any)?.cards) ? (section as any).cards.map((card: any) => ({ id: String(card?.id || uid()), title: String(card?.title || "Card"), text: String(card?.text || ""), visible: card?.visible !== false })) : (createSection("cards") as CardsSection).cards,
      } as CardsSection;
    case "media":
      return { ...createSection("media"), ...section, type: "media", style: sanitizeStyle((section as any)?.style) } as MediaSection;
    case "cta":
      return { ...createSection("cta"), ...section, type: "cta", style: sanitizeStyle((section as any)?.style), mode: (section as any)?.mode === "button" ? "button" : "subscribe" } as CtaSection;
    case "spacer":
      return { ...createSection("spacer"), ...section, type: "spacer", style: sanitizeStyle((section as any)?.style) } as SpacerSection;
    default:
      return createSection("text");
  }
}

function sanitizePage(page: Partial<VisualPage> | undefined | null): VisualPage {
  return {
    id: String(page?.id || uid()),
    name: String(page?.name || "Page"),
    slug: String(page?.slug || "/"),
    visible: page?.visible !== false,
    showInMenu: page?.showInMenu !== false,
    sections: Array.isArray(page?.sections) && page?.sections.length ? page.sections.map(sanitizeSection) : [createSection("hero")],
  };
}

export function sanitizeSettings(input: Partial<SiteSettings> | undefined | null): SiteSettings {
  return ({
    ...DEFAULT_SITE_SETTINGS,
    ...input,
    categories: Array.isArray(input?.categories) && input?.categories.length ? input!.categories.map((x) => String(x).trim()).filter(Boolean) : DEFAULT_SITE_SETTINGS.categories,
    theme: { ...DEFAULT_SITE_SETTINGS.theme, ...(input?.theme || {}) },
    header: { ...DEFAULT_SITE_SETTINGS.header, ...(input?.header || {}), links: Array.isArray(input?.header?.links) && input?.header?.links.length ? input!.header!.links.map(sanitizeLink) : DEFAULT_SITE_SETTINGS.header.links },
    footer: {
      ...DEFAULT_SITE_SETTINGS.footer,
      ...(input?.footer || {}),
      groups: Array.isArray(input?.footer?.groups) && input?.footer?.groups.length ? input!.footer!.groups.map((group) => ({ id: String(group?.id || uid()), title: String(group?.title || "Group"), visible: group?.visible !== false, links: Array.isArray(group?.links) ? group.links.map(sanitizeLink) : [] })) : DEFAULT_SITE_SETTINGS.footer.groups,
    },
    pages: Array.isArray(input?.pages) && input?.pages.length ? input.pages.map(sanitizePage) : DEFAULT_SITE_SETTINGS.pages,
    sponsorTiers: Array.isArray((input as any)?.sponsorTiers) && (input as any).sponsorTiers.length ? (input as any).sponsorTiers.map((tier: any) => ({ name: String(tier?.name || "Tier"), price: String(tier?.price || ""), description: String(tier?.description || ""), perks: Array.isArray(tier?.perks) ? tier.perks.map((perk: any) => String(perk)) : [] })) : DEFAULT_SITE_SETTINGS.sponsorTiers,
  });
}

export function getPageBySlug(settings: SiteSettings, slug: string) {
  const normalized = slug.startsWith("/") ? slug : `/${slug}`;
  return settings.pages.find((page) => page.slug === normalized && page.visible) || null;
}
