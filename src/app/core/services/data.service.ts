import { Injectable } from '@angular/core';
import {
  Lawyer, Case, AgendaEvent, Client, Notification,
  HonorairesEntry, LegalText, NewsItem, EventItem, LawyerProfile,
  CaseTimelineEvent, CaseDocument, Note, Task
} from '../models/lawyer.model';

const now = new Date();
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const toIso = (date: Date) => date.toISOString().split('T')[0];

const today = toIso(now);
const tomorrow = toIso(addDays(now, 1));
const inTwoDays = toIso(addDays(now, 2));
const inThreeDays = toIso(addDays(now, 3));
const inFiveDays = toIso(addDays(now, 5));
const inEightDays = toIso(addDays(now, 8));
const yesterday = toIso(addDays(now, -1));

@Injectable({ providedIn: 'root' })
export class DataService {

  lawyerProfile: LawyerProfile = {
    name: 'الأستاذ محمد الصغير',
    title: 'محامٍ لدى التعقيب',
    barNumber: 'ت/2847',
    specialization: 'القانون التجاري والمدني',
    email: 'm.petit@avocat.tn',
  };

  lawyers: Lawyer[] = [
    { id: 1, name: 'Me. Ahmed Khalil', matricule: 'A-10234', address: '12 Ave Habib Bourguiba, Nabeul', phone: '+216 72 285 100', speciality: 'Droit pénal', governorate: 'Nabeul' },
    { id: 2, name: 'Me. Sonia Trabelsi', matricule: 'A-10567', address: '45 Rue de la République, Hammamet', phone: '+216 72 280 200', speciality: 'Droit de la famille', governorate: 'Nabeul' },
    { id: 3, name: 'Me. Mohamed Gharbi', matricule: 'A-11890', address: '8 Ave Farhat Hached, Korba', phone: '+216 72 290 300', speciality: 'Droit commercial', governorate: 'Nabeul' },
    { id: 4, name: 'Me. Leila Mansour', matricule: 'A-12345', address: '23 Rue Ali Belhouane, Menzel Temime', phone: '+216 72 295 400', speciality: 'Droit civil', governorate: 'Nabeul' },
    { id: 5, name: 'Me. Karim Bouaziz', matricule: 'A-13456', address: '5 Ave Taieb Mhiri, Nabeul', phone: '+216 72 287 500', speciality: 'Droit du travail', governorate: 'Nabeul' },
    { id: 6, name: 'Me. Fatma Jebali', matricule: 'A-14567', address: '34 Rue de Tunis, Grombalia', phone: '+216 72 292 600', speciality: 'Droit immobilier', governorate: 'Nabeul' },
    { id: 7, name: 'Me. Hichem Riahi', matricule: 'A-15678', address: '17 Ave Habib Thameur, Nabeul', phone: '+216 72 283 700', speciality: 'Droit des affaires', governorate: 'Nabeul' },
    { id: 8, name: 'Me. Amira Saidi', matricule: 'A-16789', address: '9 Rue Mongi Slim, Hammamet', phone: '+216 72 281 800', speciality: 'Droit international', governorate: 'Nabeul' },
  ];

  cases: Case[] = [
    { id: 1, number: '2024/1523', title: 'Affaire شركة المدار للتجارة', clientId: 1, clientName: 'شركة المدار للتجارة', status: 'active', type: 'commercial', court: 'المحكمة التجارية بتونس', fees: 12000, paidFees: 7000, hearingDate: inThreeDays, progress: 60, stage: 3, totalStages: 5 },
    { id: 2, number: '2024/0892', title: 'Affaire عائلة بن سالم', clientId: 2, clientName: 'عائلة بن سالم', status: 'active', type: 'family', court: 'محكمة الأسرة بصفاقس', fees: 8500, paidFees: 4500, hearingDate: today, progress: 50, stage: 2, totalStages: 4 },
    { id: 3, number: '2023/3341', title: 'Affaire مصطفى الرياحي', clientId: 3, clientName: 'مصطفى الرياحي', status: 'urgent', type: 'penal', court: 'المحكمة الجناحية بتونس', fees: 10000, paidFees: 6000, hearingDate: inTwoDays, progress: 33, stage: 1, totalStages: 3 },
    { id: 4, number: '2024/2105', title: 'Affaire مؤسسة النور', clientId: 5, clientName: 'مؤسسة النور', status: 'pending', type: 'administrative', court: 'المحكمة الإدارية', fees: 9000, paidFees: 2000, hearingDate: '', progress: 0, stage: 0, totalStages: 4 },
    { id: 5, number: '2023/1187', title: 'Affaire سمية الورغي', clientId: 6, clientName: 'سمية الورغي', status: 'closed', type: 'civil', court: 'المحكمة الابتدائية بأريانة', fees: 7000, paidFees: 7000, hearingDate: toIso(addDays(now, -30)), progress: 100, stage: 5, totalStages: 5 },
    { id: 6, number: '2024/2891', title: 'Affaire شركة البناء الحديث', clientId: 4, clientName: 'شركة البناء الحديث', status: 'active', type: 'commercial', court: 'المحكمة التجارية بصفاقس', fees: 15000, paidFees: 3000, hearingDate: tomorrow, progress: 20, stage: 1, totalStages: 5 },
  ];

