export function statusToBadgeClass(status) {
  const s = (status || '').toLowerCase().replace(/\s+/g, '');

  // Orange (Pending/Wait)
  if (
    ['open', 'pending', 'awaitingcommitmentfee', 'awaitingpayment', 'unpaid', 'awaiting'].includes(
      s
    )
  )
    return 'pending';

  // Blue (Active/Info)
  if (['applied', 'current', 'inprogress', 'ongoing', 'submitted', 'held', 'onhold'].includes(s))
    return 'applied';

  // Green (Success)
  if (['done', 'completed', 'accepted', 'confirmed', 'refunded'].includes(s)) return 'done';

  // Red (Error/Stop)
  if (['rejected', 'failed', 'cancelled'].includes(s)) return 'cancelled';

  return 'pending';
}
