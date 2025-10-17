import {
  Link,
  useFetcher,
  useLoaderData,
  useActionData,
  useNavigation,
  useSubmit,
  Form,
  useRouteError,
  isRouteErrorResponse,
} from "react-router";
import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useMemo,
} from "react";
import { Button, TextField, IconButton, Progress } from "@radix-ui/themes";
import {
  Pencil1Icon,
  Cross2Icon,
  CheckIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useToast } from "../context/toast-context";
import styles from "./todos.module.css";

export function meta() {
  return [
    { title: "Todo List" },
    { name: "description", content: "Manage your todos" },
  ];
}

export function shouldRevalidate({
  actionResult,
  defaultShouldRevalidate,
}: {
  actionResult?: { shouldRevalidate?: boolean };
  defaultShouldRevalidate: boolean;
}) {
  if (actionResult?.shouldRevalidate === false) {
    return false;
  }

  return defaultShouldRevalidate;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  priority: number; // 1 = highest priority
  createdAt: string;
  updatedAt?: string;
  pendingDelete?: boolean;
  pendingDeletion?: boolean;
  pendingUpdate?: boolean;
  deleteTimer?: number;
}

function getPreferredLocale(acceptLanguage: string | null): string {
  if (!acceptLanguage) return "en-US";
  // Get the first language from the Accept-Language header
  const preferredLang = acceptLanguage.split(",")[0].trim().split("-");
  const language = preferredLang[0];
  const region = preferredLang[1] || language.toUpperCase();
  return `${language}-${region}`;
}