  events: AgendaEvent[] = [
    { id: 1, title: 'جلسة قضية شركة المدار للتجارة', date: today, time: '10:00', type: 'hearing', description: 'المحكمة التجارية بتونس', location: 'المحكمة التجارية بتونس', caseId: 1 },
    { id: 2, title: 'جلسة استئناف قضية مصطفى الرياحي', date: inTwoDays, time: '09:30', type: 'hearing', description: 'المحكمة الجناحية بتونس', location: 'المحكمة الجناحية بتونس', caseId: 3 },
    { id: 3, title: 'موعد مع عائلة بن سالم', date: inFiveDays, time: '14:00', type: 'appointment', description: 'المكتب', location: 'المكتب', caseId: 2 },
    { id: 4, title: 'موعد مع مؤسسة النور', date: tomorrow, time: '16:30', type: 'appointment', description: 'المكتب', location: 'المكتب', caseId: 4 },
    { id: 5, title: 'آخر أجل لإيداع مذكرة دفاع', date: tomorrow, time: '12:00', type: 'deadline', description: 'قضية شركة البناء الحديث', location: '', caseId: 6, urgent: true },
    { id: 6, title: 'اجتماع تنسيقي مع فريق المكتب', date: inTwoDays, time: '17:00', type: 'meeting', description: 'قاعة الاجتماعات', location: 'قاعة الاجتماعات' },
    { id: 7, title: 'تكوين: مستجدات الإجراءات المدنية', date: inFiveDays, time: '11:00', type: 'training', description: 'دار المحامي', location: 'دار المحامي' },
    { id: 8, title: 'جلسة متابعة قضية شركة البناء الحديث', date: inEightDays, time: '10:30', type: 'hearing', description: 'المحكمة التجارية بصفاقس', location: 'المحكمة التجارية بصفاقس', caseId: 6 },
  ];

  clients: Client[] = [
    { id: 1, name: 'شركة المدار للتجارة', kind: 'LEGAL', taxId: 'MF-ALMADAR', vatNumber: 'TVA-ALMADAR', address: 'تونس', phone: '+216 71 222 333', email: 'contact@almadar.tn', notes: '' },
    { id: 2, name: 'عائلة بن سالم', kind: 'NATURAL', cin: '08976543', address: 'سوسة', phone: '+216 74 555 100', email: '', notes: '' },
    { id: 3, name: 'مصطفى الرياحي', kind: 'NATURAL', cin: '11223344', address: 'صفاقس', phone: '+216 98 444 121', email: 'm.riahi@mail.tn', notes: '' },
    { id: 4, name: 'شركة البناء الحديث', kind: 'LEGAL', taxId: 'MF-MODERNBUILD', vatNumber: 'TVA-MODERNBUILD', address: 'أريانة', phone: '+216 70 909 707', email: 'legal@modernbuild.tn', notes: '' },
    { id: 5, name: 'مؤسسة النور', kind: 'LEGAL', taxId: 'MF-NOUR', vatNumber: 'TVA-NOUR', address: 'تونس', phone: '+216 71 303 404', email: 'contact@nour.org.tn', notes: '' },
    { id: 6, name: 'سمية الورغي', kind: 'NATURAL', cin: '05671234', address: 'أريانة', phone: '+216 92 111 222', email: '', notes: '' },
  ];

