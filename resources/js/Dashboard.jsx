import React, { useEffect, useMemo, useState } from "react";
import * as Lucide from "lucide-react";
import {
  LogOut,
  Settings,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ChevronDown,
  ChevronLeft,
  ArrowUpRight,
  ShieldCheck,
  Eye,
  EyeOff,
  PoundSterling,
  Rocket,
  Target,
  Megaphone,
  Cpu,
  UserPlus,
  Siren,
  Cog,
  Mail,
  Lock,
} from "lucide-react";
import Logo from "./LogoSvg.jsx";

/* ============================================================
   BRAND TOKENS — from official TDC brand guidelines
   White (cream) dominates · Dark Green + Reseda complement
   Black is text only — no black backgrounds
   ============================================================ */
const BRAND = {
  name: "The Despatch Company",
  product: "Reporting",
  colors: {
    bg: "#F0E6D8",          // White (brand cream)
    surface: "#F6F2E7",     // Lifted cream — cards
    surfaceAlt: "#E8DDC8",  // Warmer cream — chips, hover
    surfaceHover: "#DFD3BA",
    border: "#D8CDB6",
    borderStrong: "#B8AC93",
    ink: "#1A1710",         // Black — text only
    inkSoft: "#3A3526",
    primary: "#18332F",     // Dark Green
    primaryHover: "#22463F",
    secondary: "#6B6E53",   // Reseda
    secondaryMuted: "#8C8F73",
    textMuted: "#6B6E53",
    textDim: "#9A9580",
  },
  fonts: {
    display: "'Playfair Display', Georgia, serif",
    body: "'PP Radio Grotesk', system-ui, sans-serif",
    mono: "'PP Radio Grotesk', ui-monospace, monospace",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
  },
};

/* ============================================================
   CATEGORIES — one URL per category. Replace `url` later.
   ============================================================ */
const DEFAULT_CATEGORIES = [
  { id: "finance", title: "Finance", icon: "PoundSterling",
    description: "Revenue, cash, and financial health.", url: "https://evidence.thedespatchcompany.com" },
  { id: "onboarding", title: "Onboarding", icon: "Rocket",
    description: "Activation and time-to-value.", url: "#" },
  { id: "sales", title: "Sales", icon: "Target",
    description: "Pipeline, conversion, and rep performance.", url: "#" },
  { id: "marketing", title: "Marketing", icon: "Megaphone",
    description: "Acquisition, funnel, and campaign ROI.", url: "#" },
  { id: "product", title: "Product / Engineering", icon: "Cpu",
    description: "Velocity, reliability, and adoption.", url: "#" },
  { id: "people", title: "People", icon: "UserPlus",
    description: "Headcount, hiring, and retention.", url: "#" },
  { id: "mir", title: "MIR — Major Incident Response", icon: "Siren",
    description: "Live incidents, MTTR, and post-mortems.", url: "#", critical: true },
  { id: "security", title: "Security & Compliance", icon: "ShieldCheck",
    description: "Audits, access reviews, and SOC2 posture.", url: "#" },
];

/* ============================================================
   USERS — single source of truth for auth + per-user access.
   `perms: "*"` means access to everything.
   Admins implicitly have access to everything regardless of `perms`.
   ============================================================ */

/* ============================================================
   ICON PICKER SET — curated, but any Lucide name resolves.
   ============================================================ */
const ICON_PICKER_NAMES = [
  "PoundSterling", "DollarSign", "Wallet", "PiggyBank", "Receipt", "CreditCard",
  "Users", "User", "UserPlus", "UserCircle2", "Building2", "Briefcase",
  "LifeBuoy", "MessageCircle", "Headphones", "Phone", "Inbox",
  "Rocket", "Sparkles", "Zap", "Flame", "TrendingUp", "BarChart3", "LineChart", "PieChart",
  "Target", "Crosshair", "Trophy", "Award",
  "Megaphone", "Mail", "Send", "Globe", "Share2",
  "Cpu", "Code2", "GitBranch", "GitPullRequest", "Server", "Database", "Cloud",
  "Truck", "Package", "PackageCheck", "Warehouse", "Map", "Navigation",
  "Siren", "AlertTriangle", "ShieldAlert", "ShieldCheck", "Lock", "KeyRound",
  "Settings", "Cog", "Wrench", "Filter", "Search",
  "FileText", "FileBarChart", "Folder", "BookOpen", "Layers",
  "Calendar", "Clock", "Activity", "Eye", "Bell",
];

