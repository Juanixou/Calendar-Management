import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth } from "../../lib/firebase";
import { initRepositories } from "../../lib/repositories";
import { ensureUserRole, type UserRole } from "../../lib/userRole";
import { LoginPage } from "../../pages/LoginPage";
import { Button } from "../ui/Button";

export interface AuthContextValue {
  user: User;
  role: UserRole;
}

/** Exported so `DemoGate` (the demo-mode replacement for this component) can provide the same
 * context shape without duplicating `useAuthContext`. */
export const AuthContext = createContext<AuthContextValue | null>(null);

/** Only usable inside <AuthGate>, i.e. anywhere in the app past the login screen. */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthGate>");
  return ctx;
}

/**
 * Renders the login screen until a teacher signs in, then wires up the Firestore repositories
 * for that teacher's uid and renders the app. No public sign-up: accounts are created by hand in
 * the Firebase console, so anyone who can authenticate is already meant to have access.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [role, setRole] = useState<UserRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const previousUid = useRef<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    if (!user) {
      // Wipe any cached queries from the previous session so switching accounts (or logging back
      // in) never briefly shows another teacher's data.
      if (previousUid.current) queryClient.clear();
      previousUid.current = null;
      setRole(null);
      setRoleError(null);
      return;
    }
    let cancelled = false;
    initRepositories(user.uid);
    previousUid.current = user.uid;
    setRoleError(null);
    ensureUserRole(user.uid, user.email)
      .then((fetchedRole) => {
        if (!cancelled) setRole(fetchedRole);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[AuthGate] No se pudo leer/crear el rol del usuario:", error);
        setRoleError(
          "No se han podido cargar los permisos de tu cuenta. Lo más probable es que las reglas " +
            "de seguridad de Firestore no estén publicadas todavía (ver docs/firebase-setup.md).",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [user, queryClient]);

  if (user === undefined) {
    return <FullScreenMessage>Cargando...</FullScreenMessage>;
  }
  if (user === null) {
    return <LoginPage />;
  }
  if (roleError) {
    return (
      <FullScreenMessage>
        <div className="max-w-sm space-y-4 text-center">
          <p className="text-sm text-red-600">{roleError}</p>
          <Button variant="secondary" size="sm" onClick={() => signOut(auth)}>
            Cerrar sesión
          </Button>
        </div>
      </FullScreenMessage>
    );
  }
  if (!role) {
    return <FullScreenMessage>Cargando...</FullScreenMessage>;
  }

  return <AuthContext.Provider value={{ user, role }}>{children}</AuthContext.Provider>;
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen items-center justify-center px-4 text-sm text-slate-500">{children}</div>;
}
