import { useState, type FormEvent } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useAuthContext } from "../auth/AuthGate";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

const MIN_PASSWORD_LENGTH = 6;

export function ChangePasswordCard() {
  const { user } = useAuthContext();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    if (!user.email) {
      setError("Tu cuenta no tiene email asociado; no se puede cambiar la contraseña desde aquí.");
      return;
    }

    setSubmitting(true);
    try {
      // Firebase requires a recent login for this operation; re-authenticating with the current
      // password both satisfies that and confirms it's really the account owner making the change.
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("La contraseña actual no es correcta.");
      } else if (code === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera unos minutos y vuelve a intentarlo.");
      } else {
        setError("No se pudo cambiar la contraseña. Inténtalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="current-password">Contraseña actual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm-password">Repite la nueva contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex items-center justify-end gap-3 pt-2">
            {success ? <span className="text-sm text-emerald-600">Contraseña actualizada</span> : null}
            <Button type="submit" disabled={submitting}>
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