const resolveIcon = (name) => Lucide[name] || Lucide.FileBarChart;

const hasAccess = (user, categoryId) => {
  if (!user) return false;
  if (user.is_admin) return true;
  if (!user.permissions) return true;
  return Array.isArray(user.permissions) && user.permissions.includes(categoryId);
};

/* ============================================================
   STORAGE — categories only (users now live in the database).
   ============================================================ */
const STORAGE_KEY = "tdc-reporting-categories-v5";
const loadState = () => {
  try {
    const raw = typeof window !== "undefined" && window.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const saveState = (state) => {
  try { window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
};

/* ============================================================
   API UTILITY
   ============================================================ */
const csrfToken = () =>
  document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

const api = {
  get: (url) =>
    fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' }),
  post: (url, data) =>
    fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    }),
  put: (url, data) =>
    fetch(url, {
      method: 'PUT',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    }),
  del: (url) =>
    fetch(url, {
      method: 'DELETE',
      headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
      credentials: 'same-origin',
    }),
};

/* ============================================================
   ROOT APP
   ============================================================ */
export default function App() {
  const persisted = loadState();
  const [categories, setCategories] = useState(persisted?.categories ?? DEFAULT_CATEGORIES);
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [route, setRoute] = useState("dashboard");
  const [previewUser, setPreviewUser] = useState(null);

  useEffect(() => { saveState({ categories }); }, [categories]);

  useEffect(() => {
    api.get('/api/user')
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => { setCurrentUser(user); setAuthLoading(false); })
      .catch(() => setAuthLoading(false));
  }, []);

  const loadUsers = () => {
    api.get('/api/users').then((r) => r.json()).then(setUsers);
  };

  const effectiveUser = previewUser ?? currentUser;
  const isAdmin = !!currentUser?.is_admin;

  const visibleCategories = useMemo(() => {
    if (!effectiveUser) return [];
    return categories.filter((c) => hasAccess(effectiveUser, c.id));
  }, [categories, effectiveUser]);

  const handleLogout = () => {
    api.post('/api/logout', {}).then(() => {
      setCurrentUser(null);
      setPreviewUser(null);
      setRoute("dashboard");
    });
  };

  return (
    <div
      style={{
        background: BRAND.colors.bg,
        color: BRAND.colors.ink,
        fontFamily: BRAND.fonts.body,
        minHeight: "100vh",
      }}
    >
      <GoogleFonts />

      {authLoading ? (
        <div style={{ minHeight: '100vh', background: BRAND.colors.primary }} />
      ) : !currentUser ? (
        <Login onLogin={setCurrentUser} />
      ) : (
        <>
          <Header onHome={() => setRoute("dashboard")} />
          <main className="mx-auto w-full max-w-5xl px-6 pb-24">
            {route === "dashboard" && (
              <Dashboard
                categories={visibleCategories}
                user={effectiveUser}
                isAdmin={isAdmin}
                route={route}
                onSettings={() => setRoute("settings")}
                onLogout={handleLogout}
              />
            )}
            {route === "settings" && isAdmin && (
              <AdminPanel
                categories={categories}
                setCategories={setCategories}
                users={users}
                setUsers={setUsers}
                loadUsers={loadUsers}
                user={effectiveUser}
                isAdmin={isAdmin}
                route={route}
                onSettings={() => setRoute("settings")}
                onLogout={handleLogout}
                onHome={() => setRoute("dashboard")}
              />
            )}
          </main>
          {isAdmin && (
            <DevUserSwitcher
              users={users}
              loadUsers={loadUsers}
              currentEmail={effectiveUser.email}
              actualEmail={currentUser.email}
              onChange={(u) => setPreviewUser(u?.email === currentUser.email ? null : u)}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   GOOGLE FONTS
   ============================================================ */
function GoogleFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap');
      * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
      .tdc-display { font-family: ${BRAND.fonts.display}; letter-spacing: -0.015em; }
      .tdc-display-italic { font-family: ${BRAND.fonts.display}; font-style: italic; }
      .tdc-mono { font-family: ${BRAND.fonts.mono}; letter-spacing: 0.02em; }
      .tdc-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
      .tdc-scroll::-webkit-scrollbar-thumb { background: ${BRAND.colors.borderStrong}; border-radius: 4px; }
      .tdc-scroll::-webkit-scrollbar-track { background: transparent; }
      ::selection { background: ${BRAND.colors.primary}; color: ${BRAND.colors.bg}; }
    `}</style>
  );
}

/* ============================================================
   LOGIN — magic link, no password.
   ============================================================ */
function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    api.post('/api/auth/magic-link', { email: email.trim() })
      .then((r) => r.json())
      .then(() => { setSent(true); setLoading(false); })
      .catch(() => { setError("Something went wrong. Please try again."); setLoading(false); });
  };

  return (
    <div
      className="grid min-h-screen place-items-center px-6"
      style={{ background: BRAND.colors.primary, color: BRAND.colors.bg }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-12 flex justify-center">
          <Logo width={220} color={BRAND.colors.bg} />
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="flex justify-center">
              <Mail size={40} style={{ color: `${BRAND.colors.bg}CC` }} />
            </div>
            <p className="text-sm" style={{ color: `${BRAND.colors.bg}CC` }}>
              Check your inbox — we've sent a login link to <strong style={{ color: BRAND.colors.bg }}>{email}</strong>.
            </p>
            <p className="text-xs" style={{ color: `${BRAND.colors.bg}66` }}>The link expires in 15 minutes.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email" onDark>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${BRAND.colors.bg}99` }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@thedespatchcompany.com"
                  required
                  className="w-full py-2.5 pl-9 pr-3 text-sm outline-none"
                  style={inputStyleDark()}
                />
              </div>
            </Field>

            {error && (
              <div
                className="rounded-lg px-3 py-2 text-sm"
                style={{ background: `${BRAND.colors.bg}14`, color: BRAND.colors.bg, border: `1px solid ${BRAND.colors.bg}33` }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold transition"
              style={{
                background: BRAND.colors.bg,
                color: BRAND.colors.primary,
                borderRadius: BRAND.radius.sm,
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = BRAND.colors.surfaceAlt; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = BRAND.colors.bg; }}
            >
              {loading ? 'Sending…' : 'Send login link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function inputStyle() {
  return {
    background: BRAND.colors.bg,
    border: `1px solid ${BRAND.colors.border}`,
    borderRadius: BRAND.radius.sm,
    color: BRAND.colors.ink,
  };
}
function inputStyleDark() {
  return {
    background: `${BRAND.colors.bg}14`,
    border: `1px solid ${BRAND.colors.bg}33`,
    borderRadius: BRAND.radius.sm,
    color: BRAND.colors.bg,
  };
}

function Field({ label, children, onDark }) {
  return (
    <label className="block">
      <span
        className="tdc-mono mb-1.5 block text-[10px] uppercase tracking-[0.2em]"
        style={{ color: onDark ? `${BRAND.colors.bg}99` : BRAND.colors.secondary }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/* ============================================================
   HEADER — centred logo only. The user menu lives in the
   page title row below, in line with "Reporting hub".
   ============================================================ */
function Header({ onHome }) {
  return (
    <header>
      <div className="mx-auto max-w-5xl px-6 pt-10 pb-14">
        <div className="flex items-center justify-center">
          <button onClick={onHome} aria-label="Home" className="block">
            <Logo width={150} color={BRAND.colors.primary} />
          </button>
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user, isAdmin, onSettings, onLogout, settingsActive }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!e.target.closest?.("[data-user-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" data-user-menu>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 px-2.5 py-1.5 transition"
        style={{
          background: open ? BRAND.colors.surfaceAlt : "transparent",
          border: `1px solid ${open ? BRAND.colors.borderStrong : "transparent"}`,
          borderRadius: BRAND.radius.sm,
          color: BRAND.colors.ink,
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = BRAND.colors.surfaceAlt; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        <Avatar email={user.email} name={user.name} size={30} />
        <span
          className="hidden text-sm font-semibold sm:inline"
          style={{ color: BRAND.colors.ink }}
        >
          {firstName(user.name)}
        </span>
        <ChevronDown
          size={16}
          style={{
            color: BRAND.colors.secondary,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 160ms ease",
          }}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-60 overflow-hidden"
          style={{
            background: BRAND.colors.surface,
            border: `1px solid ${BRAND.colors.borderStrong}`,
            borderRadius: BRAND.radius.md,
            boxShadow: `0 20px 40px #1A171022`,
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${BRAND.colors.border}` }}>
            <div className="text-sm font-semibold" style={{ color: BRAND.colors.ink }}>{user.name}</div>
            <div className="truncate text-xs" style={{ color: BRAND.colors.textMuted }}>{user.email}</div>
            {user.is_admin && (
              <div
                className="tdc-mono mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]"
                style={{ background: BRAND.colors.primary, color: BRAND.colors.bg }}
              >
                Admin
              </div>
            )}
          </div>
          {isAdmin && (
            <MenuItem
              icon={<Settings size={15} />}
              label="Settings"
              active={settingsActive}
              onClick={() => { setOpen(false); onSettings(); }}
            />
          )}
          <MenuItem
            icon={<LogOut size={15} />}
            label="Log out"
            onClick={() => { setOpen(false); onLogout(); }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition"
      style={{
        color: active ? BRAND.colors.primary : BRAND.colors.ink,
        background: "transparent",
        fontWeight: active ? 600 : 500,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.colors.surfaceAlt)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span style={{ color: active ? BRAND.colors.primary : BRAND.colors.secondary }}>{icon}</span>
      {label}
    </button>
  );
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function firstName(name) {
  return (name ?? "").trim().split(/\s+/)[0] ?? "";
}

/* Deterministic, on-brand avatar tile colour from an email/seed. */
const AVATAR_PALETTE = [
  "#18332F", // Dark Green (primary)
  "#22463F", // lifted forest
  "#0F2622", // deep pine
  "#4F523D", // dark reseda
  "#3A3526", // warm brown
  "#2D4838", // mid forest
];
function avatarColor(seed) {
  const s = (seed ?? "").toLowerCase();
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function Avatar({ email, name, size = 30 }) {
  return (
    <div
      className="grid place-items-center"
      style={{
        width: size,
        height: size,
        background: avatarColor(email),
        color: BRAND.colors.bg,
        borderRadius: 999,
        fontSize: Math.round(size * 0.4),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ============================================================
   DASHBOARD — left-aligned page title, narrower card grid.
   ============================================================ */
function Dashboard({ categories, user, isAdmin, route, onSettings, onLogout }) {
  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <h2
          className="tdc-display text-3xl"
          style={{ fontWeight: 700, color: BRAND.colors.ink, letterSpacing: "-0.01em" }}
        >
          <span className="tdc-display-italic font-medium" style={{ color: BRAND.colors.secondary }}>
            The
          </span>{" "}
          reporting hub
        </h2>
        <UserMenu
          user={user}
          isAdmin={isAdmin}
          onSettings={onSettings}
          onLogout={onLogout}
          settingsActive={route === "settings"}
        />
      </div>

      {categories.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="grid place-items-center px-6 py-16 text-center"
      style={{
        background: BRAND.colors.surface,
        border: `1px dashed ${BRAND.colors.borderStrong}`,
        borderRadius: BRAND.radius.lg,
      }}
    >
      <p className="text-sm" style={{ color: BRAND.colors.textMuted }}>
        No categories visible for this account. Ask an admin to update permissions.
      </p>
    </div>
  );
}

function CategoryCard({ category }) {
  const Icon = resolveIcon(category.icon);
  const isCritical = !!category.critical;
  const [hover, setHover] = useState(false);

  return (
    <a
      href={category.url || "#"}
      target={category.url && category.url !== "#" ? "_blank" : undefined}
      rel="noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group relative flex flex-col overflow-hidden no-underline"
      style={{
        background: BRAND.colors.surface,
        border: `1px solid ${hover ? BRAND.colors.primary : BRAND.colors.border}`,
        borderRadius: BRAND.radius.md,
        color: BRAND.colors.ink,
        transition: "border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hover
          ? `0 10px 28px ${BRAND.colors.primary}1A`
          : `0 1px 0 ${BRAND.colors.border}`,
        textDecoration: "none",
        minHeight: 160,
      }}
    >
      <div className="flex items-start justify-between gap-3 p-5">
        <div
          className="grid place-items-center"
          style={{
            width: 38,
            height: 38,
            borderRadius: BRAND.radius.sm,
            background: BRAND.colors.primary,
            color: BRAND.colors.bg,
          }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <ArrowUpRight
          size={18}
          style={{
            color: hover ? BRAND.colors.primary : BRAND.colors.secondary,
            transform: hover ? "translate(2px,-2px)" : "translate(0,0)",
            transition: "transform 180ms ease, color 180ms ease",
          }}
        />
      </div>

      <div className="flex-1 px-5 pb-5">
        <h3
          className="tdc-display text-lg leading-tight"
          style={{ fontWeight: 700, color: BRAND.colors.ink }}
        >
          {category.title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed" style={{ color: BRAND.colors.textMuted }}>
          {category.description}
        </p>

        {isCritical && (
          <div
            className="tdc-mono mt-3 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em]"
            style={{
              color: BRAND.colors.primary,
              borderBottom: `1px solid ${BRAND.colors.primary}`,
              paddingBottom: 2,
              fontWeight: 600,
            }}
          >
            <Siren size={11} strokeWidth={2.25} />
            Critical
          </div>
        )}
      </div>
    </a>
  );
}

/* ============================================================
   ADMIN PANEL
   ============================================================ */
function AdminPanel({ categories, setCategories, users, setUsers, loadUsers, user, isAdmin, route, onSettings, onLogout, onHome }) {
  const [tab, setTab] = useState("categories");
  const [editingCategory, setEditingCategory] = useState(null);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => { if (tab === "users") loadUsers(); }, [tab]);

  const upsertCategory = (cat) => {
    setCategories((prev) => {
      const exists = prev.some((c) => c.id === cat.id);
      return exists ? prev.map((c) => (c.id === cat.id ? cat : c)) : [...prev, cat];
    });
  };
  const deleteCategory = (id) => {
    if (!confirm("Delete this category?")) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const saveUser = (data, existingUser) => {
    const payload = {
      name: data.name,
      email: data.email,
      is_admin: data.isAdmin,
      permissions: data.isAdmin ? null : data.perms,
    };
    const req = existingUser
      ? api.put(`/api/users/${existingUser.id}`, payload)
      : api.post('/api/users', payload);
    req.then((r) => r.json()).then(() => loadUsers());
  };

  const deleteUser = (u) => {
    if (!confirm(`Remove ${u.email}?`)) return;
    api.del(`/api/users/${u.id}`).then(() => loadUsers());
  };

  return (
    <div>
      <div className="mb-2">
        <button
          onClick={onHome}
          className="inline-flex items-center gap-1.5 text-xs tdc-mono uppercase tracking-[0.2em] transition"
          style={{ color: BRAND.colors.secondary }}
          onMouseEnter={(e) => (e.currentTarget.style.color = BRAND.colors.primary)}
          onMouseLeave={(e) => (e.currentTarget.style.color = BRAND.colors.secondary)}
        >
          <ChevronLeft size={14} /> Back to reporting
        </button>
      </div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="tdc-display text-3xl" style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>
          <span className="tdc-display-italic font-medium" style={{ color: BRAND.colors.secondary }}>
            The
          </span>{" "}
          settings
        </h2>
        <UserMenu
          user={user}
          isAdmin={isAdmin}
          onSettings={onSettings}
          onLogout={onLogout}
          settingsActive={route === "settings"}
        />
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <TabButton active={tab === "categories"} onClick={() => setTab("categories")}>Reports</TabButton>
          <TabButton active={tab === "users"} onClick={() => setTab("users")}>Users</TabButton>
        </div>
        {tab === "categories" ? (
          <PrimaryButton onClick={() => setCreatingCategory(true)}>
            <Plus size={16} /> New category
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => setCreatingUser(true)}>
            <Plus size={16} /> Invite user
          </PrimaryButton>
        )}
      </div>

      {tab === "categories" && (
        <>
          <PanelList>
            {categories.map((c, i) => {
              const Icon = resolveIcon(c.icon);
              return (
                <Row key={c.id} first={i === 0}>
                  <div className="flex min-w-0 items-center gap-3">
                    <RowIcon><Icon size={16} strokeWidth={1.75} /></RowIcon>
                    <div className="min-w-0">
                      <div className="tdc-display truncate text-sm" style={{ fontWeight: 700 }}>
                        {c.title}
                      </div>
                      <div className="tdc-mono truncate text-xs" style={{ color: BRAND.colors.textDim }}>
                        {c.url || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <GhostButton onClick={() => setEditingCategory(c)}>
                      <Pencil size={14} /> Edit
                    </GhostButton>
                    <GhostButton onClick={() => deleteCategory(c.id)} danger>
                      <Trash2 size={14} />
                    </GhostButton>
                  </div>
                </Row>
              );
            })}
          </PanelList>
        </>
      )}

      {tab === "users" && (
        <>
          <PanelList>
            {users.map((u, i) => (
              <Row key={u.email} first={i === 0}>
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar email={u.email} name={u.name} size={32} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{u.name}</span>
                      {u.is_admin && (
                        <span
                          className="tdc-mono rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em]"
                          style={{ background: BRAND.colors.primary, color: BRAND.colors.bg }}
                        >
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="tdc-mono truncate text-xs" style={{ color: BRAND.colors.textDim }}>
                      {u.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tdc-mono hidden text-[11px] sm:inline" style={{ color: BRAND.colors.textMuted }}>
                    {u.is_admin || false
                      ? "All reports"
                      : `${(u.permissions || []).length} / ${categories.length} reports`}
                  </span>
                  <GhostButton onClick={() => setEditingUser(u)}>
                    <Pencil size={14} /> Edit
                  </GhostButton>
                  <GhostButton onClick={() => deleteUser(u)} danger>
                    <Trash2 size={14} />
                  </GhostButton>
                </div>
              </Row>
            ))}
          </PanelList>
        </>
      )}

      {(editingCategory || creatingCategory) && (
        <CategoryEditor
          category={editingCategory}
          existingIds={new Set(categories.map((c) => c.id))}
          onClose={() => { setEditingCategory(null); setCreatingCategory(false); }}
          onSave={(cat) => { upsertCategory(cat); setEditingCategory(null); setCreatingCategory(false); }}
        />
      )}

      {(editingUser || creatingUser) && (
        <UserEditor
          user={editingUser}
          users={users}
          categories={categories}
          onClose={() => { setEditingUser(null); setCreatingUser(false); }}
          onSave={(data) => { saveUser(data, editingUser); setEditingUser(null); setCreatingUser(false); }}
        />
      )}
    </div>
  );
}

function PanelList({ children }) {
  return (
    <div
      style={{
        background: BRAND.colors.surface,
        border: `1px solid ${BRAND.colors.border}`,
        borderRadius: BRAND.radius.lg,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

function Row({ children, first }) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3"
      style={{ borderTop: first ? "none" : `1px solid ${BRAND.colors.border}` }}
    >
      {children}
    </div>
  );
}

function RowIcon({ children }) {
  return (
    <div
      className="grid place-items-center"
      style={{
        width: 32, height: 32,
        background: BRAND.colors.primary,
        color: BRAND.colors.bg,
        borderRadius: BRAND.radius.sm,
      }}
    >
      {children}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 text-sm transition"
      style={{
        background: active ? BRAND.colors.primary : "transparent",
        color: active ? BRAND.colors.bg : BRAND.colors.ink,
        border: `1px solid ${active ? BRAND.colors.primary : BRAND.colors.border}`,
        borderRadius: BRAND.radius.sm,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children, type = "button", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition"
      style={{
        background: BRAND.colors.primary,
        color: BRAND.colors.bg,
        borderRadius: BRAND.radius.sm,
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = BRAND.colors.primaryHover; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = BRAND.colors.primary; }}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children, danger, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition"
      style={{
        background: "transparent",
        color: BRAND.colors.ink,
        border: `1px solid ${BRAND.colors.border}`,
        borderRadius: BRAND.radius.sm,
        fontWeight: 500,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.colors.surfaceAlt)}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {children}
    </button>
  );
}

/* ============================================================
   CATEGORY EDITOR
   ============================================================ */
function CategoryEditor({ category, existingIds, onClose, onSave }) {
  const isEdit = !!category;
  const [title, setTitle] = useState(category?.title ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [url, setUrl] = useState(category?.url ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "FileBarChart");
  const [critical, setCritical] = useState(!!category?.critical);

  const submit = (e) => {
    e.preventDefault();
    let id = category?.id;
    if (!id) {
      const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      id = base || `cat-${Date.now().toString(36)}`;
      let n = 1;
      while (existingIds.has(id)) id = `${base}-${n++}`;
    }
    onSave({
      id,
      title: title.trim(),
      description: description.trim() || "—",
      url: url.trim() || "#",
      icon,
      critical: critical || undefined,
    });
  };

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit category" : "New category"}>
      <form onSubmit={submit}>
        <Field label="Title">
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle()} placeholder="Legal & Risk" required
          />
        </Field>
        <Field label="Description">
          <input
            value={description} onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none"
            style={inputStyle()} placeholder="One-line description"
          />
        </Field>
        <Field label="URL">
          <input
            value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none tdc-mono"
            style={inputStyle()} placeholder="https://looker.tdc.io/dashboards/123"
          />
        </Field>
        <Field label="Icon">
          <IconPicker value={icon} onChange={setIcon} />
        </Field>
        <label className="mb-2 mt-3 flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox" checked={critical}
            onChange={(e) => setCritical(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
            style={{ accentColor: BRAND.colors.primary }}
          />
          Mark as critical
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit">
            <Check size={16} /> {isEdit ? "Save" : "Create"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   USER EDITOR — invite + edit. Per-user category permissions.
   ============================================================ */
function UserEditor({ user, users, categories, onClose, onSave }) {
  const isEdit = !!user;
  const originalEmail = user?.email;
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [isAdmin, setIsAdmin] = useState(!!user?.is_admin);
  const [perms, setPerms] = useState(() => {
    if (!user) return [];
    if (false) return categories.map((c) => c.id);
    return user.permissions ?? [];
  });
  const [error, setError] = useState("");

  const togglePerm = (id) => {
    setPerms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };
  const selectAll = () => setPerms(categories.map((c) => c.id));
  const clearAll = () => setPerms([]);

  const submit = (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !name.trim()) { setError("Name and email are required."); return; }
    const clash = users.find((u) => u.email.toLowerCase() === trimmedEmail && u.email !== originalEmail);
    if (clash) { setError("That email is already in use."); return; }
    onSave({
      email: trimmedEmail,
      name: name.trim(),
      isAdmin,
      perms,
    });
  };

  return (
    <Modal onClose={onClose} title={isEdit ? "Edit user" : "Invite user"} wide>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm outline-none"
              style={inputStyle()} placeholder="Sam Sales" required
            />
          </Field>
          <Field label="Email">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm outline-none tdc-mono"
              style={inputStyle()} placeholder="sam@despatchcompany.com" required
            />
          </Field>
        </div>

        <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm">
          <input
            type="checkbox" checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 cursor-pointer"
            style={{ accentColor: BRAND.colors.primary }}
          />
          Administrator <span style={{ color: BRAND.colors.textMuted }}>— full access, can manage users and reports</span>
        </label>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="tdc-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: BRAND.colors.secondary }}>
              Report access
            </span>
            <div className="flex gap-2">
              <button
                type="button" onClick={selectAll}
                className="tdc-mono text-[10px] uppercase tracking-[0.15em] underline-offset-2 hover:underline"
                style={{ color: BRAND.colors.secondary }}
                disabled={isAdmin}
              >
                Select all
              </button>
              <span style={{ color: BRAND.colors.textDim }}>·</span>
              <button
                type="button" onClick={clearAll}
                className="tdc-mono text-[10px] uppercase tracking-[0.15em] underline-offset-2 hover:underline"
                style={{ color: BRAND.colors.secondary }}
                disabled={isAdmin}
              >
                Clear
              </button>
            </div>
          </div>

          <div
            className="grid grid-cols-1 gap-1.5 p-2 sm:grid-cols-2"
            style={{
              background: BRAND.colors.bg,
              border: `1px solid ${BRAND.colors.border}`,
              borderRadius: BRAND.radius.sm,
              opacity: isAdmin ? 0.5 : 1,
              pointerEvents: isAdmin ? "none" : "auto",
            }}
          >
            {categories.map((c) => {
              const Icon = resolveIcon(c.icon);
              const on = isAdmin || perms.includes(c.id);
              return (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2 text-sm transition"
                  style={{
                    background: on ? `${BRAND.colors.primary}10` : "transparent",
                    borderRadius: BRAND.radius.sm,
                  }}
                  onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = BRAND.colors.surfaceAlt; }}
                  onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}
                >
                  <input
                    type="checkbox" checked={on}
                    onChange={() => togglePerm(c.id)}
                    className="h-4 w-4 cursor-pointer"
                    style={{ accentColor: BRAND.colors.primary }}
                  />
                  <Icon size={14} strokeWidth={1.75} style={{ color: on ? BRAND.colors.primary : BRAND.colors.secondary }} />
                  <span className="truncate">{c.title}</span>
                </label>
              );
            })}
          </div>
          {isAdmin && (
            <p className="mt-2 text-xs" style={{ color: BRAND.colors.textMuted }}>
              Admins always have access to every report.
            </p>
          )}
        </div>

        {error && (
          <div
            className="mt-4 rounded-lg px-3 py-2 text-sm"
            style={{ background: BRAND.colors.surfaceAlt, border: `1px solid ${BRAND.colors.borderStrong}` }}
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <PrimaryButton type="submit">
            <Check size={16} /> {isEdit ? "Save" : "Send invite"}
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

/* ============================================================
   ICON PICKER
   ============================================================ */
function IconPicker({ value, onChange }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const Selected = resolveIcon(value);

  const filtered = useMemo(
    () => ICON_PICKER_NAMES.filter((n) => n.toLowerCase().includes(q.toLowerCase())),
    [q],
  );

  return (
    <div className="relative">
      <button
        type="button" onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm"
        style={inputStyle()}
      >
        <span className="flex items-center gap-2">
          <Selected size={18} style={{ color: BRAND.colors.primary }} strokeWidth={1.75} />
          <span className="tdc-mono">{value}</span>
        </span>
        <ChevronDown size={16} style={{ color: BRAND.colors.secondary }} />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-full p-3"
          style={{
            background: BRAND.colors.surface,
            border: `1px solid ${BRAND.colors.borderStrong}`,
            borderRadius: BRAND.radius.md,
            boxShadow: `0 20px 60px ${BRAND.colors.primary}1F`,
          }}
        >
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.colors.secondary }} />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search icons"
              className="w-full py-2 pl-8 pr-3 text-sm outline-none"
              style={inputStyle()}
            />
          </div>
          <div className="tdc-scroll grid max-h-64 grid-cols-8 gap-1 overflow-y-auto pr-1">
            {filtered.map((name) => {
              const I = resolveIcon(name);
              const active = name === value;
              return (
                <button
                  key={name} type="button" title={name}
                  onClick={() => { onChange(name); setOpen(false); }}
                  className="grid aspect-square place-items-center transition"
                  style={{
                    background: active ? BRAND.colors.primary : "transparent",
                    border: `1px solid ${active ? BRAND.colors.primary : "transparent"}`,
                    color: active ? BRAND.colors.bg : BRAND.colors.ink,
                    borderRadius: BRAND.radius.sm,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = BRAND.colors.surfaceAlt; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <I size={16} strokeWidth={1.75} />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-8 py-6 text-center text-xs" style={{ color: BRAND.colors.textDim }}>
                No icons match "{q}".
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MODAL
   ============================================================ */
function Modal({ onClose, title, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4" style={{ background: "#1A171066" }}>
      <div
        className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}
        style={{
          background: BRAND.colors.surface,
          border: `1px solid ${BRAND.colors.borderStrong}`,
          borderRadius: BRAND.radius.lg,
          boxShadow: `0 24px 60px #1A171033`,
        }}
      >
        <div className="flex items-center justify-between p-5" style={{ borderBottom: `1px solid ${BRAND.colors.border}` }}>
          <h3 className="tdc-display text-xl" style={{ fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded p-1" style={{ color: BRAND.colors.secondary }}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   DEV USER SWITCHER — admin only. Preview as any user.
   ============================================================ */
function DevUserSwitcher({ users, loadUsers, currentEmail, actualEmail, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open && (
        <div
          className="mb-2 w-64 overflow-hidden"
          style={{
            background: BRAND.colors.surface,
            border: `1px solid ${BRAND.colors.borderStrong}`,
            borderRadius: BRAND.radius.md,
            boxShadow: `0 20px 60px #1A171033`,
          }}
        >
          <div
            className="px-3 py-2 tdc-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: BRAND.colors.secondary, borderBottom: `1px solid ${BRAND.colors.border}` }}
          >
            Preview as user
          </div>
          <div className="tdc-scroll max-h-72 overflow-y-auto">
            {users.map((u) => {
              const active = u.email === currentEmail;
              return (
                <button
                  key={u.email}
                  onClick={() => { onChange(u); setOpen(false); }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm"
                  style={{
                    background: active ? BRAND.colors.primary : "transparent",
                    color: active ? BRAND.colors.bg : BRAND.colors.ink,
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = BRAND.colors.surfaceAlt; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{u.name}</div>
                    <div
                      className="tdc-mono truncate text-[10px]"
                      style={{ color: active ? `${BRAND.colors.bg}CC` : BRAND.colors.textMuted }}
                    >
                      {u.email}
                    </div>
                  </div>
                  {u.email === actualEmail && (
                    <span
                      className="tdc-mono shrink-0 text-[10px]"
                      style={{ color: active ? BRAND.colors.bg : BRAND.colors.textMuted }}
                    >
                      you
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 text-xs tdc-mono uppercase tracking-[0.2em]"
        style={{
          background: BRAND.colors.surface,
          border: `1px solid ${BRAND.colors.borderStrong}`,
          color: BRAND.colors.ink,
          borderRadius: BRAND.radius.sm,
          boxShadow: `0 4px 12px #1A171022`,
        }}
      >
        <Cog size={14} style={{ color: BRAND.colors.primary }} />
        Preview
      </button>
    </div>
  );
}
