import type { BetterAuthPlugin, User } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

/**
 * Soft Delete Plugin
 *
 * This plugin provides delete/restore functionality for users.
 * Instead of a simple boolean, it tracks when and by whom the user was deleted.
 *
 * Endpoints:
 * - POST /admin/soft-delete-user - Delete a user with optional reason
 * - POST /admin/restore-user - Restore a user
 */
export const softDeletePlugin = () =>
  ({
    id: "softDelete",
    schema: {
      user: {
        fields: {
          deletedAt: {
            type: "date",
            required: false,
          },
          deletedBy: {
            type: "string",
            required: false,
          },
        },
      },
    },
    endpoints: {
      softDeleteUser: createAuthEndpoint(
        "/admin/soft-delete-user",
        {
          method: "POST",
          body: z.object({
            userId: z.string(),
          }),
          use: [sessionMiddleware],
          metadata: {
            openapi: {
              description: "Soft delete a user",
              responses: {
                200: {
                  description: "User deleted successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          user: {
                            type: "object",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          const { userId } = ctx.body;
          const session = ctx.context.session;

          // Check if user has admin privileges
          const userRole = (session.user as User & { role?: string }).role;
          if (userRole !== "admin" && userRole !== "superadmin") {
            throw ctx.error("FORBIDDEN", {
              message: "You do not have permission to delete users",
            });
          }

          // Find the user to delete
          const userToDelete = await ctx.context.adapter.findOne<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
          });

          if (!userToDelete) {
            throw ctx.error("NOT_FOUND", {
              message: "User not found",
            });
          }

          // Prevent deleting self
          if (userToDelete.id === session.user.id) {
            throw ctx.error("BAD_REQUEST", {
              message: "You cannot delete yourself",
            });
          }

          // Update the user
          const updatedUser = await ctx.context.adapter.update<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
            update: {
              deletedAt: new Date(),
              deletedBy: session.user.id,
            },
          });

          if (!updatedUser) {
            throw ctx.error("INTERNAL_SERVER_ERROR", {
              message: "Failed to update user",
            });
          }

          return ctx.json({
            success: true,
            user: {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              deletedAt: (updatedUser as any).deletedAt,
              deletedBy: (updatedUser as any).deletedBy,
            },
          });
        },
      ),
      restoreUser: createAuthEndpoint(
        "/admin/restore-user",
        {
          method: "POST",
          body: z.object({
            userId: z.string(),
          }),
          use: [sessionMiddleware],
          metadata: {
            openapi: {
              description: "Restore a deleted user",
              responses: {
                200: {
                  description: "User restored successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          user: {
                            type: "object",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          const { userId } = ctx.body;
          const session = ctx.context.session;

          // Check if user has admin privileges
          const userRole = (session.user as User & { role?: string }).role;
          if (userRole !== "admin" && userRole !== "superadmin") {
            throw ctx.error("FORBIDDEN", {
              message: "You do not have permission to restore users",
            });
          }

          // Find the user to restore
          const userToRestore = await ctx.context.adapter.findOne<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
          });

          if (!userToRestore) {
            throw ctx.error("NOT_FOUND", {
              message: "User not found",
            });
          }

          // Update the user
          const updatedUser = await ctx.context.adapter.update<User>({
            model: "user",
            where: [{ field: "id", value: userId }],
            update: {
              deletedAt: null,
              deletedBy: null,
            },
          });

          if (!updatedUser) {
            throw ctx.error("INTERNAL_SERVER_ERROR", {
              message: "Failed to update user",
            });
          }

          return ctx.json({
            success: true,
            user: {
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              deletedAt: null,
              deletedBy: null,
            },
          });
        },
      ),
      listDeletedUsers: createAuthEndpoint(
        "/admin/list-deleted-user",
        {
          method: "GET",
          use: [sessionMiddleware],
          metadata: {
            openapi: {
              description: "List all soft-deleted users",
              responses: {
                200: {
                  description: "List of deleted users",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          users: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                deletedAt: { type: "string", format: "date-time" },
                                deletedBy: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        async (ctx) => {
          const session = ctx.context.session;

          // Check if user has admin privileges
          const userRole = (session.user as User & { role?: string }).role;
          if (userRole !== "admin" && userRole !== "superadmin") {
            throw ctx.error("FORBIDDEN", {
              message: "You do not have permission to list deleted users",
            });
          }

          const deletedUsers = await ctx.context.adapter.findMany<User & { deletedAt: Date; deletedBy: string }>({
            model: "user",
            where: [
              {
                field: "deletedAt",
                operator: "ne",
                value: null,
              },
            ],
          });

          return ctx.json({
            success: true,
            users: deletedUsers.map((u) => ({
              id: u.id,
              name: u.name,
              deletedAt: u.deletedAt,
              deletedBy: u.deletedBy,
            })),
          });
        },
      ),
    },
  }) satisfies BetterAuthPlugin;
