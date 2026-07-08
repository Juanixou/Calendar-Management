import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { resetLocalDatabase } from "@gestion-clases/core";
import { BarChart3, CalendarDays, GraduationCap, LayoutDashboard, LogOut, Menu, RefreshCw, Shield, StickyNote, User, X } from "lucide-react";
import { cn } from "../../lib/cn";
import { auth } from "../../lib/firebase";
import { IS_DEMO } from "../../lib/appMode";
import { useAuthContext } from "../auth/AuthGate";
import { TimezoneClock } from "./TimezoneClock";

const NAV_ITEMS = [
  { to: "/", label: "Hoy", icon: LayoutDashboard, end: true },
  { to: "/calendario", label: "Calendario", icon: CalendarDays, end: false },
  { to: "/alumnos", label: "Alumnos", icon: GraduationCap, end: false },
  { to: "/resumen", label: "Resumen", icon: BarChart3, end: false },
  { to: "/notas", label: "Notas", icon: StickyNote, end: false },
  { to: "/perfil", label: "Perfil", icon: User, end: false },
];

const ADMIN_NAV_ITEM = { to: "/usuarios", label: "Profesores", icon: Shield, end: false };

export function Layout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white print:hidden lg:flex lg:flex-col">
        <SidebarContent />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 print:hidden lg:hidden">
          <span className="text-base font-semibold text-slate-800">Clases ELE</span>
          <button
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {mobileNavOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileNavOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
              <div className="flex justify-end p-3">
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role } = useAuthContext();
  const navItems = role === "admin" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="hidden px-2 lg:block">
        <p className="text-lg font-bold text-slate-900">Clases ELE</p>
        <p className="text-xs text-slate-500">Gestión de clases de español</p>
      </div>

      <TimezoneClock />

      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100",
                isActive && "bg-brand-50 text-brand-700",
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 border-t border-slate-100 pt-3">
        <p className="truncate px-3 text-xs text-slate-400">{user.email}</p>
        {IS_DEMO ? (
          <button
            onClick={() => resetLocalDatabase().then(() => window.location.reload())}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <RefreshCw className="h-4 w-4" />
            Reiniciar demo
          </button>
        ) : (
          <button
            onClick={() => signOut(auth)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        )}
      </div>
    </div>
  );
}
