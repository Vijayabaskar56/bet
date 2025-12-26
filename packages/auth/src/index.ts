import prisma from "@betting/db/index";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, openAPI } from "better-auth/plugins";
import { createAuthMiddleware } from "better-auth/api";
import { ObjectId } from "bson";
import {
	ac,
	admin as adminRole,
	superadmin,
	user as userRole,
} from "./permissions";
import { adminLockedPlugin } from "./plugins/admin-locked";
import { softDeletePlugin } from "./plugins/soft-delete";

// Use Better Auth's built-in password verification
// This ensures scrypt parameters (N=16384, r=16, p=1) match exactly
import { verifyPassword as betterAuthVerifyPassword } from "better-auth/crypto";

async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<boolean> {
	try {
		return await betterAuthVerifyPassword({
			hash: storedHash,
			password: password,
		});
	} catch (error) {
		console.error("Password verification error:", error);
		return false;
	}
}
export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "mongodb",
	}),
	trustedOrigins: ["http://localhost:3001", "http://localhost:3002"],
	user: {
		modelName: "user",
		additionalFields: {
			status: { type: "number", defaultValue: 1 },
			// mobileNumber: { type: "string", required: true },
			balance: { type: "number", defaultValue: 0 },
			exposure: { type: "number", defaultValue: 0 },
			commissionEarned: { type: "number", defaultValue: 0 },
			deposit_amt: { type: "number", required: false },
			withdraw_amt: { type: "number", required: false },
			upLineCommisionPercent: {
				type: "number",
				defaultValue: 0,
				required: true,
			},
			// openingBalance: { type: "number", defaultValue: 0, required: true },
			// exposureLimit: { type: "number", defaultValue: 0, required: true },
			// creditReference: { type: "string", required: true },
			modifiedAt: { type: "date" },
			partnership: { type: "string", required: false },
			rollingCommission: { type: "json", required: false },
			agentRollingCommission: { type: "json", required: false },
			updatedBy: { type: "string", required: false },
			parentId: { type: "string", required: false },
			deletedAt: { type: "date", required: false },
			deletedBy: { type: "string", required: false },
		},
	},

	session: {
		modelName: "session",
	},
	account: {
		modelName: "account",
	},
	verification: {
		modelName: "verification",
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		disableSignUp: false,
	},
	// disabledPaths: ["/sign-up/email"],
	logger: {
		level: "info",
	},
	plugins: [
		admin({
			ac,
			roles: {
				superadmin,
				admin: adminRole,
				user: userRole,
			},
			adminRoles: ["superadmin", "admin"],
			defaultRole: "user",
			defaultBanReason: "Violation of terms",
		}),
		adminLockedPlugin(),
		softDeletePlugin(),
		openAPI(),
	],
	hooks: {
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path.startsWith("/sign-in")) {
				const isSuccess = !!ctx.context.newSession;
				const body = ctx.body;
				const headers = ctx.headers;
				if (!headers) return;

				// Extract IP and location info from headers (Cloudflare/Proxy support)
				const ip =
					headers.get("cf-connecting-ip") ||
					headers.get("x-forwarded-for")?.split(",")[0] ||
					"127.0.0.1";
				const city = headers.get("cf-ipcity") || "Unknown";
				const country = headers.get("cf-ipcountry") || "Unknown";
				const state = headers.get("cf-region") || "Unknown";
				const isp = headers.get("x-isp") || "Unknown"; // Custom or proxy header

				const userAgent = headers.get("user-agent") || "";
				// Simple UA parsing (could be improved with a library if needed)
				const browser = userAgent.includes("Chrome")
					? "Chrome"
					: userAgent.includes("Firefox")
						? "Firefox"
						: userAgent.includes("Safari")
							? "Safari"
							: "Unknown";
				const os = userAgent.includes("Windows")
					? "Windows"
					: userAgent.includes("Mac")
						? "MacOS"
						: userAgent.includes("Linux")
							? "Linux"
							: "Unknown";

				let userId = ctx.context.newSession?.user?.id;

				// If failed, try to find user by email from body
				if (!userId && body?.email) {
					const user = await prisma.user.findFirst({
						where: { email: body.email },
					});
					userId = user?.id;
				}

				await prisma.activityLog.create({
					data: {
						user_id: userId,
						ipaddress: ip,
						city: city,
						state: state,
						country: country,
						isp: isp,
						action: "Login",
						type: "LOGIN",
						status: isSuccess ? "Login Successful" : "Login Failed",
						browser: browser,
						os: os,
					},
				});
			}

			if (
				ctx.path === "/change-password" ||
				ctx.path === "/reset-password" ||
				ctx.path === "/admin/set-user-password"
			) {
				const isSuccess = ctx.context.returned instanceof Response ? ctx.context.returned.ok : true; // Better Auth returns Response or data
				const body = ctx.body;
				const headers = ctx.headers;
				if (!headers) return;

				const ip =
					headers.get("cf-connecting-ip") ||
					headers.get("x-forwarded-for")?.split(",")[0] ||
					"127.0.0.1";
				const city = headers.get("cf-ipcity") || "Unknown";
				const country = headers.get("cf-ipcountry") || "Unknown";
				const state = headers.get("cf-region") || "Unknown";
				const isp = headers.get("x-isp") || "Unknown";

				const userAgent = headers.get("user-agent") || "";
				const browser = userAgent.includes("Chrome")
					? "Chrome"
					: userAgent.includes("Firefox")
						? "Firefox"
						: userAgent.includes("Safari")
							? "Safari"
							: "Unknown";
				const os = userAgent.includes("Windows")
					? "Windows"
					: userAgent.includes("Mac")
						? "MacOS"
						: userAgent.includes("Linux")
							? "Linux"
							: "Unknown";

				let userId: string | undefined;
				let remarks = "";

				if (ctx.path === "/change-password") {
					userId = ctx.context.session?.user?.id;
					remarks = "Password Changed By Self.";
				} else if (ctx.path === "/reset-password") {
					// For reset password, we might need to find the user by token or email if available in body
					if (body?.email) {
						const user = await prisma.user.findFirst({
							where: { email: body.email },
						});
						userId = user?.id;
					}
					remarks = "Password Reset.";
				} else if (ctx.path === "/admin/set-user-password") {
					userId = body?.userId;
					const adminName = ctx.context.session?.user?.name || "Admin";
					remarks = `User Password Changed By ${adminName}.`;
				}

				await prisma.activityLog.create({
					data: {
						user_id: userId,
						ipaddress: ip,
						city: city,
						state: state,
						country: country,
						isp: isp,
						action: "Password Change",
						type: "PASSWORD_CHANGE",
						status: isSuccess ? "Success" : "Failed",
						remarks: remarks,
						browser: browser,
						os: os,
					},
				});
			}
		}),
	},
	databaseHooks: {
		user: {
			create: {
				before: async (user, ctx) => {
					if (ctx?.context?.session?.user?.id) {
						// Verify master password
						if (ctx?.body.data.masterPassword) {
							const adminUser = await prisma.account.findFirst({
								where: { userId: ctx.context.session.user.id },
							});
							if (adminUser && adminUser.password) {
								const isMasterPasswordValid = await verifyPassword(
									ctx.body.data.masterPassword,
									adminUser.password,
								);
								if (!isMasterPasswordValid) {
									ctx.error("BAD_REQUEST", {
										message: "Invalid master password",
									});
								}
							} else {
								ctx.error("BAD_REQUEST", {
									message: "Admin user not found",
								});
							}
						} else {
							ctx.error("BAD_REQUEST", {
								message: "Master password is required",
							});
						}
						console.log(ctx?.body, ctx?.body.data.masterPassword, "ctxbody");
						return {
							data: {
								...user,
								parentId: ctx.context.session.user.id,
								updatedBy: ctx.context.session.user.id,
							},
						};
					}
					return { data: user };
				},
			},
			update: {
				before: async (data, ctx) => {
					if (ctx?.context?.session?.user?.id) {
						return {
							data: {
								...data,
								updatedBy: ctx.context.session.user.id,
							},
						};
					}
					return { data };
				},
			},
		},
	},
	advanced: {
		database: {
			generateId: () => new ObjectId().toHexString(),
		},
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
	},
});
