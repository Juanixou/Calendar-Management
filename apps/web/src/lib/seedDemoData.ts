import type { ClassSessionStatus } from "@gestion-clases/core";
import { repositories, services } from "./repositories";

function atOffset(days: number, hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function slot(start: Date) {
  return { start: start.toISOString(), end: new Date(start.getTime() + 3_600_000).toISOString() };
}

/** Populates the freshly-reset local database with a believable set of students, bonos and clases
 * so the public demo looks alive from the first second, instead of an empty app. */
export async function seedDemoData(): Promise<void> {
  await repositories.teacherProfile.save({ firstName: "Profesora", lastName: "Demo", pricePerClass: 15 });

  const liWei = await repositories.students.create({
    name: "Li Wei",
    level: "B1",
    timezone: "Asia/Shanghai",
    notes: "Prefiere practicar conversación sobre viajes.",
  });
  const zhangMei = await repositories.students.create({
    name: "Zhang Mei",
    level: "A2",
    timezone: "Asia/Shanghai",
  });
  await repositories.students.create({
    name: "Chen Yu",
    level: "B2",
    timezone: "Asia/Chongqing",
    active: false,
  });

  await repositories.classPacks.create({
    studentId: liWei.id,
    classesAmount: 10,
    purchasedAt: atOffset(-24, 12).toISOString(),
  });
  await repositories.classPacks.create({
    studentId: zhangMei.id,
    classesAmount: 8,
    purchasedAt: atOffset(-10, 12).toISOString(),
  });

  async function schedule(studentId: string, when: Date, resolve?: Extract<ClassSessionStatus, "completed" | "cancelled">) {
    const session = await services.scheduling.scheduleClass({ studentId, ...slot(when) });
    if (resolve === "completed") await services.scheduling.completeClass(session.id);
    if (resolve === "cancelled") await services.scheduling.cancelClass(session.id);
  }

  // Li Wei: history + upcoming classes
  await schedule(liWei.id, atOffset(-20, 15), "completed");
  await schedule(liWei.id, atOffset(-13, 15), "completed");
  await schedule(liWei.id, atOffset(-6, 15), "completed");
  await schedule(liWei.id, atOffset(-3, 15), "cancelled");
  await schedule(liWei.id, atOffset(4, 15));
  await schedule(liWei.id, atOffset(11, 15));

  // Zhang Mei: history + upcoming classes
  await schedule(zhangMei.id, atOffset(-15, 18), "completed");
  await schedule(zhangMei.id, atOffset(-8, 18), "completed");
  await schedule(zhangMei.id, atOffset(2, 18));
  await schedule(zhangMei.id, atOffset(9, 18));

  // A group class with both active students, to showcase group scheduling too
  const groupId = crypto.randomUUID();
  const groupSlot = slot(atOffset(6, 17));
  await services.scheduling.scheduleClass({ studentId: liWei.id, ...groupSlot, type: "group", groupId });
  await services.scheduling.scheduleClass({ studentId: zhangMei.id, ...groupSlot, type: "group", groupId });

  await repositories.notes.create({
    text: "Preguntar a Li Wei cómo le fue el examen HSK.",
    studentId: liWei.id,
  });
  await repositories.notes.create({
    text: "Recordar traer material extra de gramática para nivel A2.",
  });
}
