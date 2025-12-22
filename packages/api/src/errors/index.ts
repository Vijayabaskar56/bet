import { os } from "@orpc/server";
import { z } from "zod";

const base = os.errors({
  RATE_LIMITED: {
    data: z.object({
      retryAfter: z.number(),
    }),
  },
  UNAUTHORIZED: {},
});