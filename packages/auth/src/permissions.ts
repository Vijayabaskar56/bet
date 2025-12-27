import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Custom access control for the betting platform.
 *
 * Roles:
 * - superadmin: Full permissions, can create admins and users
 * - admin: Can only create/manage users (not other admins)
 * - user: No admin permissions
 */

// Use default admin statements (user and session resources)
const statement = {
	...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/**
 * Superadmin: Full admin permissions
 * - Can create, list, ban, delete, set-role, set-password, impersonate users
 * - Can list, revoke, delete sessions
 * - Can create other admins
 */
export const superadmin = ac.newRole({
	user: [
		"create",
		"list",
		"set-role",
		"ban",
		"impersonate",
		"delete",
		"set-password",
	],
	session: ["list", "revoke", "delete"],
}) as any;

/**
 * Admin: Limited permissions
 * - Can create, list, ban, set-password users
 * - Can list, revoke sessions
 * - CANNOT set-role (so cannot create admins/superadmins)
 * - CANNOT delete or impersonate users
 */
export const admin = ac.newRole({
	user: ["create", "list", "ban", "set-password"],
	session: ["list", "revoke"],
}) as any;

/**
 * User: No admin permissions
 */
export const user = ac.newRole({}) as any;
