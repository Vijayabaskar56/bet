import type { LoggerContext } from "@orpc/experimental-pino";
import type { Context as ElysiaContext } from "elysia";

export type CreateContextOptions = {
  context: ElysiaContext;
};

export type Session = {
  user: {
    id: string;
    email: string;
  };
} | null;

export type Context = {
  session: Session;
} & LoggerContext;

export async function createContext({ context: _context }: CreateContextOptions): Promise<Context> {
  // TODO: Add auth session
  let session: Session = null;
  return {
    session,
  } as Context;
}
