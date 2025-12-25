import prisma from "@betting/db/index";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, openAPI, username } from "better-auth/plugins";
import {
	ac,
	superadmin,
	admin as adminRole,
	user as userRole,
} from "./permissions";
import { ObjectId } from "bson";

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
			mobileNumber: { type: "string", required: true },
			balance: { type: "number", defaultValue: 0 },
			availableBalance: { type: "number", defaultValue: 0 },
			escrowBalance: { type: "number", defaultValue: 0 },
			deposit_amt: { type: "number", required: false },
			withdraw_amt: { type: "number", required: false },
			upLineCommisionPercent: {
				type: "number",
				defaultValue: 0,
				required: true,
			},
			openingBalance: { type: "number", defaultValue: 0, required: true },
			exposureLimit: { type: "number", defaultValue: 0, required: true },
			creditReference: { type: "string", required: true },
			modifiedAt: { type: "date" },
			partnership: { type: "string", required: false },
			rollingCommission: { type: "json", required: false },
			agentRollingCommission: { type: "json", required: false },
			updatedBy: { type: "string", required: false },
			createdBy: { type: "string", required: false },
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
		disableSignUp: true,
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
		openAPI(),
	],
	hooks: {
		// add a hook so that when triggering /admin/set-user-password, it will add a additional field to passwordUpdatedBy with the admin user id who updated the password
		// other wise
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
							if (adminUser) {
								const isMasterPasswordValid = await verifyPassword(
									ctx.body.data.masterPassword,
									adminUser.password,
								);
								if (!isMasterPasswordValid) {
									throw new Error("Invalid master password");
								}
							} else {
								throw new Error("Admin user not found");
							}
						} else {
							throw new Error("Master password is required");
						}
						console.log(ctx?.body, ctx?.body.data.masterPassword, "ctxbody");
						return {
							data: {
								...user,
								createdBy: ctx.context.session.user.id,
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
