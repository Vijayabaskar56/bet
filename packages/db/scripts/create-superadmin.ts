import prisma from "@betting/db";

async function createSuperadmin() {
	const args = process.argv.slice(2);

	if (args.length < 3) {
		console.log(
			"Usage: bun run create-superadmin <email> <password> <name> [country] [phone]",
		);
		console.log(
			"Example: bun run create-superadmin admin@betting.com SecurePass123! 'Super Admin'",
		);
		process.exit(1);
	}

	const email = args[0];
	const password = args[1];
	const name = args[2];
	const country = args[3] || "";
	const phoneInput = args[4];
	const phone = phoneInput ? Number(phoneInput) : undefined;

	console.log("Creating superadmin with:");
	console.log("Email:", email);
	console.log("Name:", name);
	console.log("Country:", country);
	console.log("Phone:", phone);

	const userData: any = {
		email,
		name,
		role: "superadmin",
		emailVerified: true,
		balance: 0,
		availableBalance: 0,
		escrowBalance: 0,
		country,
	};

	if (phone !== undefined) {
		userData.phone_no = phone;
	}

	try {
		const user = await prisma.user.create({
			data: userData,
		});

		await prisma.account.create({
			data: {
				userId: user.id,
				accountId: user.id,
				providerId: "credential",
				password,
			},
		});

		console.log("\n✅ Superadmin created successfully!");
		console.log("Email:", user.email);
		console.log("Name:", user.name);
		console.log("Role:", user.role);
		console.log("ID:", user.id);
		console.log("\nYou can now login at: http://localhost:3001");
	} catch (error) {
		console.error("\n❌ Error creating superadmin:");
		console.error(error);
		process.exit(1);
	}
}

createSuperadmin();
