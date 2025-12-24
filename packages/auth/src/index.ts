import prisma from "@betting/db/index";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, openAPI } from "better-auth/plugins";
import { ac, superadmin, admin as adminRole, user as userRole } from "./permissions";
import { ObjectId } from "bson";

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "mongodb",
	}),
	trustedOrigins: ["http://localhost:3001", "http://localhost:3002"],
	user: {
		modelName: "user",
		additionalFields: {
			balance: { type: "number", defaultValue: 0 },
			availableBalance: { type: "number", defaultValue: 0 },
			escrowBalance: { type: "number", defaultValue: 0 },
			casino_block: { type: "boolean", defaultValue: true },
			user_engagement_month_report: { type: "boolean", defaultValue: true },
			isLoginFirstTime: { type: "number", defaultValue: 1 },
			createdBy: { type: "string", required: false },
			updatedBy: { type: "string", required: false },
			role: { type: "string", defaultValue: "user", input: false },
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
	},
	disabledPaths: ["/sign-up/email"],
	logger : {
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
		openAPI()
	],
	databaseHooks: {
		user: {
			create: {
				before: async (user, ctx) => {
					if (ctx?.context?.session?.user?.id) {
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
