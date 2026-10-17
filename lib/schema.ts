import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  unique,
  serial,
} from "drizzle-orm/pg-core";

const uuidId = (name: string) =>
  text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const userIdFk = (name: string) =>
  integer(name)
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: integer("is_admin").notNull().default(0),
  premium: integer("premium").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: integer("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  avatarUrl: text("avatar_url"),
  backgroundUrl: text("background_url"),
  bannerUrl: text("banner_url"),
  cursorUrl: text("cursor_url"),
  layout: text("layout").notNull().default("centered"),
  blur: integer("blur").notNull().default(0),
  cardBlur: integer("card_blur").notNull().default(20),
  overlayEnabled: integer("overlay_enabled").notNull().default(0),
  overlayText: text("overlay_text").notNull().default("Click to show"),
  tiltEnabled: integer("tilt_enabled").notNull().default(0),
  tiltMode: text("tilt_mode").notNull().default("tilt"),
  borderRadius: integer("border_radius").notNull().default(24),
  borderWidth: integer("border_width").notNull().default(1),
  description: text("description"),
  displayName: text("display_name"),
  cardOpacity: integer("card_opacity").notNull().default(100),
  borderOpacity: integer("border_opacity").notNull().default(100),
  cardWidth: integer("card_width").notNull().default(420),
  cardBlurEnabled: integer("card_blur_enabled").notNull().default(1),
  avatarShape: text("avatar_shape").notNull().default("circle"),
  location: text("location"),
  occupation: text("occupation"),
  bio: text("bio"),
  showViews: integer("show_views").notNull().default(1),
  viewsPosition: text("views_position").notNull().default("top-right"),
  badgesPosition: text("badges_position").notNull().default("auto"),
  customLayout: text("custom_layout"),
  accentColor: text("accent_color").notNull().default("white"),
  primaryColor: text("primary_color").notNull().default("white"),
  textColor: text("text_color").notNull().default("white"),
  borderColor: text("border_color").notNull().default("white"),
  backgroundColor: text("background_color").notNull().default("#111111"),
  badgeColor: text("badge_color").notNull().default("white"),
  socialColor: text("social_color").notNull().default("white"),
  linkHoverColor: text("link_hover_color").notNull().default("white"),
  glowEnabled: integer("glow_enabled").notNull().default(1),
  usernameGlow: integer("username_glow").notNull().default(1),
  gradientEnabled: integer("gradient_enabled").notNull().default(0),
  gradientPrimary: text("gradient_primary").notNull().default("#881c9c"),
  gradientSecondary: text("gradient_secondary").notNull().default("#0d0d0d"),
  showFeedback: integer("show_feedback").notNull().default(1),
  usernameColor: text("username_color"),
  avatarHidden: integer("avatar_hidden").notNull().default(0),
});

export const socialLinks = pgTable(
  "social_links",
  {
    id: uuidId("id"),
    userId: userIdFk("user_id"),
    platform: text("platform").notNull(),
    url: text("url").notNull(),
    iconUrl: text("icon_url"),
    order: integer("order").notNull().default(0),
    clicks: integer("clicks").notNull().default(0),
  },
  (t) => [
    unique("social_links_user_platform_idx").on(t.userId, t.platform),
  ]
);

export const links = pgTable("links", {
  id: uuidId("id"),
  userId: userIdFk("user_id"),
  title: text("title").notNull(),
  url: text("url").notNull(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const badges = pgTable("badges", {
  id: uuidId("id"),
  name: text("name").notNull().unique(),
  iconPrefix: text("icon_prefix").notNull().default("solid"),
  iconName: text("icon_name").notNull(),
  iconUrl: text("icon_url"),
  color: text("color").notNull().default("pink"),
});

export const userBadges = pgTable(
  "user_badges",
  {
    id: uuidId("id"),
    userId: userIdFk("user_id"),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    hidden: integer("hidden").notNull().default(0),
    /** Per-user override of the global badge color (null = global). */
    color: text("color"),
    /** Display order on this user's profile (lower = first). */
    position: integer("position").notNull().default(0),
    /** Per-badge glow toggle (1 = on). */
    glow: integer("glow").notNull().default(1),
  },
  (t) => [unique("user_badges_user_badge_idx").on(t.userId, t.badgeId)]
);

export const pageViews = pgTable(
  "page_views",
  {
    id: uuidId("id"),
    userId: userIdFk("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ip: text("ip"),
    device: text("device"),
    country: text("country"),
    city: text("city"),
    latitude: text("latitude"),
    longitude: text("longitude"),
    referrer: text("referrer"),
    userAgent: text("user_agent"),
  },
  (t) => [index("page_views_user_id_idx").on(t.userId)]
);

export const premiumSubscriptions = pgTable(
  "premium_subscriptions",
  {
    id: uuidId("id"),
    userId: userIdFk("user_id"),
    plan: text("plan").notNull().default("plus"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (t) => [index("premium_subscriptions_user_id_idx").on(t.userId)]
);

export const profileWidgets = pgTable(
  "profile_widgets",
  {
    id: uuidId("id"),
    userId: userIdFk("user_id"),
    type: text("type").notNull(),
    enabled: integer("enabled").notNull().default(0),
    position: integer("position").notNull().default(0),
    config: text("config"),
  },
  (t) => [
    unique("profile_widgets_user_type_idx").on(t.userId, t.type),
    index("profile_widgets_user_id_idx").on(t.userId),
  ]
);

export const profileFeedback = pgTable(
  "profile_feedback",
  {
    id: uuidId("id"),
    profileUserId: userIdFk("profile_user_id"),
    voterIp: text("voter_ip").notNull(),
    kind: text("kind").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("profile_feedback_profile_voter_idx").on(
      t.profileUserId,
      t.voterIp
    ),
    index("profile_feedback_profile_kind_idx").on(t.profileUserId, t.kind),
  ]
);

export const aliases = pgTable(
  "aliases",
  {
    id: uuidId("id"),
    userId: userIdFk("user_id"),
    alias: text("alias").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("aliases_user_id_idx").on(t.userId)]
);

export const templates = pgTable(
  "templates",
  {
    id: uuidId("id"),
    ownerId: integer("owner_id"),
    name: text("name").notNull(),
    description: text("description"),
    previewUrl: text("preview_url"),
    tags: text("tags").notNull().default(""),
    visibility: text("visibility").notNull().default("public"),
    premiumOnly: integer("premium_only").notNull().default(0),
    snapshot: text("snapshot").notNull(),
    useCount: integer("use_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("templates_owner_id_idx").on(t.ownerId)]
);

export const templateFavorites = pgTable(
  "template_favorites",
  {
    id: uuidId("id"),
    templateId: text("template_id").notNull(),
    userId: userIdFk("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("template_favorites_template_user_idx").on(t.templateId, t.userId),
    index("template_favorites_template_id_idx").on(t.templateId),
  ]
);

export const templateUses = pgTable(
  "template_uses",
  {
    id: uuidId("id"),
    templateId: text("template_id").notNull(),
    userId: userIdFk("user_id"),
    usedAt: timestamp("used_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("template_uses_template_id_idx").on(t.templateId),
    index("template_uses_user_id_idx").on(t.userId),
  ]
);
