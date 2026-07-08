import { createFirebaseContainer, createLocalContainer, type Container, type Repositories, type Services } from "@gestion-clases/core";
import { db } from "./firebase";

/**
 * Single wiring point for data access. These start undefined and are only assigned once a
 * teacher is signed in (see `AuthGate`) — every hook that reads `repositories`/`services` only
 * ever runs once the app has rendered past the auth gate, so by the time anything calls into
 * them, `initRepositories` has already run. Reassigning these `let` exports works because ES
 * module bindings are live: importers always see the current value, not a snapshot.
 */
export let repositories: Repositories;
export let services: Services;
export let container: Container;

export function initRepositories(teacherId: string): void {
  container = createFirebaseContainer(db, teacherId);
  repositories = container.repositories;
  services = container.services;
}

/** Demo mode only — local IndexedDB container, no Firebase involved. See `DemoGate`. */
export function initLocalRepositories(): void {
  container = createLocalContainer();
  repositories = container.repositories;
  services = container.services;
}
