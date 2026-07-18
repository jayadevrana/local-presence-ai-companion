export function nowIso() {
  return new Date().toISOString();
}

export function formatTimestampLabel(value: string | number | Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function addSeconds(date: string | Date, seconds: number) {
  const next = new Date(date);
  next.setSeconds(next.getSeconds() + seconds);
  return next.toISOString();
}

export function diffSeconds(from: string | Date, to: string | Date) {
  return Math.max(
    0,
    Math.round((new Date(to).getTime() - new Date(from).getTime()) / 1000),
  );
}

export function isPast(value?: string) {
  if (!value) return false;
  return new Date(value).getTime() <= Date.now();
}
