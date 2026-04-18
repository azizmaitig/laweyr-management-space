import type { AgendaItem, Reminder, ReminderMethod, AgendaItemType } from '../../../core/models/agenda-item.model';

/**
 * Mock agenda items for development.
 * Replace with API calls in production.
 */
export const MOCK_AGENDA_ITEMS: AgendaItem[] = [
  // Sessions
  {
    id: 1,
    caseId: 101,
    type: 'SESSION',
    title: 'Audience — Affaire Dupont c. Martin',
    description: 'Plaidoirie finale sur le fond du litige commercial.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 9, 30),
    status: 'UPCOMING',
    priority: 'HIGH',
    location: 'Tribunal de Nabeul, Salle 3',
  },
  {
    id: 2,
    caseId: 102,
    type: 'SESSION',
    title: 'Audience — Succession Ben Ali',
    description: 'Examen des pièces successorales.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 14, 0),
    status: 'UPCOMING',
    priority: 'MEDIUM',
    location: 'Tribunal de Tunis',
  },
  {
    id: 3,
    caseId: 103,
    type: 'SESSION',
    title: 'Règlement de compte — SARL El Amel',
    description: 'Audience de conciliation.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 5, 10, 0),
    status: 'UPCOMING',
    priority: 'LOW',
    location: 'Tribunal de Hammamet',
  },
  {
    id: 4,
    caseId: 104,
    type: 'SESSION',
    title: 'Appel — Affaire penale n°442',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 8, 11, 0),
    status: 'UPCOMING',
    priority: 'HIGH',
    location: 'Cour d\'appel de Nabeul',
  },

  // Task Deadlines
  {
    id: 5,
    caseId: 101,
    type: 'TASK_DEADLINE',
    title: 'Dépôt du mémoire en défense',
    description: 'Mémoire à déposer avant la fin de journée.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 17, 0),
    status: 'UPCOMING',
    priority: 'HIGH',
  },
  {
    id: 6,
    caseId: 105,
    type: 'TASK_DEADLINE',
    title: 'Préparer les conclusions d\'appel',
    description: 'Rédiger les conclusions pour le client M. Trabelsi.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 12, 0),
    status: 'UPCOMING',
    priority: 'MEDIUM',
  },
  {
    id: 7,
    caseId: 106,
    type: 'TASK_DEADLINE',
    title: 'Réunion client — Mme Hamdi',
    description: 'Point sur l\'avancement du dossier.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3, 15, 0),
    status: 'UPCOMING',
    location: 'Cabinet, Salle de réunion',
  },
  {
    id: 8,
    caseId: 107,
    type: 'TASK_DEADLINE',
    title: 'Expertise comptable — Dossier fiscal',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 6, 9, 0),
    status: 'UPCOMING',
    priority: 'LOW',
  },

  // Legal Deadlines (some critical — within 3 days)
  {
    id: 9,
    caseId: 108,
    type: 'LEGAL_DEADLINE',
    title: 'Prescription — Délai de recours',
    description: 'Dernier jour pour interjeter appel.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 23, 59),
    status: 'UPCOMING',
    priority: 'HIGH',
  },
  {
    id: 10,
    caseId: 109,
    type: 'LEGAL_DEADLINE',
    title: 'Déchéance — Opposabilité du contrat',
    description: 'Date limite pour notifier la résiliation.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 17, 0),
    status: 'UPCOMING',
    priority: 'HIGH',
  },
  {
    id: 11,
    caseId: 110,
    type: 'LEGAL_DEADLINE',
    title: 'Forclusion — Recours en annulation',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 4, 23, 59),
    status: 'UPCOMING',
    priority: 'MEDIUM',
  },
  {
    id: 12,
    caseId: 111,
    type: 'LEGAL_DEADLINE',
    title: 'Délai de grâce — Paiement créance',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 10, 17, 0),
    status: 'UPCOMING',
    priority: 'LOW',
  },

  // Overdue items
  {
    id: 13,
    caseId: 112,
    type: 'TASK_DEADLINE',
    title: 'Envoyer convocation — Témoin M. Saïd',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2, 10, 0),
    status: 'UPCOMING',
    priority: 'HIGH',
  },
  {
    id: 14,
    caseId: 113,
    type: 'LEGAL_DEADLINE',
    title: 'Dépôt de conclusions — Affaire n°881',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 1, 17, 0),
    status: 'UPCOMING',
    priority: 'HIGH',
  },

  // Other
  {
    id: 15,
    caseId: 0,
    type: 'OTHER',
    title: 'Conférence — Droit des affaires 2026',
    description: 'Conférence annuelle de l\'Ordre des avocats.',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7, 14, 0),
    status: 'UPCOMING',
    location: 'Hôtel Méhari, Nabeul',
  },
  {
    id: 16,
    caseId: 0,
    type: 'OTHER',
    title: 'Formation continue — Médiation',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 12, 9, 0),
    status: 'UPCOMING',
  },
];

/**
 * Mock reminders for development.
 */
export const MOCK_REMINDERS: Reminder[] = [
  {
    id: 1,
    agendaItemId: 1,
    reminderDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 8, 0),
    sent: false,
    method: 'IN_APP',
  },
  {
    id: 2,
    agendaItemId: 5,
    reminderDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 14, 0),
    sent: false,
    method: 'EMAIL',
  },
  {
    id: 3,
    agendaItemId: 9,
    reminderDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 8, 0),
    sent: false,
    method: 'IN_APP',
  },
  {
    id: 4,
    agendaItemId: 3,
    reminderDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 4, 8, 0),
    sent: false,
    method: 'IN_APP',
  },
];
