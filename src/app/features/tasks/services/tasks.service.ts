import { Injectable, inject } from '@angular/core';
import { DataService } from '../../../core/services/data.service';
import { Task } from '../../../core/models';

@Injectable({ providedIn: 'root' })
export class TasksService {
  private data = inject(DataService);

  getAll(): Task[] {
    return this.data.tasks;
  }

  getByCaseId(caseId: number): Task[] {
    return this.data.getTasks(caseId);
  }

  getTodayTasks(): Task[] {
    return this.data.getTodayTasks();
  }

  add(task: Task) {
    this.data.tasks.push(task);
  }

  update(id: number, updates: Partial<Task>) {
    const task = this.data.tasks.find(t => t.id === id);
    if (task) Object.assign(task, updates);
  }

  delete(id: number) {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
  }
}
