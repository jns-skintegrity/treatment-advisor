export type ToolUsageEvent = 'started' | 'completed';

export async function recordToolUsage(
  event: ToolUsageEvent,
  category?: 'urgent_review' | 'dressing_guidance' | 'clinical_review' | 'no_guidance'
) {
  const response = await fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    keepalive: true,
    body: JSON.stringify({ event, category }),
  });

  if (!response.ok) {
    throw new Error(`Usage event was rejected (${response.status}).`);
  }
}
