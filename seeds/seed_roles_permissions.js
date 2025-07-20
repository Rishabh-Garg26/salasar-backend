/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Clear existing data in the correct order with CASCADE
  await knex.raw(
    'TRUNCATE TABLE "role_permissions", "permissions", "roles", "users" RESTART IDENTITY CASCADE'
  );

  // Insert roles
  const [adminRoleId] = await knex("roles").insert([{ name: "admin" }], ["id"]);

  const hashedPassword = await require("bcrypt").hash("!2345Abc", 10);
  await knex("users").insert({
    email: "admin@example.com",
    password: hashedPassword,
    is_verified: true,
    role_id: adminRoleId.id,
  });

  // Deletes ALL existing entries
  // Insert permissions
  const insertedPermissions = await knex("permissions").insert(
    [
      { name: "can_read_users" },
      { name: "can_add_users" },
      { name: "can_update_users" },
      { name: "can_delete_users" },
      { name: "can_read_permissions" },
      { name: "can_add_permissions" },
      { name: "can_update_permissions" },
      { name: "can_delete_permissions" },
      { name: "can_read_role" },
      { name: "can_add_role" },
      { name: "can_update_role" },
      { name: "can_delete_role" },
      { name: "can_read_rolepermissions" },
      { name: "can_update_rolepermissions" },
      { name: "can_read_notifications" },
      { name: "can_add_notifications" },
      { name: "can_update_notifications" },
      { name: "can_delete_notifications" },
      { name: "can_read_googleSheets" },
      { name: "can_add_googleSheets" },
      { name: "can_update_googleSheets" },
      { name: "can_delete_googleSheets" },
      { name: "HSD_Dashboard" },
      { name: "ZETWORK_Dashboard" },
      { name: "SOLAR_Dashboard" },
      { name: "CNC_Dashboard" },
      { name: "COW_Dashboard" },
      { name: "GI_Dashboard" },
      { name: "Miscellaneous_Dashboard" },
      { name: "OCTAPOLE_Dashboard" },
      { name: "Report" },
      { name: "admin" },
    ],
    ["id"]
  );

  // 2. Prepare role_permissions data
  const rolePermissionsData = insertedPermissions.map((row) => ({
    role_id: adminRoleId.id,
    permission_id: row.id || row, // handle object vs integer
  }));

  // Insert role_permissions
  await knex("role_permissions").insert(rolePermissionsData);
};
