/** Bumped on login so a stale /users/me bootstrap cannot clear a fresh session. */
let bootstrapGeneration = 0;

export function invalidateSessionBootstrap() {
  bootstrapGeneration += 1;
}

export function currentSessionBootstrapGeneration() {
  return bootstrapGeneration;
}
