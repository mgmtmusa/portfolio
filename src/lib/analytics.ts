// Analytics events carry only these properties, never anything a visitor typed.
export type EventProps = { slug?: string; from?: string; key?: string };
const ALLOWED = ['slug', 'from', 'key'] as const;

export function safeProps(props: Record<string, unknown>): EventProps {
  const out: EventProps = {};
  for (const k of ALLOWED) if (props[k] !== undefined && props[k] !== '') out[k] = String(props[k]).slice(0, 64);
  return out;
}
