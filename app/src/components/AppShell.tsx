import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarHeart,
  FileText,
  LayoutDashboard,
  PieChart,
  Receipt,
  Settings,
  TrendingDown,
  UserCog,
  Users,
  UserSquare2,
} from "lucide-react";
import { type ReactNode } from "react";
import { API_BASE } from "@/api/client";
import { useBrand } from "@/hooks/useBrand";
import { logout, type AuthUser } from "@/lib/auth-functions";
import { setToken } from "@/lib/session";
import { currentSemester } from "@/lib/semester";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import type {
  DashboardLinkComponent,
  DashboardNavGroup,
  DashboardNavItem,
} from "@/components/dashboard/types";

type Item = { to: string; label: string; icon: typeof LayoutDashboard };

const adminNav: Item[] = [
  { to: "/beranda", label: "Dashboard", icon: LayoutDashboard },
  { to: "/siswa", label: "Siswa", icon: Users },
  { to: "/orang-tua", label: "Orang Tua", icon: UserSquare2 },
  { to: "/tagihan", label: "Tagihan", icon: FileText },
  { to: "/event", label: "Event", icon: CalendarHeart },
  { to: "/pembayaran", label: "Pembayaran", icon: Receipt },
  { to: "/pengeluaran", label: "Pengeluaran", icon: TrendingDown },
  { to: "/laporan", label: "Laporan", icon: PieChart },
  { to: "/pengaturan", label: "Pengaturan", icon: Settings },
];

const superadminNav: Item[] = [...adminNav, { to: "/pengguna", label: "Pengguna", icon: UserCog }];

const parentNav: Item[] = [
  { to: "/beranda", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pembayaran", label: "Riwayat", icon: Receipt },
];

const dialogLabel: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Admin",
  parent: "Orang Tua",
};

const RouterDashboardLink: DashboardLinkComponent = ({
  href,
  target,
  title,
  className,
  onClick,
  children,
}) => (
  <Link to={href ?? "#"} target={target} title={title} className={className} onClick={onClick}>
    {children}
  </Link>
);

export function AppShell({
  role,
  title,
  description,
  breadcrumb,
  actions,
  user,
  children,
}: {
  role: "superadmin" | "admin" | "parent";
  title?: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  user?: AuthUser | null;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = role === "parent" ? parentNav : role === "superadmin" ? superadminNav : adminNav;
  const semester = currentSemester();
  const { logoUrl, faviconUrl } = useBrand(API_BASE);

  const activeFor = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navGroups: DashboardNavGroup[] = [
    {
      label: "Menu Utama",
      items: items.map<DashboardNavItem>((item) => ({
        key: item.to,
        label: item.label,
        icon: item.icon,
        href: item.to,
        active: activeFor(item.to),
      })),
    },
  ];

  const signOut = async () => {
    await logout().catch(() => {});
    setToken(null);
    void navigate({ to: "/auth" });
  };

  const brandSubtitle =
    role === "superadmin"
      ? "Superadmin"
      : role === "admin"
        ? `SPP Admin · ${semester.label}`
        : `Portal Wali · ${semester.label}`;

  return (
    <DashboardShell
      brand={{
        name: "PTDARRAHMAN",
        subtitle: brandSubtitle,
        faviconUrl: faviconUrl || logoUrl || "/logo.png",
        logoUrl: faviconUrl || logoUrl || "/logo.png",
      }}
      navGroups={navGroups}
      renderLink={RouterDashboardLink}
      onNavigate={(item) => {
        if (item.href) void navigate({ to: item.href });
      }}
      apiBase={API_BASE}
      storageKey="ppdb_collapsed"
      roleLabel={dialogLabel[role] ?? role}
      breadcrumb={breadcrumb}
      user={{
        fullName: user?.full_name,
        username: user?.username,
        email: user?.email ?? undefined,
        avatarUrl: undefined,
        role: dialogLabel[role] ?? role,
      }}
      onProfile={() => void navigate({ to: "/profil" })}
      onLogout={signOut}
      showViewSite={false}
      contentClassName="animate-fade-in"
      headerRight={actions ? <div className="flex items-center gap-2">{actions}</div> : undefined}
    >
      {children}
    </DashboardShell>
  );
}
