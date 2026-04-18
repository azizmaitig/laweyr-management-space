import { Injectable, inject, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, of, map, Subscription } from 'rxjs';
import { Client, Communication, FinancialEventPayload } from '../../../core/models';
import { ClientsApiService, CreateClientDto, UpdateClientDto, CreateCommunicationDto } from './clients-api.service';
import { EventService } from '../../../core/services/event.service';
import { AppEventType } from '../../../core/models/events.model';

export interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientsState = {
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class ClientsStateService implements OnDestroy {
  private api = inject(ClientsApiService);
  private events = inject(EventService);
  private state = new BehaviorSubject<ClientsState>(initialState);
  state$ = this.state.asObservable();

  private subscriptions = new Subscription();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // When a case is selected → load related client info
    this.subscriptions.add(
      this.events.on<number>(AppEventType.CASE_SELECTED)
        .subscribe(caseId => this.loadClientByCaseId(caseId))
    );

    // When a document is uploaded by a client → refresh client data
    this.subscriptions.add(
      this.events.on<{ caseId: number; documentId: number; name: string }>(AppEventType.DOCUMENT_UPLOADED)
        .subscribe(() => this.refreshIfActive())
    );

    // When client portal is updated → refresh client data
    this.subscriptions.add(
      this.events.on<{ clientId: number }>(AppEventType.CLIENT_PORTAL_UPDATE)
        .subscribe(({ clientId }) => {
          const current = this.state.value;
          if (current.selectedClient?.id === clientId) {
            this.loadClient(clientId);
          }
        })
    );

    this.subscriptions.add(
      this.events.on<FinancialEventPayload>(AppEventType.INVOICE_PAID).subscribe(p => {
        if (!p.clientId) return;
        this.applyInvoicePaidToClientState(p.clientId, p.amount);
      })
    );
  }

  /**
   * Applies paid invoice amounts to in-memory client financials (event-driven; no API).
   */
  private applyInvoicePaidToClientState(clientId: number, amount: number): void {
    const current = this.state.value;
    const patchFinancial = (c: Client): Client => {
      const f = c.financial ?? { paid: 0, remaining: 0 };
      return {
        ...c,
        financial: {
          paid: f.paid + amount,
          remaining: Math.max(0, f.remaining - amount),
        },
      };
    };
    const clients = current.clients.map(c => (c.id === clientId ? patchFinancial(c) : c));
    const selectedClient =
      current.selectedClient?.id === clientId ? patchFinancial(current.selectedClient) : current.selectedClient;
    this.state.next({ ...current, clients, selectedClient });
  }

  // Selectors

  /**
   * Get all clients
   */
  clients$ = this.state$.pipe(map(s => s.clients));

  /**
   * Get loading state
   */
  loading$ = this.state$.pipe(map(s => s.loading));

  /**
   * Get error state
   */
  error$ = this.state$.pipe(map(s => s.error));

  /**
   * Select a specific client by ID
   */
  selectClient(clientId: number): Observable<Client | undefined> {
    return this.state$.pipe(
      map(s => s.clients.find(c => c.id === clientId))
    );
  }

  /**
   * Select communications for a specific client
   */
  selectCommunications(clientId: number): Observable<Communication[]> {
    return this.state$.pipe(
      map(s => {
        // Check selected client first
        if (s.selectedClient?.id === clientId) {
          return s.selectedClient.communications || [];
        }
        // Fall back to clients list
        const client = s.clients.find(c => c.id === clientId);
        return client?.communications || [];
      })
    );
  }

  /**
   * Get selected client
   */
  selectedClient$ = this.state$.pipe(map(s => s.selectedClient));

  // Actions

  /**
   * Load all clients
   */
  loadClients() {
    this.patchState({ loading: true, error: null });
    this.api.getAllClients().pipe(
      tap(clients => {
        this.patchState({ clients, loading: false });
        this.events.emit(AppEventType.CASE_LOADED, { count: clients.length });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        this.events.emit(AppEventType.CASE_ERROR, err.message);
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Load client info related to a selected case
   * Finds the client by matching the case's client name
   */
  loadClientByCaseId(caseId: number) {
    // First, find the case to get the client name
    // This assumes cases are loaded with client info
    const current = this.state.value;
    
    // Search through all clients to find one with matching cases
    const clientWithCase = current.clients.find(c => 
      c.cases?.some(case_ => case_.id === caseId)
    );

    if (clientWithCase) {
      this.loadClient(clientWithCase.id);
    } else {
      // If not found in local state, try to load from API
      // This would require a backend endpoint to get client by caseId
      // For now, clear selection
      this.clearSelection();
    }
  }

  /**
   * Search clients by keyword
   */
  searchClients(keyword: string) {
    if (!keyword.trim()) {
      this.loadClients();
      return;
    }

    this.api.searchClients(keyword).pipe(
      tap(clients => this.patchState({ clients })),
      catchError(() => of([]))
    ).subscribe();
  }

  /**
   * Load a single client with full details
   */
  loadClient(id: number) {
    this.patchState({ loading: true, error: null });
    this.api.getClientById(id).pipe(
      tap(client => {
        this.patchState({ selectedClient: client, loading: false });
      }),
      catchError((err: { message: string }) => {
        this.patchState({ loading: false, error: err.message });
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Create a new client
   */
  createClient(dto: CreateClientDto) {
    this.api.createClient(dto).pipe(
      tap(client => {
        const current = this.state.value;
        this.state.next({ ...current, clients: [...current.clients, client] });
        this.events.emit(AppEventType.CLIENT_CREATED, {
          clientId: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CLIENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Update a client
   */
  updateClient(id: number, dto: UpdateClientDto) {
    this.api.updateClient(id, dto).pipe(
      tap(updated => {
        const current = this.state.value;
        this.state.next({
          ...current,
          clients: current.clients.map(c => c.id === id ? updated : c),
          selectedClient: current.selectedClient?.id === id ? updated : current.selectedClient,
        });
        this.events.emit(AppEventType.CLIENT_UPDATED, {
          clientId: updated.id,
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CLIENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Delete a client
   */
  deleteClient(id: number) {
    this.api.deleteClient(id).pipe(
      tap(() => {
        const current = this.state.value;
        this.state.next({
          ...current,
          clients: current.clients.filter(c => c.id !== id),
          selectedClient: current.selectedClient?.id === id ? null : current.selectedClient,
        });
        this.events.emit(AppEventType.CLIENT_DELETED, { clientId: id });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CLIENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Load client's cases
   */
  loadClientCases(clientId: number) {
    this.api.getClientCases(clientId).pipe(
      tap(cases => {
        const current = this.state.value;
        const updatedClients = current.clients.map(c =>
          c.id === clientId ? { ...c, cases } : c
        );
        const updatedSelected = current.selectedClient?.id === clientId
          ? { ...current.selectedClient, cases }
          : current.selectedClient;
        this.state.next({ ...current, clients: updatedClients, selectedClient: updatedSelected });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Load client's financial info
   */
  loadClientFinancial(clientId: number) {
    this.api.getClientFinancial(clientId).pipe(
      tap(financial => {
        const current = this.state.value;
        const updatedClients = current.clients.map(c =>
          c.id === clientId ? { ...c, financial } : c
        );
        const updatedSelected = current.selectedClient?.id === clientId
          ? { ...current.selectedClient, financial }
          : current.selectedClient;
        this.state.next({ ...current, clients: updatedClients, selectedClient: updatedSelected });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Load client's communications
   */
  loadClientCommunications(clientId: number) {
    this.api.getClientCommunications(clientId).pipe(
      tap(communications => {
        const current = this.state.value;
        const updatedSelected = current.selectedClient?.id === clientId
          ? { ...current.selectedClient, communications }
          : current.selectedClient;
        this.state.next({ ...current, selectedClient: updatedSelected });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  /**
   * Add a communication to a client
   */
  addCommunication(clientId: number, dto: CreateCommunicationDto) {
    this.api.addCommunication(clientId, dto).pipe(
      tap(communication => {
        const current = this.state.value;
        const updatedSelected = current.selectedClient?.id === clientId
          ? { ...current.selectedClient, communications: [...(current.selectedClient.communications || []), communication] }
          : current.selectedClient;
        this.state.next({ ...current, selectedClient: updatedSelected });
        this.events.emit(AppEventType.COMMUNICATION_ADDED, {
          communicationId: communication.id,
          clientId: communication.clientId,
          type: communication.type,
          date: communication.date,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CLIENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Delete a communication
   */
  deleteCommunication(communicationId: number, clientId: number) {
    this.api.deleteCommunication(communicationId).pipe(
      tap(() => {
        const current = this.state.value;
        const updatedSelected = current.selectedClient?.id === clientId
          ? { ...current.selectedClient, communications: current.selectedClient.communications?.filter(c => c.id !== communicationId) }
          : current.selectedClient;
        this.state.next({ ...current, selectedClient: updatedSelected });
        this.events.emit(AppEventType.COMMUNICATION_DELETED, {
          communicationId,
          clientId,
        });
      }),
      catchError((err: { message: string }) => {
        this.events.emit(AppEventType.CLIENT_ERROR, err.message);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Clear selected client
   */
  clearSelection() {
    const current = this.state.value;
    this.state.next({ ...current, selectedClient: null });
  }

  /**
   * Refresh data if a client is currently selected
   */
  private refreshIfActive() {
    const current = this.state.value;
    if (current.selectedClient) {
      this.loadClient(current.selectedClient.id);
    }
  }

  private patchState(partial: Partial<ClientsState>) {
    const current = this.state.value;
    this.state.next({ ...current, ...partial });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
