import type { BetterAuthClientPlugin } from "better-auth/client";
import type { softDeletePlugin } from "./index";

type SoftDeletePlugin = typeof softDeletePlugin;

/**
 * Soft Delete Client Plugin
 *
 * Provides client-side API to interact with the delete/restore endpoints.
 *
 * Usage:
 * ```ts
 * const authClient = createAuthClient({
 *   plugins: [softDeleteClientPlugin()]
 * });
 *
 * // Soft delete a user
 * await authClient.softDelete.softDeleteUser({
 *   userId: "user_id"
 * });
 *
 * // Restore a user
 * await authClient.softDelete.restoreUser({
 *   userId: "user_id"
 * });
 * ```
 */
export const softDeleteClientPlugin = () => {
  return {
    id: "softDelete",
    $InferServerPlugin: {} as ReturnType<SoftDeletePlugin>,
    getActions: ($fetch) => ({
      softDelete: {
        /**
         * Soft delete a user
         * @param userId - The ID of the user to delete
         */
        softDeleteUser: async (options: { userId: string }) => {
          return $fetch("/admin/soft-delete-user", {
            method: "POST",
            body: options,
          });
        },
        /**
         * Restore a user
         * @param userId - The ID of the user to restore
         */
        restoreUser: async (options: { userId: string }) => {
          return $fetch("/admin/restore-user", {
            method: "POST",
            body: options,
          });
        },
        /**
         * List all soft-deleted users
         */
        listDeletedUsers: async () => {
          return $fetch("/admin/list-deleted-user", {
            method: "GET",
          });
        },
      },
    }),
  } satisfies BetterAuthClientPlugin;
};
