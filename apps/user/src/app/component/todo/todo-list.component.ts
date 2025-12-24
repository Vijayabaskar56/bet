import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { injectForm, injectStore, TanStackField } from "@tanstack/angular-form";

import {
  injectMutation,
  injectQuery,
  QueryClient,
} from "@tanstack/angular-query-experimental";
import { ORPCService } from "../../services/orpc.service";
@Component({
  selector: "app-todo-list",
  standalone: true,
  imports: [CommonModule, FormsModule, TanStackField],
  styles: [
    `
    .todo-card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
      border: 1px solid #eee;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .todo-header {
      background: var(--primary-color);
      padding: 20px 25px;
      color: var(--primarybtn-text);
    }

    .todo-body {
      padding: 25px;
    }

    .todo-input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 25px;
    }

    .todo-input {
      flex: 1;
      padding: 12px 18px;
      border: 2px solid #f0f0f0;
      border-radius: 8px;
      font-size: 15px;
      transition: all 0.2s ease;
      outline: none;
    }

    .todo-input:focus {
      border-color: var(--primary-color);
      background: #fff;
    }

    .todo-btn-add {
      background: var(--dark-bgcolor);
      color: #fff;
      border: none;
      padding: 0 25px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .todo-btn-add:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .todo-list-container {
      max-height: 450px;
      overflow-y: auto;
      padding-right: 5px;
    }

    .todo-item {
      display: flex;
      align-items: center;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 10px;
      background: #f8f9fa;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }

    .todo-item:hover {
      background: #fff;
      border-color: #eee;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }

    .todo-checkbox {
      width: 22px;
      height: 22px;
      cursor: pointer;
      accent-color: var(--primary-color);
      margin-right: 15px;
    }

    .todo-text {
      flex: 1;
      font-size: 15px;
      color: #333;
      transition: all 0.2s ease;
    }

    .todo-text.completed {
      text-decoration: line-through;
      color: #999;
    }

    .todo-actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .todo-item:hover .todo-actions {
      opacity: 1;
    }

    .btn-action {
      background: none;
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-edit { color: #666; }
    .btn-edit:hover { background: #e9ecef; color: #333; }

    .btn-delete { color: #dc3545; }
    .btn-delete:hover { background: #fff5f5; color: #bd2130; }

    .loading-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 15px;
      display: block;
    }
  `,
  ],
  template: `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="todo-card">
            <div class="todo-header">
              <h3 class="m-0 fw-bold">Task Manager</h3>
              <p class="m-0 opacity-75 small">Organize your day effectively</p>
            </div>

            <div class="todo-body">
              <div class="todo-input-group" [tanstackField]="todoForm" name="todo" #todo="field">
                <input
                  class="todo-input"
                  [name]="todo.api.name"
                  [id]="todo.api.name"
                  [value]="todo.api.state.value"
                  (input)="todo.api.handleChange($any($event).target.value)"
                  placeholder="What needs to be done?"
                  (keyup.enter)="todoForm.handleSubmit()"
                />
                <button
                  type="button"
                  class="todo-btn-add"
                  (click)="todoForm.handleSubmit()"
                  [disabled]="!canSubmit()"
                >
                  <ng-container *ngIf="isSubmitting(); else addText">
                    <div class="loading-spinner"></div>
                  </ng-container>
                  <ng-template #addText>Add</ng-template>
                </button>
              </div>

              <div class="todo-list-container">
                <ng-container *ngIf="queryToDo.data()?.length; else emptyState">
                  <div *ngFor="let item of queryToDo.data(); trackBy: trackById" class="todo-item">
                    <input
                      type="checkbox"
                      class="todo-checkbox"
                      [checked]="item.completed"
                      (change)="onToggle(item)"
                    >

                    <ng-container *ngIf="editingId !== item.id; else editMode">
                      <span class="todo-text" [class.completed]="item.completed">
                        {{ item.text }}
                      </span>

                      <div class="todo-actions">
                        <button class="btn-action btn-edit" (click)="startEdit(item)" title="Edit">
                          <i class="material-icons" style="font-size: 18px;">edit</i>
                        </button>
                        <button class="btn-action btn-delete" (click)="onDelete(item.id)" title="Delete">
                          <i class="material-icons" style="font-size: 18px;">delete_outline</i>
                        </button>
                      </div>
                    </ng-container>

                    <ng-template #editMode>
                      <input
                        #editInput
                        class="todo-input py-1 px-2"
                        [value]="item.text"
                        (keyup.enter)="saveEdit(item.id, editInput.value)"
                        (keyup.escape)="cancelEdit()"
                        (blur)="saveEdit(item.id, editInput.value)"
                        autofocus
                      >
                    </ng-template>
                  </div>
                </ng-container>

                <ng-template #emptyState>
                  <div class="empty-state">
                    <i class="material-icons empty-icon">assignment_late</i>
                    <p class="m-0">No tasks found. Start by adding one!</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TodoListComponent {
  private _orpc = inject(ORPCService);
  queryClient = inject(QueryClient);

  editingId: string | null = null;

  queryToDo = injectQuery(() => this._orpc.utils.todo.getAll.queryOptions());

  mutateToDo = injectMutation(() =>
    this._orpc.utils.todo.create.mutationOptions({
      onSuccess: () => {
        this.queryClient.invalidateQueries({
          queryKey: this._orpc.utils.todo.getAll.key(),
        });
        this.todoForm.reset();
      },
    }),
  );

  updateToDo = injectMutation(() =>
    this._orpc.utils.todo.toggle.mutationOptions({
      onSuccess: () => {
        this.queryClient.invalidateQueries({
          queryKey: this._orpc.utils.todo.getAll.key(),
        });
      },
    }),
  );

  updateTextToDo = injectMutation(() =>
    this._orpc.utils.todo.update.mutationOptions({
      onSuccess: () => {
        this.queryClient.invalidateQueries({
          queryKey: this._orpc.utils.todo.getAll.key(),
        });
        this.editingId = null;
      },
    }),
  );

  deleteTodo = injectMutation(() =>
    this._orpc.utils.todo.delete.mutationOptions({
      onSuccess: () => {
        this.queryClient.invalidateQueries({
          queryKey: this._orpc.utils.todo.getAll.key(),
        });
      },
    }),
  );

  todoForm = injectForm({
    defaultValues: {
      todo: "",
    },
    onSubmit: ({ value }) => {
      if (value.todo.trim()) {
        this.mutateToDo.mutate({ text: value.todo });
      }
    },
  });

  canSubmit = injectStore(this.todoForm, (state) => state.canSubmit);
  isSubmitting = injectStore(this.todoForm, (state) => state.isSubmitting);

  trackById(index: number, item: any) {
    return item.id;
  }

  onToggle(item: any) {
    this.updateToDo.mutate({ id: item.id, completed: !item.completed });
  }

  onDelete(id: string) {
    if (confirm("Are you sure you want to delete this task?")) {
      this.deleteTodo.mutate({ id });
    }
  }

  startEdit(item: any) {
    this.editingId = item.id;
  }

  saveEdit(id: string, newText: string) {
    if (!newText.trim()) {
      this.cancelEdit();
      return;
    }
    this.updateTextToDo.mutate({ id, text: newText });
  }

  cancelEdit() {
    this.editingId = null;
  }
}
