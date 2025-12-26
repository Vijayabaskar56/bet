/**
 * RBAC Test Script for Betting Platform
 *
 * Tests the role-based access control constraints:
 * - Superadmin can create both admins and users
 * - Admin can only create users (not other admins)
 *
 * Run with: bun run packages/auth/src/test-rbac.ts
 */

const BASE_URL = "http://localhost:3000/api/auth";

interface TestResult {
	test: string;
	passed: boolean;
	message: string;
}

const results: TestResult[] = [];

async function login(email: string, password: string): Promise<string | null> {
	const response = await fetch(`${BASE_URL}/sign-in/email`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:3000",
		},
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		console.error(`Login failed for ${email}:`, await response.text());
		return null;
	}

	// Get the session cookie
	const setCookie = response.headers.get("set-cookie");
	return setCookie;
}

async function createUser(
	sessionCookie: string,
	userData: { email: string; password: string; name: string; role: string },
): Promise<{ success: boolean; error?: string; user?: any }> {
	const response = await fetch(`${BASE_URL}/admin/create-user`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: "http://localhost:3000",
			Cookie: sessionCookie,
		},
		body: JSON.stringify(userData),
	});

	const data = (await response.json()) as { message?: string; error?: string };

	if (!response.ok) {
		return {
			success: false,
			error: data.message || data.error || "Unknown error",
		};
	}

	return { success: true, user: data };
}