  notifications: Notification[] = [
    { id: 1, type: 'case', title: 'تنبيه عاجل: أجل قانوني خلال 24 ساعة', message: 'آخر أجل لإيداع مذكرة الدفاع في قضية شركة البناء الحديث ينتهي غدًا.', date: today, read: false, priority: 'high', caseId: 6 },
    { id: 2, type: 'case', title: 'تذكير: جلسة غدًا', message: 'لديك جلسة لقضية شركة البناء الحديث صباح الغد.', date: today, read: false, priority: 'high', caseId: 6 },
    { id: 3, type: 'document', title: 'وثيقة جديدة من الحريف', message: 'تم رفع وثيقة جديدة من طرف عائلة بن سالم على المنصة.', date: yesterday, read: true, priority: 'medium', caseId: 2 },
    { id: 4, type: 'system', title: 'تحديث المنصة', message: 'تم إضافة تحسينات جديدة على صفحة إدارة القضايا.', date: toIso(addDays(now, -2)), read: true, priority: 'info' },
  ];

  honoraires: HonorairesEntry[] = [
    { id: 1, client: 'شركة المدار للتجارة', case: '2024/1523', total: 12000, paid: 7000, expenses: 900, status: 'partial' },
    { id: 2, client: 'عائلة بن سالم', case: '2024/0892', total: 8500, paid: 4500, expenses: 500, status: 'partial' },
    { id: 3, client: 'مصطفى الرياحي', case: '2023/3341', total: 10000, paid: 6000, expenses: 1300, status: 'partial' },
    { id: 4, client: 'شركة البناء الحديث', case: '2024/2891', total: 15000, paid: 3000, expenses: 1100, status: 'partial' },
  ];

  legalTexts: LegalText[] = [
    { id: 1, title: 'Code des obligations et des contrats', category: 'Code', date: '1906-12-05', reference: 'COC-1906', description: 'Texte fondamental du droit tunisien des obligations.' },
    { id: 2, title: 'Code de procédure civile', category: 'Code', date: '1959-07-08', reference: 'CPC-1959', description: 'Règles de procédure devant les juridictions civiles.' },
    { id: 3, title: 'Code pénal tunisien', category: 'Code', date: '1913-01-13', reference: 'CP-1913', description: 'Texte principal du droit pénal tunisien.' },
    { id: 4, title: 'Code du travail', category: 'Code', date: '1966-08-01', reference: 'CT-1966', description: 'Réglementation du travail et des relations professionnelles.' },
    { id: 5, title: 'Code de commerce', category: 'Code', date: '1959-08-24', reference: 'CC-1959', description: 'Règles relatives aux actes de commerce et aux commerçants.' },
    { id: 6, title: 'Loi sur la propriété foncière', category: 'Loi', date: '1885-07-01', reference: 'LPF-1885', description: 'Régime de la propriété immobilière en Tunisie.' },
  ];

  newsItems: NewsItem[] = [
    { id: 1, title: 'Réforme de la justice: les avocats mobilisés', excerpt: 'Les avocats tunisiens se mobilisent face au projet de réforme du système judiciaire.', date: '2025-04-01', category: 'Réforme' },
    { id: 2, title: 'Nouveau barème des honoraires', excerpt: 'L\'ordre national des avocats publie un nouveau barème indicatif des honoraires.', date: '2025-03-28', category: 'Profession' },
    { id: 3, title: 'Formation continue: inscriptions ouvertes', excerpt: 'Les inscriptions pour les sessions de formation continue sont ouvertes jusqu\'au 30 avril.', date: '2025-03-25', category: 'Formation' },
    { id: 4, title: 'Conférence internationale du droit', excerpt: 'Tunis accueillera la conférence internationale du droit méditerranéen en mai 2025.', date: '2025-03-20', category: 'Événement' },
  ];

  eventItems: EventItem[] = [
    { id: 1, title: 'Conférence: Droit et numérique', date: '2025-04-15', location: 'Tunis', description: 'Les enjeux du droit à l\'ère du numérique.' },
    { id: 2, title: 'Atelier: Médiation et arbitrage', date: '2025-04-22', location: 'Nabeul', description: 'Formation pratique aux modes alternatifs de résolution des conflits.' },
    { id: 3, title: 'Assemblée générale du barreau', date: '2025-05-01', location: 'Nabeul', description: 'Assemblée générale annuelle de l\'ordre des avocats de Nabeul.' },
    { id: 4, title: 'Colloque: Droit des affaires en Afrique', date: '2025-05-10', location: 'Hammamet', description: 'Colloque international sur le droit des affaires en Afrique.' },
  ];

