export function padNumber(value, width) {
  return String(value).padStart(width, "0");
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomPick(items) {
  if (!items || items.length === 0) {
    return undefined;
  }
  return items[randomInt(0, items.length - 1)];
}

export function shuffleCopy(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i);
    const tmp = clone[i];
    clone[i] = clone[j];
    clone[j] = tmp;
  }
  return clone;
}

export function toBooleanEnv(value, fallback = false) {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
}

export function buildSeededUserEmail(index) {
  return `volume-user-${padNumber(index, 6)}@test.local`;
}

export function buildSeededAdminEmail(index = 1) {
  return `volume-admin-${padNumber(index, 4)}@test.local`;
}

export function uniqueName(prefix) {
  const vu = typeof __VU === "number" ? __VU : 0;
  const iter = typeof __ITER === "number" ? __ITER : 0;
  return `${prefix}-${vu}-${iter}-${Date.now()}-${randomInt(1000, 9999)}`;
}
