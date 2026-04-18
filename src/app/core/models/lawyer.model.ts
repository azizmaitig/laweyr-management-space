export interface Lawyer {
  id: number;
  name: string;
  matricule: string;
  address: string;
  phone: string;
  speciality: string;
  governorate: string;
}

export interface LawyerProfile {
  name: string;
  title?: string;
  barNumber: string;
  specialization: string;
  email: string;
}

export type TimelineEventType = 'hearing' | 'deadline' | 'document' | 'note' | 'payment';

export interface CaseTimelineEvent {
  id: number;
  caseId: number;
  date: string;
  time?: string;
  type: TimelineEventType;
  title: string;
  description: string;
  location?: string;
  documentUrl?: string;
  amount?: number;
}
export type DocumentType = 'contract' | 'evidence' | 'judgment' | 'correspondence';

export interface Document {
  id: number;
  caseId: number;
  name: string;
  type: DocumentType;
  url: string;
  createdAt: string;
  updatedAt?: string;
}

export type DocumentFolder = 'contracts' | 'memos' | 'rulings' | 'correspondence' | 'other';
export type DocumentFileType = 'pdf' | 'word' | 'image';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export interface Task {
  id: number;
  caseId: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Note {
  id: number;
  caseId: number;
  title?: string;
  content: string;  // HTML or rich text
  createdAt: string;
  updatedAt?: string;
}

export interface CaseDocument {
  id: number;
  caseId: number;
  name: string;
  folder: DocumentFolder;
  fileType: DocumentFileType;
  size: string;
  uploadDate: string;
  version: number;
  tags: string[];
  /** Optional direct file URL for preview/download when integrated with API or storage. */
  url?: string;
}

export type CaseStatus = 'active' | 'pending' | 'closed' | 'urgent';
export type CaseType = 'civil' | 'penal' | 'commercial' | 'administrative' | 'family';
export type EventType = 'hearing' | 'appointment' | 'deadline' | 'meeting' | 'training';

export interface Case {
  id: number;
  number?: string;
  title: string;
  /** FK to `Client.id`. */
  clientId: number;
  /** Display name (denormalized for fast UI / offline mocks). */
  clientName: string;
  status: CaseStatus;
  type: CaseType;
  court: string;
  fees: number;
  paidFees: number;
  hearingDate: string;
  progress: number;
  stage?: number;
  totalStages?: number;
}

export interface AgendaEvent {
  id: number;
  title: string;
  date: string;
  time: string;
  type: EventType;
  description: string;
  location?: string;
  caseId?: number;
  urgent?: boolean;
}

export interface Client {
  id: number;
  name: string;
  /** Distinguish person vs company/organization. */
  kind: ClientKind;
  /** National ID for natural persons (Tunisia: CIN). */
  cin?: string;
  /** Tax identifier / matricule fiscal (MF) for legal entities. */
  taxId?: string;
  /** VAT / TVA registration number when applicable. */
  vatNumber?: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
  cases?: Case[];
  financial?: { paid: number; remaining: number };
  communications?: Communication[];
}

export type ClientKind = 'NATURAL' | 'LEGAL';

export type CommunicationType = 'CALL' | 'MESSAGE' | 'EMAIL' | 'APPOINTMENT';

export interface Communication {
  id: number;
  clientId: number;
  type: CommunicationType;
  date: string;
  note?: string;
}

export type NotificationType = 'document' | 'message' | 'note' | 'case' | 'task' | 'system';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  priority: 'high' | 'medium' | 'info';
  clientId?: number;
  caseId?: number;
  documentId?: number;
  noteId?: number;
  taskId?: number;
}

export interface HonorairesEntry {
  id: number;
  client: string;
  case: string;
  total: number;
  paid: number;
  expenses: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export interface LegalText {
  id: number;
  title: string;
  category: string;
  date: string;
  reference: string;
  description: string;
}

export interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  image?: string;
}

export interface EventItem {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
}
