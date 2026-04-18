import type { Deadline, Session, SessionOutcome, SessionPreparation } from '../../core/models';

function asDate(v: unknown): Date | undefined {
  if (v == null) return undefined;
  if (v instanceof Date) return v;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export function reviveSession(raw: Session): Session {
  return {
    ...raw,
    date: asDate(raw.date) ?? new Date(0),
    nextSessionDate: asDate(raw.nextSessionDate),
  };
}

export function revivePreparation(raw: SessionPreparation): SessionPreparation {
  return {
    ...raw,
    createdAt: asDate(raw.createdAt) ?? new Date(0),
  };
}

export function reviveOutcome(raw: SessionOutcome): SessionOutcome {
  return {
    ...raw,
    nextSessionDate: asDate(raw.nextSessionDate),
    createdAt: asDate(raw.createdAt) ?? new Date(0),
  };
}

export function reviveDeadline(raw: Deadline): Deadline {
  return {
    ...raw,
    dueDate: asDate(raw.dueDate) ?? new Date(0),
    notifiedLevels: Array.isArray(raw.notifiedLevels) ? [...raw.notifiedLevels] : [],
  };
}
