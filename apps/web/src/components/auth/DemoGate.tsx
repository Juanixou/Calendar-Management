import { useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { AuthContext, type AuthContextValue } from "./AuthGate";
import { initLocalRepositories } from "../../lib/repositories";
import { seedDemoData } from "../../lib/seedDemoData";

// Never used to call real Firebase Auth methods — demo mode only reads `user.uid`/`user.email`.
const DEMO_USER = { uid: "demo-teacher", email: "demo@ejemplo.com" } as unknown as User;

// Role "admin" so the demo also showcases the teacher-management panel, not just the daily view.
const DEMO_AUTH_VALUE: AuthContextValue = { user: DEMO_USER, role: "admin" };

/**
 * Demo-mode replacement for <AuthGate>: no login, no Firebase — wires up a local IndexedDB
 * container (already wiped by the VITE_RESET_DB check in main.tsx) with sample data, then renders
 * the app as if a demo teacher/admin were already signed in.
 */
export function DemoGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    initLocalRepositories();
    seedDemoData().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-sm text-slate-500">
        Cargando demo...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={DEMO_AUTH_VALUE}>
      <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
        Modo demostración — datos de prueba, se reinician al recargar la página
      </div>
      {children}
    </AuthContext.Provider>
  );
}
