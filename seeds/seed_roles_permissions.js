/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const client = (knex.client.config.client || "").toLowerCase();

  // ---- 1) Clean tables in FK-safe order (cross-DB) ----
  if (client.includes("pg")) {
    await knex.raw(
      "TRUNCATE TABLE role_permissions, permissions, roles, users RESTART IDENTITY CASCADE"
    );
  } else if (client.includes("mysql")) {
    // MySQL / MariaDB
    await knex.raw("SET FOREIGN_KEY_CHECKS = 0");
    await knex("role_permissions").truncate();
    await knex("permissions").truncate();
    await knex("roles").truncate();
    await knex("users").truncate();
    await knex.raw("SET FOREIGN_KEY_CHECKS = 1");
  } else {
    // SQLite or others
    await knex("role_permissions").del();
    await knex("permissions").del();
    await knex("roles").del();
    await knex("users").del();
  }

  // ---- 2) Insert role and get id (cross-DB) ----
  let adminRoleId;
  if (client.includes("pg")) {
    const [{ id }] = await knex("roles")
      .insert({ name: "admin" })
      .returning("id");
    adminRoleId = id;
  } else {
    const [id] = await knex("roles").insert({ name: "admin" }); // insertId
    adminRoleId = id;
  }

  // ---- 3) Insert admin user ----
  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash("!2345Abc", 10);

  await knex("users").insert({
    email: "admin@example.com",
    password: hashedPassword,
    is_verified: true,
    role_id: adminRoleId,
  });

  // ---- 4) Insert permissions (bulk) and fetch their ids (cross-DB) ----
  const permissionNames = [
    "can_read_users",
    "can_add_users",
    "can_update_users",
    "can_delete_users",
    "can_read_permissions",
    "can_add_permissions",
    "can_update_permissions",
    "can_delete_permissions",
    "can_read_role",
    "can_add_role",
    "can_update_role",
    "can_delete_role",
    "can_read_rolepermissions",
    "can_update_rolepermissions",
    "can_read_notifications",
    "can_add_notifications",
    "can_update_notifications",
    "can_delete_notifications",
    "can_read_googleSheets",
    "can_add_googleSheets",
    "can_update_googleSheets",
    "can_delete_googleSheets",
    "HSD_Dashboard",
    "ZETWORK_Dashboard",
    "SOLAR_Dashboard",
    "CNC_Dashboard",
    "COW_Dashboard",
    "GI_Dashboard",
    "Miscellaneous_Dashboard",
    "OCTAPOLE_Dashboard",
    "Report",
    "admin",
  ];

  const permissionRows = permissionNames.map((name) => ({ name }));

  if (client.includes("pg")) {
    await knex("permissions").insert(permissionRows);
  } else {
    await knex("permissions").insert(permissionRows);
  }

  // Get the IDs we just inserted
  const insertedPermissions = await knex("permissions")
    .select("id", "name")
    .whereIn("name", permissionNames);

  // ---- 5) Attach all permissions to admin role ----
  const rolePermissionsData = insertedPermissions.map((p) => ({
    role_id: adminRoleId,
    permission_id: p.id,
  }));

  if (rolePermissionsData.length) {
    await knex("role_permissions").insert(rolePermissionsData);
  }
};
