import prisma from "@betting/db";
import z from "zod";
import { publicProcedure } from "../index";

export const activitylogsRouter = {
	profileActivityLogs: publicProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const activitylogs = await prisma.activityLog.findMany({
				where: {
					user_id: input.userId,
					type: "LOGIN",
				},
				select: {
					id: true,
					ipaddress: true,
					city: true,
					country: true,
					action: true,
					browser: true,
					os: true,
					state: true,
					isp: true,
					createdAt: true,
				},
			});
			return activitylogs;
		}),

	passwordHistory: publicProcedure
		.input(
			z.object({
				userId: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const passwordHistory = await prisma.activityLog.findMany({
				where: {
					user_id: input.userId,
					type: "PASSWORD_CHANGE",
				},
				select: {
					id: true,
					remarks: true,
					createdAt: true,
				},
			});
			return passwordHistory;
		}),
};
