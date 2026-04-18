import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Client, Communication } from '../../../core/models';

export interface CreateClientDto {
  name: string;
  cin: string;
  address: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface UpdateClientDto {
  name?: string;
  cin?: string;
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateCommunicationDto {
  clientId: number;
  type: Communication['type'];
  date: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private endpoint = '/clients';

  /**
   * Get all clients
   */
  getAllClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.endpoint);
  }

  /**
   * Get a single client by ID
   */
  getClientById(clientId: number): Observable<Client> {
    return this.http.get<Client>(`${this.endpoint}/${clientId}`);
  }

  /**
   * Create a new client
   */
  createClient(dto: CreateClientDto): Observable<Client> {
    return this.http.post<Client>(this.endpoint, dto);
  }

  /**
   * Update an existing client
   */
  updateClient(clientId: number, dto: UpdateClientDto): Observable<Client> {
    return this.http.put<Client>(`${this.endpoint}/${clientId}`, dto);
  }

  /**
   * Delete a client
   */
  deleteClient(clientId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${clientId}`);
  }

  /**
   * Search clients by keyword
   */
  searchClients(keyword: string): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.endpoint}/search`, { params: { q: keyword } });
  }

  /**
   * Get client's related cases
   */
  getClientCases(clientId: number): Observable<Client['cases']> {
    return this.http.get<Client['cases']>(`${this.endpoint}/${clientId}/cases`);
  }

  /**
   * Get client's financial summary
   */
  getClientFinancial(clientId: number): Observable<Client['financial']> {
    return this.http.get<Client['financial']>(`${this.endpoint}/${clientId}/financial`);
  }

  /**
   * Get client's communication history
   */
  getClientCommunications(clientId: number): Observable<Communication[]> {
    return this.http.get<Communication[]>(`${this.endpoint}/${clientId}/communications`);
  }

  /**
   * Add a communication to a client
   */
  addCommunication(clientId: number, dto: CreateCommunicationDto): Observable<Communication> {
    return this.http.post<Communication>(`${this.endpoint}/${clientId}/communications`, dto);
  }

  /**
   * Delete a communication
   */
  deleteCommunication(communicationId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/communications/${communicationId}`);
  }
}
