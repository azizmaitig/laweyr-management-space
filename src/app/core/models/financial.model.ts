export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

export interface Invoice {
  id: number;
  caseId: number;
  clientId: number;
  number: string;
  /** Amount excluding VAT/TVA (HT). */
  amountHT: number;
  /** VAT/TVA rate, e.g. 0.19 for 19%. */
  tvaRate: number;
  /** VAT/TVA amount. */
  tvaAmount: number;
  /** Total amount including VAT/TVA (TTC). */
  amount: number;
  status: InvoiceStatus;
  issuedAt: Date;
  dueDate: Date;
}

export type ExpenseCategory = 'COURT' | 'TRANSPORT' | 'EXPERT' | 'OTHER';

export interface TimeEntry {
  id: number;
  caseId: number;
  taskId?: number;
  description: string;
  duration: number;
  hourlyRate: number;
  amount: number;
  createdAt: Date;
}

export interface Expense {
  id: number;
  caseId: number;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  documentUrl?: string;
}
