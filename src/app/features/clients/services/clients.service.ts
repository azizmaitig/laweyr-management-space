import { Injectable, inject } from '@angular/core';
import { Client } from '../../../core/models';
import { DataService } from '../../../core/services/data.service';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private data = inject(DataService);

  getAll(): Client[] {
    return this.data.getClients();
  }

  getById(id: number): Client | undefined {
    return this.data.getClients().find(c => c.id === id);
  }
}