  getLawyerProfile(): LawyerProfile {
    return this.lawyerProfile;
  }

  getLawyers(): Lawyer[] {
    return this.lawyers;
  }

  getCases(): Case[] {
    return this.cases;
  }

  getEvents(): AgendaEvent[] {
    return this.events;
  }

  getClients(): Client[] {
    return this.clients;
  }

  addClient(dto: Omit<Client, 'id'>): Client {
    const nextId = Math.max(0, ...this.clients.map(c => c.id)) + 1;
    const created: Client = { id: nextId, ...dto };
    this.clients = [...this.clients, created];
    return created;
  }

  updateClient(id: number, patch: Partial<Omit<Client, 'id'>>): Client | null {
    const existing = this.clients.find(c => c.id === id);
    if (!existing) return null;
    const updated: Client = { ...existing, ...patch, id };
    this.clients = this.clients.map(c => (c.id === id ? updated : c));
    return updated;
  }

  getNotifications(): Notification[] {
    return this.notifications;
  }

  getHonoraires(): HonorairesEntry[] {
    return this.honoraires;
  }

  getLegalTexts(): LegalText[] {
    return this.legalTexts;
  }

  getNewsItems(): NewsItem[] {
    return this.newsItems;
  }

  getEventItems(): EventItem[] {
    return this.eventItems;
  }

