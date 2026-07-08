import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import type { Student } from "@gestion-clases/core";
import { useStudentBalances } from "../../hooks/useMonthlySummary";
import { LOW_BALANCE_THRESHOLD } from "./BalanceBadge";
import { Card } from "../ui/Card";

export function LowBalanceAlert({ students }: { students: Student[] }) {
  const balances = useStudentBalances(students.filter((s) => s.active));
  const lowBalance = balances.filter(
    (entry): entry is { student: Student; balance: number } =>
      entry.balance !== undefined && entry.balance <= LOW_BALANCE_THRESHOLD,
  );

  if (lowBalance.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-medium text-amber-900">
            {lowBalance.length === 1 ? "Un alumno se está quedando" : `${lowBalance.length} alumnos se están quedando`}{" "}
            sin clases del bono
          </p>
          <p className="mt-1 flex flex-wrap gap-x-1 text-sm text-amber-800">
            {lowBalance.map(({ student, balance }, index) => (
              <span key={student.id}>
                <Link to={`/alumnos/${student.id}`} className="font-medium underline hover:no-underline">
                  {student.name}
                </Link>{" "}
                ({balance <= 0 ? "sin clases" : balance === 1 ? "1 clase" : `${balance} clases`})
                {index < lowBalance.length - 1 ? "," : ""}
              </span>
            ))}
          </p>
        </div>
      </div>
    </Card>
  );
}
