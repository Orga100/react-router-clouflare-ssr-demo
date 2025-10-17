import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";
import { createRequestHandler } from "react-router";
import type { Context, Env as HonoEnv } from "hono";
import type { IncomingRequestCfProperties } from "@cloudflare/workers-types";

// Define the Cloudflare environment type
interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
  // Cloudflare Worker environment variables
  WORKER_REGION?: string;
  VALUE_FROM_CLOUDFLARE?: string;
  MOCK_API: boolean;
  // KV Namespace for storing TODOs
  TODOS_KV: KVNamespace;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

type AppContext = Context<{ Bindings: Env }>;
const app = new Hono<{ Bindings: Env }>();

// Preload all mock data files at build time
const mockDataModules = import.meta.glob("../mock-data/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

// Load mock data from files
async function loadMockData(c: AppContext, filename: string): Promise<any> {
  // Check if mock API is enabled
  if (c.env.MOCK_API !== true) {
    throw new Error("Mock API is disabled");
  }

  // Security check - only allow alphanumeric filenames (with optional .json extension)
  if (!/^[a-zA-Z0-9-]+(\.json)?$/.test(filename)) {
    throw new Error("Invalid filename");
  }

  // Add .json extension if missing
  const normalizedFilename = filename.endsWith(".json")
    ? filename
    : `${filename}.json`;
  const filePath = `../mock-data/${normalizedFilename}`;

  try {
    // Try to fetch from assets first (production)
    if (c.env.ASSETS) {
      const url = new URL(`/mock-data/${normalizedFilename}`, c.req.url);
      const response = await c.env.ASSETS.fetch(new Request(url.toString()));
      if (response.ok) {
        return await response.json();
      }
    }

    // Use preloaded modules in development
    if (
      mockDataModules[filePath] &&
      typeof mockDataModules[filePath] === "string"
    ) {
      return JSON.parse(mockDataModules[filePath] as string);
    }

    throw new Error("File not found");
  } catch (error) {
    console.error(`Error loading mock data file ${filename}:`, error);
    throw error;
  }
}

// API endpoints for TODOS
const todos = new Hono<{ Bindings: Env }>();

// Get all TODOs
todos.get("/", async (c) => {
  try {
    const keys = await c.env.TODOS_KV.list();
    const todos = await Promise.all(
      keys.keys.map(async (key) => {
        const value = await c.env.TODOS_KV.get<Todo>(key.name, "json");
        return value ? { ...value, id: key.name } : null;
      })
    );
    return c.json(todos.filter(Boolean));
  } catch (error) {
    console.error("Error fetching TODOs:", error);
    return c.json({ error: "Failed to fetch TODOs" }, 500);
  }
});

// Create a new TODO
todos.post("/", async (c) => {
  try {
    const todo = await c.req.json();
    const id = crypto.randomUUID();
    const newTodo = {
      ...todo,
      id,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await c.env.TODOS_KV.put(id, JSON.stringify(newTodo));
    return c.json(newTodo, 201);
  } catch (error) {
    console.error("Error creating TODO:", error);
    return c.json({ error: "Failed to create TODO" }, 500);
  }
});

// Update a TODO
todos.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const updates = await c.req.json();
    const existing = await c.env.TODOS_KV.get(id, "json");

    if (!existing) {
      return c.json({ error: "TODO not found" }, 404);
    }

    const updatedTodo = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await c.env.TODOS_KV.put(id, JSON.stringify(updatedTodo));
    return c.json(updatedTodo);
  } catch (error) {
    console.error("Error updating TODO:", error);
    return c.json({ error: "Failed to update TODO" }, 500);
  }
});

// Delete a TODO
todos.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    await c.env.TODOS_KV.delete(id);
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting TODO:", error);
    return c.json({ error: "Failed to delete TODO" }, 500);
  }
});

// Mount the todos routes
app.route("/api/todos", todos);

// API route for mock data files
app.get("/api/:filename", async (c: AppContext) => {
  const { filename } = c.req.param();

  try {
    const data = await loadMockData(c, filename);
    return c.json(data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Invalid filename") {
        return c.json({ error: error.message }, 400);
      }
      if (error.message === "Mock API is disabled") {
        return c.json({ error: error.message }, 403);
      }
    }
    console.error(`Error loading mock data file ${filename}:`, error);
    return c.json({ error: "File not found" }, 404);
  }
});

// Serve other static files through ASSETS binding
app.get("/public/*", async (c: AppContext) => {
  try {
    if (c.env.ASSETS) {
      const response = await c.env.ASSETS.fetch(c.req.raw);
      if (response.ok) {
        return response;
      }
    }
    return c.notFound();
  } catch (error) {
    console.error("Error serving static file:", error);
    return c.notFound();
  }
});

// Add routes
app.get("/test", (c) => {
  const val = c.req.query("val");
  return c.text(val || "No val parameter provided");
});

const createFetchInternal =
  (
    app: Hono<{ Bindings: Env }>,
    baseUrl: string,
    cf: IncomingRequestCfProperties,
    env: Env,
    executionCtx?: ExecutionContext
  ) =>
  async (path: string, options: RequestInit = {}) => {
    const url = new URL(path, baseUrl);
    const request = new Request(url.toString(), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    try {
      // Try to use the Hono app's fetch first
      if (executionCtx) {
        return await app.fetch(request, {
          ...env,
          cf,
          executionCtx,
        });
      }

      // Fallback to direct fetch if no execution context
      return await fetch(request);
    } catch (error) {
      console.error("Error in fetchInternal:", error);
      throw error;
    }
  };

// Handle all other routes with React Router
app.all("*", (c: AppContext) => {
  const requestHandler = createRequestHandler(
    () => import("virtual:react-router/server-build"),
    import.meta.env.MODE
  );

  return requestHandler(c.req.raw, {
    cloudflare: { env: c.env, ctx: c.executionCtx },
    honoApp: app,
    fetchInternal: createFetchInternal(
      app,
      c.req.url,
      c.req.raw.cf as IncomingRequestCfProperties,
      c.env,
      c.executionCtx
    ),
    clientTimezone: c.req.raw.cf?.timezone,
  });
});

export default app;
