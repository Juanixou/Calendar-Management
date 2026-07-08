import { useState } from "react";
import { Dialog, DialogContent } from "../ui/Dialog";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

export function AddClassPackDialog({
  open,
  onOpenChange,
  onCreate,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { classesAmount: number; purchasedAt: string; note?: string }) => void;
  submitting: boolean;
}) {
  const [classesAmount, setClassesAmount] = useState(4);
  const [purchasedAt, setPurchasedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Nuevo bono de clases">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({
              classesAmount,
              purchasedAt: new Date(`${purchasedAt}T12:00:00`).toISOString(),
              note: note.trim() || undefined,
            });
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="classes-amount">Número de clases (1h cada una)</Label>
            <Input
              id="classes-amount"
              type="number"
              min={1}
              step={1}
              value={classesAmount}
              onChange={(e) => setClassesAmount(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label htmlFor="purchased-at">Fecha de compra</Label>
            <Input
              id="purchased-at"
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="pack-note">Nota (opcional)</Label>
            <Input id="pack-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Añadir bono
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
