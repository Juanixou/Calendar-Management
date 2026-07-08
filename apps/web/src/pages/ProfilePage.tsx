import { useEffect, useState } from "react";
import { useTeacherProfile, useUpdateTeacherProfile } from "../hooks/useTeacherProfile";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Label } from "../components/ui/Label";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { BackupCard } from "../components/shared/BackupCard";
import { ChangePasswordCard } from "../components/shared/ChangePasswordCard";

export function ProfilePage() {
  const { data: profile, isLoading } = useTeacherProfile();
  const updateProfile = useUpdateTeacherProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pricePerClass, setPricePerClass] = useState(0);
  const [savedJustNow, setSavedJustNow] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setPricePerClass(profile.pricePerClass);
    }
  }, [profile]);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500">
          Estos datos se usan para calcular los ingresos en la sección Resumen.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del profesor</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-500">Cargando...</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateProfile.mutate(
                  { firstName: firstName.trim(), lastName: lastName.trim(), pricePerClass },
                  {
                    onSuccess: () => {
                      setSavedJustNow(true);
                      setTimeout(() => setSavedJustNow(false), 2000);
                    },
                  },
                );
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first-name">Nombre</Label>
                  <Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="last-name">Apellidos</Label>
                  <Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div>
                <Label htmlFor="price-per-class">Precio por clase (1h) en €</Label>
                <Input
                  id="price-per-class"
                  type="number"
                  min={0}
                  step={0.5}
                  value={pricePerClass}
                  onChange={(e) => setPricePerClass(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {savedJustNow ? <span className="text-sm text-emerald-600">Guardado</span> : null}
                <Button type="submit" disabled={updateProfile.isPending}>
                  Guardar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <ChangePasswordCard />

      <BackupCard />
    </div>
  );
}
