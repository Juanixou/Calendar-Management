import type { ClassPackRepository } from "../data/repositories/ClassPackRepository";
import type { ClassSessionRepository } from "../data/repositories/ClassSessionRepository";
import { durationHours, type ClassSession } from "../domain/ClassSession";
import type { ClassPackPurchase } from "../domain/ClassPackPurchase";

export interface PeriodTotals {
  purchased: number;
  consumed: number;
  hoursTaught: number;
  /** Hours cancelled by the teacher this month (already counted within `consumed` and `billableHours`). */
  cancelled: number;
  /**
   * Hours the teacher is owed for: completed classes plus ones the teacher cancelled (which still
   * count as given). Excludes classes still merely "scheduled", since a student can move those to
   * another day before they happen — this is what billing should be based on.
   */
  billableHours: number;
}

export interface MonthlySummary extends PeriodTotals {
  year: number;
  /** 1-12 */
  month: number;
  balanceEnd: number;
}

export interface YearlySummary extends PeriodTotals {
  year: number;
}

export type PackProgressStatus = "completed" | "in_progress" | "not_started";

export interface PackProgress {
  purchase: ClassPackPurchase;
  /** Classes consumed from this specific pack, in purchase order (FIFO). */
  used: number;
  remaining: number;
  status: PackProgressStatus;
}

/** The pack currently "in play": the first one not fully used, or the last one if all are completed. */
export function getCurrentPack(progress: PackProgress[]): PackProgress | undefined {
  return progress.find((p) => p.status !== "completed") ?? progress[progress.length - 1];
}

export interface PackTimelineEntry extends PackProgress {
  /** ISO date of the first class that drew from this pack, if it has been touched at all. */
  activatedAt?: string;
  /** ISO date of the class that used up the last class of this pack, if it's fully used. */
  completedAt?: string;
}

/** Packs whose *completion* (last class used) fell within the given month. */
export function packsCompletedInMonth(timeline: PackTimelineEntry[], year: number, month: number): PackTimelineEntry[] {
  return timeline.filter((entry) => entry.completedAt && isInMonth(entry.completedAt, year, month));
}

/** Packs whose *activation* (first class drawn from them) fell within the given month. */
export function packsActivatedInMonth(timeline: PackTimelineEntry[], year: number, month: number): PackTimelineEntry[] {
  return timeline.filter((entry) => entry.activatedAt && isInMonth(entry.activatedAt, year, month));
}

function isInMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

function isInYear(iso: string, year: number): boolean {
  return new Date(iso).getFullYear() === year;
}

function aggregateSessionHours(sessions: ClassSession[]) {
  const consumed = sessions.reduce((sum, s) => sum + durationHours(s), 0);
  const hoursTaught = sessions.filter((s) => s.status === "completed").reduce((sum, s) => sum + durationHours(s), 0);
  const cancelled = sessions.filter((s) => s.status === "cancelled").reduce((sum, s) => sum + durationHours(s), 0);
  const billableHours = sessions
    .filter((s) => s.status === "completed" || s.status === "cancelled")
    .reduce((sum, s) => sum + durationHours(s), 0);
  return {
    consumed: round2(consumed),
    hoursTaught: round2(hoursTaught),
    cancelled: round2(cancelled),
    billableHours: round2(billableHours),
  };
}

export class MonthlySummaryService {
  constructor(
    private readonly packs: ClassPackRepository,
    private readonly sessions: ClassSessionRepository,
  ) {}

  /** Current balance = total classes purchased - total classes consumed (any session status). */
  async getStudentBalance(studentId: string): Promise<number> {
    const [purchases, sessions] = await Promise.all([
      this.packs.listByStudent(studentId),
      this.sessions.listByStudent(studentId),
    ]);
    const purchased = purchases.reduce((sum, p) => sum + p.classesAmount, 0);
    const consumed = sessions.reduce((sum, s) => sum + durationHours(s), 0);
    return round2(purchased - consumed);
  }

  async getMonthlySummary(studentId: string, year: number, month: number): Promise<MonthlySummary> {
    const [purchases, sessions] = await Promise.all([
      this.packs.listByStudent(studentId),
      this.sessions.listByStudent(studentId),
    ]);

    const purchasesUpToMonth = purchases.filter((p) => isBeforeOrInMonth(p.purchasedAt, year, month));
    const sessionsUpToMonth = sessions.filter((s) => isBeforeOrInMonth(s.start, year, month));

    const purchasedThisMonth = purchases
      .filter((p) => isInMonth(p.purchasedAt, year, month))
      .reduce((sum, p) => sum + p.classesAmount, 0);
    const sessionsThisMonth = sessions.filter((s) => isInMonth(s.start, year, month));

    const purchasedTotal = purchasesUpToMonth.reduce((sum, p) => sum + p.classesAmount, 0);
    const consumedTotal = sessionsUpToMonth.reduce((sum, s) => sum + durationHours(s), 0);
    const balanceEnd = round2(purchasedTotal - consumedTotal);

    return {
      year,
      month,
      purchased: round2(purchasedThisMonth),
      ...aggregateSessionHours(sessionsThisMonth),
      balanceEnd,
    };
  }

