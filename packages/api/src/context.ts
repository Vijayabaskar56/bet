import { auth } from "@betting/auth/index";
import type { Context as ElysiaContext } from "elysia";
export type CreateContextOptions = {
  context: ElysiaContext;
};


export async function createContext({ context }: CreateContextOptions) {
  const sessionData = await auth.api.getSession({
    headers: context.request.headers
  })

  if (!sessionData?.session || !sessionData?.user) {
    return {
      session: null,
      user: null,
    };
  }
  return {
    session: sessionData.session,
    user: sessionData.user,
  };
}


export type Context = Awaited<ReturnType<typeof createContext>>;