export async function loader({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  try {
    const response = await context.fetchInternal("/api/todos");
    if (!response.ok)
      throw new Error(
        `Failed to load todos (Status: ${response.status} ${response.statusText})`
      );
    const todos = await response.json();

    // Get the preferred locale from the Accept-Language header
    const acceptLanguage = request.headers.get("accept-language");
    const locale = getPreferredLocale(acceptLanguage);

    return {
      todos,
      locale,
      clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch (error) {
    console.error("Error in todos loader:", error);
    throw error;
  }
}

export async function action({
  request,
  context,
}: {
  request: Request;
  context: any;
}) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get the base URL for the API
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Create a fetch function that works in both server and client contexts
  const fetchApi = async (path: string, options: RequestInit = {}) => {
    if (context?.fetchInternal) {
      // Use the internal fetch when available (server-side)
      return context.fetchInternal(`/api${path}`, options);
    }

    // Fallback to direct fetch (client-side)
    const apiUrl = new URL(`/api${path}`, baseUrl).toString();
    return fetch(apiUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  };

  try {
    switch (intent) {
      case "create": {
        const title = formData.get("title")?.toString().trim();
        if (!title) throw new Error("Title is required");

        const newTodo = {
          title,
          completed: false,
          createdAt: new Date().toISOString(),
        };

        const response = await fetchApi("/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTodo),
        });

        if (!response.ok)
          throw new Error(
            `Failed to create todo (Status: ${response.status} ${response.statusText})`
          );
        return {
          intent: "create",
          data: await response.json(),
          shouldRevalidate: false,
        };
      }

      case "update": {
        const id = formData.get("id")?.toString();
        const title = formData.get("title")?.toString();
        const completed = formData.get("completed");

        if (!id) throw new Error("Todo ID is required");

        const updates: any = { id };
        if (title !== null) updates.title = title;
        if (completed !== null) updates.completed = completed === "true";

        const response = await fetchApi(`/todos/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to update todo (Status: ${response.status} ${response.statusText})`
          );
        }

        try {
          const result = await response.json();
          return { intent: "update", data: result, shouldRevalidate: false };
        } catch (e) {
          console.error("Failed to parse update response:", e);
          throw new Error("Invalid response from server");
        }
      }

      case "delete": {
        const id = formData.get("id")?.toString();
        if (!id) throw new Error("Todo ID is required");

        const response = await fetchApi(`/todos/${id}`, {
          method: "DELETE",
        });

        if (!response.ok)
          throw new Error(
            `Failed to delete todo (Status: ${response.status} ${response.statusText})`
          );
        return { intent: "delete", data: { id }, shouldRevalidate: false };
      }

      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  } catch (error) {
    console.error(`Error in todo action (${intent}):`, error);
    return {
      intent: "error",
      data: {
        error: error instanceof Error ? error.message : "An error occurred",
      },
    };
  }
}

type ActionData =
  | { intent: "create"; data: Todo }
  | { intent: "update"; data: Todo }
  | { intent: "delete"; data: { id: string } }
  | { intent: "error"; data: { error: string } };

interface LoaderData {
  todos: Todo[];
  locale: string;
  clientTimezone: string;
}

export default function TodosPage() {
  const {
    todos: initialTodos,
    locale,
    clientTimezone,
  } = useLoaderData<LoaderData>();

  const formatDateTime = useCallback(
    (date: Date | string): string => {
      try {
        const dateObj = new Date(date);
        return new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: clientTimezone || undefined,
        }).format(dateObj);
      } catch (error) {
        console.error("Error formatting date:", error);
        return typeof date === "string" ? date : date.toLocaleString();
      }
    },
    [locale, clientTimezone]
  );

  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const newTodoInputRef = useRef<HTMLInputElement>(null);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editTodoTitle, setEditTodoTitle] = useState("");
  const { addToast } = useToast();
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const deletingTodoIdRef = useRef<string | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const [animatingFilter, setAnimatingFilter] = useState<string | null>(null);
  const prevCountsRef = useRef({ all: 0, active: 0, completed: 0 });

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todos]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return sortedTodos.filter((todo) => !todo.completed);
      case "completed":
        return sortedTodos.filter((todo) => todo.completed);
      default:
        return sortedTodos;
    }
  }, [sortedTodos, filter]);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  // Track count changes and trigger animations based on active filter
  useEffect(() => {
    const currentCounts = {
      all: sortedTodos.length,
      active: sortedTodos.filter((t) => !t.completed).length,
      completed: sortedTodos.filter((t) => t.completed).length,
    };

    const prevCounts = prevCountsRef.current;

    // Skip animation on initial load
    if (prevCounts.all !== 0) {
      // When "completed" filter is active
      if (filter === "completed") {
        // New todo created OR todo unchecked -> highlight "active"
        if (currentCounts.active > prevCounts.active) {
          setAnimatingFilter("active");
          setTimeout(() => setAnimatingFilter(null), 600);
        }
      }
      // When "active" filter is active
      else if (filter === "active") {
        // Todo checked -> highlight "completed"
        if (currentCounts.completed > prevCounts.completed) {
          setAnimatingFilter("completed");
          setTimeout(() => setAnimatingFilter(null), 600);
        }
      }
    }

    prevCountsRef.current = currentCounts;
  }, [sortedTodos, filter]);

  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const submit = useSubmit();

  // Handle action responses and errors
  useEffect(() => {
    if (navigation.state !== "idle") return;

    if (actionData?.intent === "error") {
      addToast({
        title: "Error",
        description: actionData.data.error,
        duration: 3000,
      });
      setSrAnnouncement(`Error: ${actionData.data.error}`);
    } else if (actionData?.intent === "delete") {
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== actionData.data.id)
      );
      setDeletingTodoId(null);
      deletingTodoIdRef.current = null;
      setSrAnnouncement("Todo deleted");
    } else if (actionData?.intent === "update") {
      const updatedTodo = actionData.data;
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
        )
      );
      setEditingTodoId(null);
      setSrAnnouncement(`Todo "${updatedTodo.title}" updated`);
    } else if (actionData?.intent === "create") {
      setTodos((prevTodos) => [...prevTodos, actionData.data]);
      setNewTodoTitle("");
      newTodoInputRef.current?.focus();
      setSrAnnouncement(`Todo "${actionData.data.title}" added`);
    }
  }, [actionData, navigation.state]);

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || navigation.state === "submitting") return;

    const newTodo = {
      title: newTodoTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add the todo
    setNewTodoTitle("");

    const formData = new FormData();
    formData.append("intent", "create");
    formData.append("title", newTodo.title);

    submit(formData, {
      method: "post",
      action: "/todos",
      replace: true,
    });
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    if (navigation.state != "idle") return;

    const newCompleted = !completed;

    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("id", id);
    formData.append("completed", String(newCompleted));

    submit(formData, {
      method: "post",
      action: "/todos",
      replace: true,
    });
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditTodoTitle(todo.title);
  };

  const handleSaveEdit = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    if (!editingTodoId || !editTodoTitle.trim() || navigation.state != "idle")
      return;

    const updatedTitle = editTodoTitle.trim();

    const formData = new FormData();
    formData.append("intent", "update");
    formData.append("id", editingTodoId);
    formData.append("title", updatedTitle);

    submit(formData, {
      method: "post",
      action: "/todos",
    });
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null);
    setEditTodoTitle("");
  };

  const handleDeleteTodo = (id: string) => {
    if (deletingTodoId) return;

    deletingTodoIdRef.current = id;
    setDeletingTodoId(id);
    const toastId = `todo-delete-${id}`;

    addToast({
      id: toastId,
      title: "Todo Deleted",
      description: "Todo has been deleted. Click to undo.",
      duration: 1000,
      action: {
        label: "Undo",
        onClick: () => {
          handleUndoDelete(id);
          // The toast will be removed by the handleUndoDelete function
        },
      },
      onDismiss: async () => {
        if (deletingTodoIdRef.current === id) {
          const formData = new FormData();
          formData.append("intent", "delete");
          formData.append("id", id);

          await submit(formData, {
            method: "post",
            action: "/todos",
          });
        }
      },
    });
  };

  const { removeToastById } = useToast();

  const handleUndoDelete = (id: string) => {
    deletingTodoIdRef.current = null;
    setDeletingTodoId(null);
    const toastId = `todo-delete-${id}`;
    removeToastById(toastId);
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <main className={styles.container}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={styles.visuallyHidden}
      >
        {srAnnouncement}
      </div>
      <header className={styles.headerContainer}>
        <h1>Todo List</h1>
        {totalCount > 0 && (
          <div className={styles.statsContainer}>
            <div className={styles.statsText}>
              <span className={styles.completedCount}>{completedCount}</span>
              <span className={styles.statseparator}>of</span>
              <span className={styles.totalCount}>{totalCount}</span>
              <span className={styles.statsLabel}>completed</span>
            </div>
            <Progress
              value={completionPercentage}
              max={100}
              className={styles.progressBar}
            />
          </div>
        )}
      </header>

      <section aria-labelledby="add-todo-heading">
        <h2 id="add-todo-heading" className={styles.visuallyHidden}>
          Add New Todo
        </h2>
        <Form
          method="post"
          action="/todos"
          onSubmit={handleAddTodo}
          className={styles.todoForm}
        >
          <div className={styles.todoFormContent}>
            <div className={styles.todoInput}>
              <label htmlFor="new-todo-input" className={styles.visuallyHidden}>
                Todo title
              </label>
              <input type="hidden" name="intent" value="create" />
              <TextField.Root
                id="new-todo-input"
                name="title"
                value={newTodoTitle}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewTodoTitle(e.target.value)
                }
                placeholder="Add a new todo..."
                size="3"
                disabled={navigation.state != "idle"}
                ref={newTodoInputRef}
              />
            </div>
            <Button
              type="submit"
              size="3"
              variant="solid"
              disabled={
                navigation.state != "idle" || newTodoTitle.trim() === ""
              }
              aria-label="Add new todo"
            >
              Add
            </Button>
          </div>
        </Form>
      </section>

      <section aria-labelledby="todo-list-heading">
        <h2 id="todo-list-heading" className={styles.visuallyHidden}>
          Your Todos
        </h2>
        {sortedTodos.length > 0 && (
          <div className={styles.filterContainer}>
            <button
              className={[
                styles.filterButton,
                filter === "all" && styles.filterActive,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setFilter("all")}
              aria-pressed={filter === "all"}
            >
              All ({sortedTodos.length})
            </button>
            <button
              className={[
                styles.filterButton,
                filter === "active" && styles.filterActive,
                animatingFilter === "active" && styles.filterAnimating,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setFilter("active")}
              aria-pressed={filter === "active"}
            >
              Active ({sortedTodos.filter((t) => !t.completed).length})
            </button>
            <button
              className={[
                styles.filterButton,
                filter === "completed" && styles.filterActive,
                animatingFilter === "completed" && styles.filterAnimating,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setFilter("completed")}
              aria-pressed={filter === "completed"}
            >
              Completed ({sortedTodos.filter((t) => t.completed).length})
            </button>
          </div>
        )}
        {sortedTodos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📝</div>
            <h3 className={styles.emptyStateTitle}>No todos yet</h3>
            <p className={styles.emptyStateDescription}>
              Start organizing your tasks by adding your first todo above.
            </p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🔍</div>
            <h3 className={styles.emptyStateTitle}>No {filter} todos</h3>
            <p className={styles.emptyStateDescription}>
              {filter === "active" && "All tasks are completed! Great job!"}
              {filter === "completed" &&
                "No completed tasks yet. Start checking off your todos!"}
            </p>
          </div>
        ) : (
          <ul className={styles.todoList} aria-label="Todo items">
            {filteredTodos.map((todo) => (
              <li
                key={todo.id}
                className={`${styles.todoItem} ${
                  deletingTodoId === todo.id ? styles.pendingDelete : ""
                } ${todo.completed ? styles.completed : ""}`}
              >
                <article className={styles.todoContent}>
                  <Checkbox.Root
                    checked={todo.completed}
                    onCheckedChange={() =>
                      handleToggleComplete(todo.id, todo.completed)
                    }
                    className={styles.todoCheckbox}
                    id={`todo-${todo.id}`}
                    disabled={navigation.state != "idle"}
                    aria-label={`Mark "${todo.title}" as ${
                      todo.completed ? "incomplete" : "complete"
                    }`}
                  >
                    <Checkbox.Indicator className={styles.checkboxIndicator}>
                      ✓
                    </Checkbox.Indicator>
                  </Checkbox.Root>

                  {editingTodoId === todo.id ? (
                    <div className={styles.todoEditInput}>
                      <TextField.Root
                        value={editTodoTitle}
                        disabled={navigation.state != "idle"}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setEditTodoTitle(e.target.value)
                        }
                        autoFocus={true}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        size="3"
                        aria-label="Edit todo title"
                      />
                    </div>
                  ) : (
                    <label
                      htmlFor={`todo-${todo.id}`}
                      className={styles.todoText}
                    >
                      {todo.title}
                    </label>
                  )}
                  <footer className={styles.todoDates}>
                    <time dateTime={todo.updatedAt || todo.createdAt}>
                      {formatDateTime(todo.updatedAt || todo.createdAt)}
                    </time>
                  </footer>
                </article>
                <aside
                  className={styles.todoActions}
                  aria-label="Todo item actions"
                >
                  {editingTodoId === todo.id ? (
                    <>
                      <IconButton
                        disabled={navigation.state != "idle"}
                        onClick={handleSaveEdit}
                        color="green"
                        variant="soft"
                        size="3"
                        className={styles.saveEditButton}
                        aria-label="Save edit"
                      >
                        <CheckIcon width="24" height="24" />
                      </IconButton>
                      <IconButton
                        disabled={navigation.state != "idle"}
                        onClick={handleCancelEdit}
                        color="gray"
                        variant="soft"
                        size="3"
                        aria-label="Cancel edit"
                      >
                        <Cross2Icon width="24" height="24" />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton
                        onClick={(e: React.MouseEvent) => handleEditTodo(todo)}
                        color="blue"
                        variant="ghost"
                        size="3"
                        className={styles.editActionButton}
                        aria-label="Edit todo"
                        disabled={navigation.state != "idle"}
                      >
                        <Pencil1Icon width="24" height="24" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteTodo(todo.id)}
                        color="red"
                        variant="ghost"
                        size="3"
                        aria-label="Delete todo"
                        disabled={navigation.state != "idle"}
                      >
                        <TrashIcon width="24" height="24" />
                      </IconButton>
                    </>
                  )}
                </aside>{" "}
                {/* End of todo actions */}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const { addToast } = useToast();

  let errorMessage = "An unexpected error occurred";
  let errorStatus = 500;

  if (isRouteErrorResponse(error)) {
    errorMessage = error.data || error.statusText;
    errorStatus = error.status;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  useEffect(() => {
    addToast({
      title: "Todo Error",
      description: errorMessage,
      duration: 5000,
    });
  }, [errorMessage, addToast]);

  return (
    <main className={styles.container}>
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h1 className={styles.errorTitle}>
          {errorStatus === 404 ? "Todos Not Found" : "Error Loading Todos"}
        </h1>
        <p className={styles.errorMessage}>{errorMessage}</p>
        <div className={styles.errorActions}>
          <Button asChild size="3">
            <Link to="/todos">Try Again</Link>
          </Button>
          <Button asChild variant="soft" size="3">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
