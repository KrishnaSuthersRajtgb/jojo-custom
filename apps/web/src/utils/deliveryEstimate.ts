export function getEstimatedDeliveryDays(garmentId: string): number {
  const schedule: Record<string, number> = {
    blouse: 7,
    chudidhar: 10,
    frocks: 10,
    lehanga: 14,
    'ready-to-wear-saree': 12,
    pant: 7,
    'over-coat': 14,
  };
  const key = garmentId ? garmentId.toLowerCase().trim() : '';
  return schedule[key] ?? 10;
}

export function getEstimatedDeliveryDate(garmentId: string): Date {
  const days = getEstimatedDeliveryDays(garmentId);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export function formatDeliveryDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
