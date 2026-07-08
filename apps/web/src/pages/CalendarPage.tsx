import { ClassCalendar } from "../components/calendar/ClassCalendar";

export function CalendarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Calendario</h1>
        <p className="text-sm text-slate-500">
          Arrastra una clase para moverla de día. Haz clic en un hueco vacío para crear una nueva.
        </p>
      </div>
      <ClassCalendar />
    </div>
  );
}
