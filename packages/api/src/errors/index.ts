import { os } from "@orpc/server";
import { z } from "zod";

export const base = os.errors({
  RATE_LIMITED: {
    data: z.object({
      retryAfter: z.number(),
    }),
  },
  UNAUTHORIZED: {},
});