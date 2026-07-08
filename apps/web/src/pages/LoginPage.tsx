import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError("Email o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Clases ELE</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión para gestionar tus clases.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
