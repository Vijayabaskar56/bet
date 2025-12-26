import type { BetterAuthPlugin, User } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

/**
 * Admin Locked Plugin
 *
 * This plugin provides lock/unlock functionality for users.
 * Unlike ban (which prevents login entirely), locked users can still
 * log in but are restricted from certain application-specific actions
 * (e.g., placing bets, trading, etc.)
 *
 * Endpoints:
 * - POST /admin/lock-user - Lock a user with optional reason
 * - POST /admin/unlock-user - Unlock a user
 */
export const adminLockedPlugin = () =>
	({
		id: "adminLocked",
		schema: {
			user: {
				fields: {
					isLocked: {
						type: "boolean",
						defaultValue: false,
						required: false,
					},
					lockReason: {
						type: "string",
						required: false,
					},
				},
			},
		},
		endpoints: {
			lockUser: createAuthEndpoint(
				"/admin/lock-user",
				{
					method: "POST",
					body: z.object({
						userId: z.string(),
						reason: z.string().optional(),
					}),
					use: [sessionMiddleware],
					metadata: {
						openapi: {
							description: "Lock a user from performing certain actions",
							responses: {
								200: {
									description: "User locked successfully",
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
					const { userId, reason } = ctx.body;
					const session = ctx.context.session;

					// Check if user has admin privileges
					const userRole = (session.user as User & { role?: string }).role;
					if (userRole !== "admin" && userRole !== "superadmin") {
						throw ctx.error("FORBIDDEN", {
							message: "You do not have permission to lock users",
						});
					}

					// Find the user to lock
					const userToLock = await ctx.context.adapter.findOne<User>({
						model: "user",
						where: [{ field: "id", value: userId }],
					});

					if (!userToLock) {
						throw ctx.error("NOT_FOUND", {
							message: "User not found",
						});
					}

					// Prevent locking self
					if (userToLock.id === session.user.id) {
						throw ctx.error("BAD_REQUEST", {
							message: "You cannot lock yourself",
						});
					}

					// Update the user
					const updatedUser = await ctx.context.adapter.update<User>({
						model: "user",
						where: [{ field: "id", value: userId }],
						update: {
							isLocked: true,
							lockReason: reason ?? "Locked by administrator",
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
							isLocked: true,
							lockReason: reason ?? "Locked by administrator",
						},
					});
				},
			),
			unlockUser: createAuthEndpoint(
				"/admin/unlock-user",
				{
					method: "POST",
					body: z.object({
						userId: z.string(),
					}),
					use: [sessionMiddleware],
					metadata: {
						openapi: {
							description:
								"Unlock a user, restoring their ability to perform actions",
							responses: {
								200: {
									description: "User unlocked successfully",
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
							message: "You do not have permission to unlock users",
						});
					}

					// Find the user to unlock
					const userToUnlock = await ctx.context.adapter.findOne<User>({
						model: "user",
						where: [{ field: "id", value: userId }],
					});

					if (!userToUnlock) {
						throw ctx.error("NOT_FOUND", {
							message: "User not found",
						});
					}

					// Update the user
					const updatedUser = await ctx.context.adapter.update<User>({
						model: "user",
						where: [{ field: "id", value: userId }],
						update: {
							isLocked: false,
							lockReason: null,
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
							isLocked: false,
							lockReason: null,
						},
					});
				},
			),
		},
	}) satisfies BetterAuthPlugin;
