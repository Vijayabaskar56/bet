import type { Context as ElysiaContext } from "elysia";


export type CreateContextOptions = {
  context: ElysiaContext;
};

export async function createContext({ context }: CreateContextOptions) {
  // TODO: Add auth session
  let session = null;
  return {
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
