import type { BetterAuthClientPlugin } from "better-auth/client";
import type { adminLockedPlugin } from "./index";

type AdminLockedPlugin = typeof adminLockedPlugin;

/**
 * Admin Locked Client Plugin
 *
 * Provides client-side API to interact with the lock/unlock endpoints.
 *
 * Usage:
 * ```ts
 * const authClient = createAuthClient({
 *   plugins: [adminLockedClientPlugin()]
 * });
 *
 * // Lock a user
 * await authClient.adminLocked.lockUser({
 *   userId: "user_id",
 *   reason: "Suspicious activity"
 * });
 *
 * // Unlock a user
 * await authClient.adminLocked.unlockUser({
 *   userId: "user_id"
 * });
 * ```
 */
export const adminLockedClientPlugin = () => {
  return {
    id: "adminLocked",
    $InferServerPlugin: {} as ReturnType<AdminLockedPlugin>,
    getActions: ($fetch) => ({
      adminLocked: {
        /**
         * Lock a user from performing certain actions
         * @param userId - The ID of the user to lock
         * @param reason - Optional reason for locking
         */
        lockUser: async (options: { userId: string; reason?: string }) => {
          return $fetch("/admin/lock-user", {
            method: "POST",
            body: options,
          });
        },
        /**
         * Unlock a user, restoring their ability to perform actions
         * @param userId - The ID of the user to unlock
         */
        unlockUser: async (options: { userId: string }) => {
          return $fetch("/admin/unlock-user", {
            method: "POST",
            body: options,
          });
        },
      },
    }),
  } satisfies BetterAuthClientPlugin;
};