  /** Same figures as `getMonthlySummary`, aggregated over the whole calendar year instead of one month. */
  async getYearlySummary(studentId: string, year: number): Promise<YearlySummary> {
    const [purchases, sessions] = await Promise.all([
      this.packs.listByStudent(studentId),
      this.sessions.listByStudent(studentId),
    ]);

    const purchasedThisYear = purchases
      .filter((p) => isInYear(p.purchasedAt, year))
      .reduce((sum, p) => sum + p.classesAmount, 0);
    const sessionsThisYear = sessions.filter((s) => isInYear(s.start, year));

    return {
      year,
      purchased: round2(purchasedThisYear),
      ...aggregateSessionHours(sessionsThisYear),
    };
  }

  /**
   * Attributes consumption to each purchased pack in FIFO order (oldest pack first), so it's
   * possible to see e.g. "7/10" for the pack currently in progress and "10/10" for a finished one.
   * Pass `year`/`month` to see the state as of the end of that month, or omit both to see every
   * pack ever purchased with its up-to-date progress.
   *
   * By default this counts every non-deleted session (scheduled, completed or cancelled) — right
   * for billing, since scheduling a class already commits its seat regardless of outcome. Pass
   * `resolvedOnly: true` to count only sessions that have actually happened (completed or
   * cancelled by the teacher, excluding still-`scheduled` ones) — right for showing a student's
   * real progress through a pack, since teachers routinely schedule further ahead than the
   * current pack covers, trusting the student to renew before those classes are given.
   */
  async getPackProgress(
    studentId: string,
    year?: number,
    month?: number,
    options?: { resolvedOnly?: boolean },
  ): Promise<PackProgress[]> {
    const [purchases, sessions] = await Promise.all([
      this.packs.listByStudent(studentId),
      this.sessions.listByStudent(studentId),
    ]);

    const bounded = year !== undefined && month !== undefined;
    const purchasesUpToMonth = bounded ? purchases.filter((p) => isBeforeOrInMonth(p.purchasedAt, year, month)) : purchases;
    let countedSessions = bounded ? sessions.filter((s) => isBeforeOrInMonth(s.start, year, month)) : sessions;
    if (options?.resolvedOnly) countedSessions = countedSessions.filter((s) => s.status !== "scheduled");

    let remaining = round2(countedSessions.reduce((sum, s) => sum + durationHours(s), 0));

    return purchasesUpToMonth.map((purchase) => {
      const used = round2(Math.min(remaining, purchase.classesAmount));
      remaining = round2(remaining - used);
      const status: PackProgressStatus = used <= 0 ? "not_started" : used >= purchase.classesAmount ? "completed" : "in_progress";
      return { purchase, used, remaining: round2(purchase.classesAmount - used), status };
    });
  }

  /**
   * Like `getPackProgress`, but also walks the classes in chronological order to record the exact
   * date each pack was first touched (`activatedAt`) and the date it got fully used up
   * (`completedAt`), if ever. Always considers full history — filter by month with
   * `packsCompletedInMonth`/`packsActivatedInMonth` to see what happened in a specific month.
   * See `getPackProgress` for what `resolvedOnly` changes.
   */
  async getPackTimeline(studentId: string, options?: { resolvedOnly?: boolean }): Promise<PackTimelineEntry[]> {
    const [purchases, sessions] = await Promise.all([
      this.packs.listByStudent(studentId),
      this.sessions.listByStudent(studentId),
    ]);

    const countedSessions = options?.resolvedOnly ? sessions.filter((s) => s.status !== "scheduled") : sessions;
    const chronologicalSessions = [...countedSessions].sort(
      (a, b) => a.start.localeCompare(b.start) || a.createdAt.localeCompare(b.createdAt),
    );

    const entries = purchases.map((purchase) => ({
      purchase,
      used: 0,
      activatedAt: undefined as string | undefined,
      completedAt: undefined as string | undefined,
    }));

    let packIndex = 0;
    for (const session of chronologicalSessions) {
      let toAllocate = durationHours(session);
      while (toAllocate > 0 && packIndex < entries.length) {
        const entry = entries[packIndex]!;
        const capacity = round2(entry.purchase.classesAmount - entry.used);
        if (capacity <= 0) {
          packIndex++;
          continue;
        }
        const consumedFromThisPack = round2(Math.min(capacity, toAllocate));
        if (entry.used === 0) entry.activatedAt = session.start;
        entry.used = round2(entry.used + consumedFromThisPack);
        toAllocate = round2(toAllocate - consumedFromThisPack);
        if (entry.used >= entry.purchase.classesAmount) {
          entry.completedAt = session.start;
          packIndex++;
        }
      }
    }

    return entries.map((entry) => {
      const status: PackProgressStatus =
        entry.used <= 0 ? "not_started" : entry.used >= entry.purchase.classesAmount ? "completed" : "in_progress";
      return {
        purchase: entry.purchase,
        used: entry.used,
        remaining: round2(entry.purchase.classesAmount - entry.used),
        status,
        activatedAt: entry.activatedAt,
        completedAt: entry.completedAt,
      };
    });
  }
}

function isBeforeOrInMonth(iso: string, year: number, month: number): boolean {
  const d = new Date(iso);
  const endOfMonth = new Date(year, month, 1);
  return d.getTime() < endOfMonth.getTime();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