  timelineEvents: CaseTimelineEvent[] = [
    // Case 1: شركة المدار للتجارة
    { id: 1, caseId: 1, date: '2024-09-15', type: 'document', title: 'إيداع عريضة الدعوى', description: 'تم إيداع عريضة الدعوى لدى المحكمة التجارية بتونس' },
    { id: 2, caseId: 1, date: '2024-10-01', type: 'hearing', title: 'جلسة أولى', description: 'النظر في طلب الإذن بالإجراء', location: 'المحكمة التجارية بتونس' },
    { id: 3, caseId: 1, date: '2024-10-15', type: 'payment', title: 'دفعة أولى من الحريف', description: 'استلام دفعة أولى', amount: 4000 },
    { id: 4, caseId: 1, date: '2024-11-20', type: 'document', title: 'تقديم مذكرة دفاع', description: 'إيداع مذكرة الدفاع الأولى' },
    { id: 5, caseId: 1, date: '2025-01-10', type: 'hearing', title: 'جلسة ثانية', description: 'مرافعة وطلب خبرة', location: 'المحكمة التجارية بتونس' },
    { id: 6, caseId: 1, date: '2025-02-15', type: 'deadline', title: 'أجل تقديم الخبرة', description: 'آخر أجل لتقديم تقرير الخبرة' },
    { id: 7, caseId: 1, date: '2025-04-10', type: 'hearing', title: 'جلسة قادمة', description: 'النظر في تقرير الخبرة', location: 'المحكمة التجارية بتونس' },

    // Case 2: عائلة بن سالم
    { id: 8, caseId: 2, date: '2024-08-01', type: 'document', title: 'رفع دعوى طلاق', description: 'إيداع دعوى طلاق لدى محكمة الأسرة' },
    { id: 9, caseId: 2, date: '2024-09-05', type: 'hearing', title: 'جلسة صلح أولى', description: 'محاولة صلح بين الطرفين', location: 'محكمة الأسرة بصفاقس' },
    { id: 10, caseId: 2, date: '2024-10-20', type: 'payment', title: 'دفعة من الحريف', description: 'استلام دفعة ثانية', amount: 2000 },
    { id: 11, caseId: 2, date: '2024-12-15', type: 'note', title: 'ملاحظة داخلية', description: 'الاتفاق على الحضانة لصالح الأم' },
    { id: 12, caseId: 2, date: '2025-02-01', type: 'hearing', title: 'جلسة حكم', description: 'النطق بالحكم الابتدائي', location: 'محكمة الأسرة بصفاقس' },
    { id: 13, caseId: 2, date: '2025-04-07', type: 'hearing', title: 'جلسة قادمة', description: 'استئناف الحكم', location: 'محكمة الأسرة بصفاقس' },

    // Case 3: مصطفى الرياحي
    { id: 14, caseId: 3, date: '2024-06-10', type: 'document', title: 'توكيل رسمي', description: 'تحرير توكيل رسمي من الموكل' },
    { id: 15, caseId: 3, date: '2024-07-20', type: 'hearing', title: 'أول جلسة', description: 'النظر في التهمة الموجهة', location: 'المحكمة الجناحية بتونس' },
    { id: 16, caseId: 3, date: '2024-09-01', type: 'payment', title: 'دفعة أولى', description: 'استلام مبلغ من الموكل', amount: 3000 },
    { id: 17, caseId: 3, date: '2024-11-15', type: 'deadline', title: 'أجل استئناف', description: 'آخر أجل لتقديم طلب الاستئناف' },
    { id: 18, caseId: 3, date: '2025-01-20', type: 'hearing', title: 'جلسة استئناف', description: 'النظر في الاستئناف', location: 'المحكمة الجناحية بتونس' },
    { id: 19, caseId: 3, date: '2025-04-09', type: 'hearing', title: 'جلسة قادمة', description: 'متابعة الاستئناف', location: 'المحكمة الجناحية بتونس' },

    // Case 4: مؤسسة النور
    { id: 20, caseId: 4, date: '2024-11-01', type: 'document', title: 'تقديم طعن إداري', description: 'إيداع طعن لدى المحكمة الإدارية' },
    { id: 21, caseId: 4, date: '2025-01-15', type: 'payment', title: 'دفعة أولى', description: 'استلام دفعة من مؤسسة النور', amount: 2000 },
    { id: 22, caseId: 4, date: '2025-03-01', type: 'note', title: 'ملاحظة', description: 'في انتظار رد الإدارة' },

    // Case 6: شركة البناء الحديث
    { id: 23, caseId: 6, date: '2025-01-05', type: 'document', title: 'إيداع دعوى تجارية', description: 'رفع دعوى لدى المحكمة التجارية بصفاقس' },
    { id: 24, caseId: 6, date: '2025-02-10', type: 'hearing', title: 'أول جلسة', description: 'النظر في الطلبات الأولية', location: 'المحكمة التجارية بصفاقس' },
    { id: 25, caseId: 6, date: '2025-03-01', type: 'payment', title: 'دفعة أولى', description: 'استلام دفعة من شركة البناء الحديث', amount: 3000 },
    { id: 26, caseId: 6, date: '2025-04-08', type: 'deadline', title: 'أجل تقديم المستندات', description: 'آخر أجل لتقديم وثائق الإثبات' },
    { id: 27, caseId: 6, date: '2025-05-01', type: 'hearing', title: 'جلسة قادمة', description: 'متابعة القضية', location: 'المحكمة التجارية بصفاقس' },
  ];

