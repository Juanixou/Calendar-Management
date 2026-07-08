import { createFirebaseContainer, type Container } from "@gestion-clases/core";
import { db } from "./firebase";
import { IS_DEMO } from "./appMode";
import { container as localContainer } from "./repositories";

const containerCache = new Map<string, Container>();

/**
 * Admin-only: a container scoped to a teacherId that is NOT the current session's teacher. Kept
 * entirely separate from the global `repositories`/`services` in `./repositories.ts` so viewing
 * another teacher's data never risks swapping the logged-in teacher's own session.
 *
 * In demo mode there is only ever one (fake) teacher, so this just returns the same local
 * container `DemoGate` already initialized — `localContainer` is a live binding, so it always
 * reflects the current value even though it's read before `initLocalRepositories()` runs.
 */
export function getAdminContainer(teacherId: string): Container {
  if (IS_DEMO) return localContainer;

  let container = containerCache.get(teacherId);
  if (!container) {
    container = createFirebaseContainer(db, teacherId);
    containerCache.set(teacherId, container);
  }
  return container;
}