async function runTests() {
	console.log("🧪 Starting RBAC Constraint Tests\n");
	console.log("=".repeat(50));

	// Test 1: Login as superadmin
	console.log("\n📝 Test 1: Superadmin Login");
	const superadminCookie = await login("superadmin@yopmail.com", "Admin@123");

	if (!superadminCookie) {
		console.log("❌ FAILED: Could not login as superadmin");
		console.log(
			"\n⚠️  Please update the password in this script to match your superadmin password.",
		);
		console.log("   Location: packages/auth/src/test-rbac.ts line 67");
		results.push({
			test: "Superadmin Login",
			passed: false,
			message: "Login failed - check password",
		});
		printSummary();
		return;
	}
	console.log("✅ PASSED: Superadmin logged in successfully");
	results.push({
		test: "Superadmin Login",
		passed: true,
		message: "Login successful",
	});

	// Test 2: Superadmin creates an admin user
	console.log("\n📝 Test 2: Superadmin creates Admin user");
	const testAdminEmail = `test-admin-${Date.now()}@yopmail.com`;
	const testAdminPassword = "TestAdmin123!";

	const createAdminResult = await createUser(superadminCookie, {
		email: testAdminEmail,
		password: testAdminPassword,
		name: "Test Admin",
		role: "admin",
	});

	if (createAdminResult.success) {
		console.log("✅ PASSED: Superadmin can create admin users");
		console.log(`   Created admin: ${testAdminEmail}`);
		results.push({
			test: "Superadmin creates Admin",
			passed: true,
			message: "Admin created successfully",
		});
	} else {
		console.log("❌ FAILED: Superadmin should be able to create admin users");
		console.log(`   Error: ${createAdminResult.error}`);
		results.push({
			test: "Superadmin creates Admin",
			passed: false,
			message: createAdminResult.error || "Failed",
		});
	}

	// Test 3: Superadmin creates a regular user
	console.log("\n📝 Test 3: Superadmin creates regular User");
	const testUserEmail = `test-user-${Date.now()}@yopmail.com`;

	const createUserResult = await createUser(superadminCookie, {
		email: testUserEmail,
		password: "TestUser123!",
		name: "Test User",
		role: "user",
	});

	if (createUserResult.success) {
		console.log("✅ PASSED: Superadmin can create regular users");
		console.log(`   Created user: ${testUserEmail}`);
		results.push({
			test: "Superadmin creates User",
			passed: true,
			message: "User created successfully",
		});
	} else {
		console.log("❌ FAILED: Superadmin should be able to create regular users");
		console.log(`   Error: ${createUserResult.error}`);
		results.push({
			test: "Superadmin creates User",
			passed: false,
			message: createUserResult.error || "Failed",
		});
	}

	// Test 4: Login as the newly created admin
	console.log("\n📝 Test 4: Login as newly created Admin");
	const adminCookie = await login(testAdminEmail, testAdminPassword);

	if (!adminCookie) {
		console.log("❌ FAILED: Could not login as the newly created admin");
		results.push({
			test: "Admin Login",
			passed: false,
			message: "Login failed",
		});
		printSummary();
		return;
	}
	console.log("✅ PASSED: Admin logged in successfully");
	results.push({
		test: "Admin Login",
		passed: true,
		message: "Login successful",
	});

	// Test 5: Admin tries to create another admin (should FAIL)
	console.log("\n📝 Test 5: Admin tries to create another Admin (should FAIL)");
	const attemptAdminEmail = `attempt-admin-${Date.now()}@yopmail.com`;

	const adminCreatesAdminResult = await createUser(adminCookie, {
		email: attemptAdminEmail,
		password: "AttemptAdmin123!",
		name: "Attempt Admin",
		role: "admin",
	});

	if (!adminCreatesAdminResult.success) {
		console.log("✅ PASSED: Admin correctly CANNOT create other admins");
		console.log(
			`   Error received (expected): ${adminCreatesAdminResult.error}`,
		);
		results.push({
			test: "Admin cannot create Admin",
			passed: true,
			message: "Correctly denied",
		});
	} else {
		console.log("❌ FAILED: Admin should NOT be able to create other admins");
		results.push({
			test: "Admin cannot create Admin",
			passed: false,
			message:
				"Admin was able to create another admin - constraint not working!",
		});
	}

	// Test 6: Admin creates a regular user (should succeed)
	console.log("\n📝 Test 6: Admin creates regular User (should succeed)");
	const adminCreatedUserEmail = `admin-created-user-${Date.now()}@yopmail.com`;

	const adminCreatesUserResult = await createUser(adminCookie, {
		email: adminCreatedUserEmail,
		password: "AdminCreatedUser123!",
		name: "Admin Created User",
		role: "user",
	});

	if (adminCreatesUserResult.success) {
		console.log("✅ PASSED: Admin can create regular users");
		console.log(`   Created user: ${adminCreatedUserEmail}`);
		results.push({
			test: "Admin creates User",
			passed: true,
			message: "User created successfully",
		});
	} else {
		console.log("❌ FAILED: Admin should be able to create regular users");
		console.log(`   Error: ${adminCreatesUserResult.error}`);
		results.push({
			test: "Admin creates User",
			passed: false,
			message: adminCreatesUserResult.error || "Failed",
		});
	}

	// Test 7: Admin tries to create a superadmin (should FAIL)
	console.log("\n📝 Test 7: Admin tries to create a Superadmin (should FAIL)");
	const attemptSuperadminEmail = `attempt-superadmin-${Date.now()}@yopmail.com`;

	const adminCreatesSuperadminResult = await createUser(adminCookie, {
		email: attemptSuperadminEmail,
		password: "AttemptSuperadmin123!",
		name: "Attempt Superadmin",
		role: "superadmin",
	});

	if (!adminCreatesSuperadminResult.success) {
		console.log("✅ PASSED: Admin correctly CANNOT create superadmins");
		console.log(
			`   Error received (expected): ${adminCreatesSuperadminResult.error}`,
		);
		results.push({
			test: "Admin cannot create Superadmin",
			passed: true,
			message: "Correctly denied",
		});
	} else {
		console.log("❌ FAILED: Admin should NOT be able to create superadmins");
		results.push({
			test: "Admin cannot create Superadmin",
			passed: false,
			message:
				"Admin was able to create a superadmin - constraint not working!",
		});
	}

	printSummary();
}

function printSummary() {
	console.log("\n" + "=".repeat(50));
	console.log("📊 TEST SUMMARY\n");

	const passed = results.filter((r) => r.passed).length;
	const total = results.length;

	for (const result of results) {
		const icon = result.passed ? "✅" : "❌";
		console.log(`${icon} ${result.test}: ${result.message}`);
	}

	console.log("\n" + "-".repeat(50));
	console.log(`Total: ${passed}/${total} tests passed`);

	if (passed === total) {
		console.log(
			"\n🎉 All tests passed! RBAC constraints are working correctly.",
		);
	} else {
		console.log("\n⚠️  Some tests failed. Please review the configuration.");
	}
}

// Run the tests
runTests().catch(console.error);