  getTimelineEvents(caseId: number): CaseTimelineEvent[] {
    return this.timelineEvents
      .filter(e => e.caseId === caseId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  caseDocuments: CaseDocument[] = [
    // Case 1: شركة المدار للتجارة
    { id: 1, caseId: 1, name: 'عقد شراكة تجارية.pdf', folder: 'contracts', fileType: 'pdf', size: '2.4 MB', uploadDate: '2024-09-10', version: 2, tags: ['عقد', 'شراكة'] },
    { id: 2, caseId: 1, name: 'مذكرة دفاع أولى.docx', folder: 'memos', fileType: 'word', size: '1.1 MB', uploadDate: '2024-11-18', version: 1, tags: ['مذكرة', 'دفاع'] },
    { id: 3, caseId: 1, name: 'مذكرة دفاع ثانية.docx', folder: 'memos', fileType: 'word', size: '1.3 MB', uploadDate: '2025-01-05', version: 1, tags: ['مذكرة', 'خبرة'] },
    { id: 4, caseId: 1, name: 'حكم ابتدائي.pdf', folder: 'rulings', fileType: 'pdf', size: '890 KB', uploadDate: '2025-02-20', version: 1, tags: ['حكم'] },
    { id: 5, caseId: 1, name: 'مراسلة المحكمة.png', folder: 'correspondence', fileType: 'image', size: '450 KB', uploadDate: '2024-10-05', version: 1, tags: ['مراسلة'] },

    // Case 2: عائلة بن سالم
    { id: 6, caseId: 2, name: 'عقد زواج.pdf', folder: 'contracts', fileType: 'pdf', size: '1.2 MB', uploadDate: '2024-07-25', version: 1, tags: ['عقد', 'زواج'] },
    { id: 7, caseId: 2, name: 'عريضة طلاق.docx', folder: 'memos', fileType: 'word', size: '980 KB', uploadDate: '2024-08-01', version: 1, tags: ['عريضة', 'طلاق'] },
    { id: 8, caseId: 2, name: 'حكم حضاني.pdf', folder: 'rulings', fileType: 'pdf', size: '750 KB', uploadDate: '2025-02-05', version: 1, tags: ['حكم', 'حضانة'] },
    { id: 9, caseId: 2, name: 'مراسلة موكل.png', folder: 'correspondence', fileType: 'image', size: '320 KB', uploadDate: '2024-12-10', version: 1, tags: ['مراسلة'] },

    // Case 3: مصطفى الرياحي
    { id: 10, caseId: 3, name: 'توكيل رسمي.pdf', folder: 'contracts', fileType: 'pdf', size: '680 KB', uploadDate: '2024-06-08', version: 1, tags: ['توكيل'] },
    { id: 11, caseId: 3, name: 'مذكرة استئناف.docx', folder: 'memos', fileType: 'word', size: '1.5 MB', uploadDate: '2024-11-10', version: 2, tags: ['مذكرة', 'استئناف'] },
    { id: 12, caseId: 3, name: 'حكم جناحي.pdf', folder: 'rulings', fileType: 'pdf', size: '920 KB', uploadDate: '2025-01-25', version: 1, tags: ['حكم'] },
    { id: 13, caseId: 3, name: 'صورة هوية.png', folder: 'other', fileType: 'image', size: '280 KB', uploadDate: '2024-06-05', version: 1, tags: ['هوية'] },

    // Case 4: مؤسسة النور
    { id: 14, caseId: 4, name: 'طعن إداري.docx', folder: 'memos', fileType: 'word', size: '1.8 MB', uploadDate: '2024-10-28', version: 1, tags: ['طعن'] },
    { id: 15, caseId: 4, name: 'مراسلة إدارة.png', folder: 'correspondence', fileType: 'image', size: '410 KB', uploadDate: '2025-02-15', version: 1, tags: ['مراسلة', 'إدارة'] },

    // Case 6: شركة البناء الحديث
    { id: 16, caseId: 6, name: 'عقد بناء.pdf', folder: 'contracts', fileType: 'pdf', size: '3.1 MB', uploadDate: '2024-12-20', version: 1, tags: ['عقد', 'بناء'] },
    { id: 17, caseId: 6, name: 'مذكرة افتتاح.docx', folder: 'memos', fileType: 'word', size: '1.2 MB', uploadDate: '2025-01-03', version: 1, tags: ['مذكرة'] },
    { id: 18, caseId: 6, name: 'وثائق إثبات.png', folder: 'other', fileType: 'image', size: '2.8 MB', uploadDate: '2025-03-15', version: 1, tags: ['إثبات'] },
  ];

  getDocuments(caseId: number): CaseDocument[] {
    return this.caseDocuments
      .filter(d => d.caseId === caseId)
      .sort((a, b) => b.uploadDate.localeCompare(a.uploadDate));
  }

  tasks: Task[] = [
    // Case 1
    { id: 1, caseId: 1, title: 'إيداع مذكرة الدفاع الثانية', description: 'تحضير وإيداع مذكرة الدفاع الثانية لدى المحكمة', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: today, createdAt: '2025-04-01' },
    { id: 2, caseId: 1, title: 'الاتصال بالخبير', description: 'التواصل مع الخبير لمراجعة التقرير', status: 'TODO', priority: 'MEDIUM', dueDate: inTwoDays, createdAt: '2025-04-02' },
    { id: 3, caseId: 1, title: 'مراجعة عقد الشراكة', status: 'TODO', priority: 'LOW', dueDate: inFiveDays, createdAt: '2025-04-03' },
    // Case 2
    { id: 4, caseId: 2, title: 'تحضير ملف الحضانة', description: 'جمع الوثائق اللازمة لملف الحضانة', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: today, createdAt: '2025-04-01' },
    { id: 5, caseId: 2, title: 'الاتفاق مع الموكل على الاستئناف', status: 'TODO', priority: 'MEDIUM', dueDate: inThreeDays, createdAt: '2025-04-02' },
    // Case 3
    { id: 6, caseId: 3, title: 'تقديم طلب الاستئناف', description: 'إعداد وتقديم طلب الاستئناف', status: 'TODO', priority: 'HIGH', dueDate: tomorrow, createdAt: '2025-04-03' },
    { id: 7, caseId: 3, title: 'جمع وثائق الإثبات', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: inFiveDays, createdAt: '2025-04-01' },
    // Case 4
    { id: 8, caseId: 4, title: 'متابعة رد الإدارة', status: 'TODO', priority: 'LOW', dueDate: inEightDays, createdAt: '2025-04-02' },
    // Case 6
    { id: 9, caseId: 6, title: 'إيداع وثائق الإثبات', description: 'تقديم وثائق الإثبات للمحكمة', status: 'TODO', priority: 'HIGH', dueDate: tomorrow, createdAt: '2025-04-04' },
    { id: 10, caseId: 6, title: 'تحضير المرافعة', status: 'TODO', priority: 'MEDIUM', dueDate: inFiveDays, createdAt: '2025-04-03' },
    { id: 11, caseId: 6, title: 'إرسال نسخة من العقد للموكل', status: 'DONE', priority: 'LOW', dueDate: today, createdAt: '2025-04-01' },
  ];

  getTasks(caseId: number): Task[] {
    return this.tasks
      .filter(t => t.caseId === caseId)
      .sort((a, b) => a.dueDate?.localeCompare(b.dueDate || '') ?? 0);
  }

  getTodayTasks(): Task[] {
    return this.tasks
      .filter(t => t.dueDate === today && t.status !== 'DONE')
      .sort((a, b) => {
        const pOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
        return pOrder[a.priority] - pOrder[b.priority];
      });
  }

  notes: Note[] = [
    { id: 1, caseId: 1, title: 'ملاحظات الجلسة الأولى', content: '<p>تم النظر في الطلب الأولي. المحكمة طلبت <strong>مذكرة دفاع مفصلة</strong> خلال 15 يوماً.</p><ul><li>الاتصال بالشاهد الأول</li><li>جمع الوثائق المالية</li></ul>', createdAt: '2024-10-01', updatedAt: '2024-10-05' },
    { id: 2, caseId: 1, title: 'استراتيجية الدفاع', content: '<p>التركيز على <em>عدم صحة الإجراءات</em> المتبعة من الطرف الآخر.</p><p>الاستعانة بخبير محاسبي لمراجعة الحسابات.</p>', createdAt: '2024-11-15', updatedAt: '2024-11-20' },
    { id: 3, caseId: 2, title: 'ملف الحضانة', content: '<p>الأم تطالب بالحضانة الكاملة. <strong>الأب يرفض.</strong></p><p>يجب تحضير:</p><ul><li>شهادة من المدرسة</li><li>تقرير اجتماعي</li><li>شهادة طبية</li></ul>', createdAt: '2024-09-06', updatedAt: '2024-09-10' },
    { id: 4, caseId: 3, title: 'ملاحظات الاستئناف', content: '<p>الحكم الابتدائي قاسٍ جداً. هناك <strong>ظروف مخففة</strong> لم تؤخذ بعين الاعتبار.</p><p>التركيز على:</p><ul><li>سوابق الموكل النظيفة</li><li>التعاون مع التحقيق</li></ul>', createdAt: '2025-01-21', updatedAt: '2025-01-25' },
    { id: 5, caseId: 6, title: 'عقد البناء - ملاحظات', content: '<p>العقد يحتوي على <strong>بند تحكيم</strong> إلزامي. يجب مراعاته قبل رفع الدعوى.</p><p>الموكل يريد تعويضاً عن التأخير.</p>', createdAt: '2025-01-10' },
  ];

  getNotes(caseId: number): Note[] {
    return this.notes
      .filter(n => n.caseId === caseId)
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
  }

  searchNotes(query: string): Note[] {
    if (!query) return [];
    const q = query.toLowerCase();
    return this.notes.filter(n =>
      (n.title ?? '').toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    );
  }
}
