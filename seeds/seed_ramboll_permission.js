/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const permissionName = "RAMBOLL_Dashboard";
  const roleName = "admin";

  // 1. Check if permission exists, insert if not
  const existingPermission = await knex("permissions")
    .where("name", permissionName)
    .first();

  let permissionId;

  if (!existingPermission) {
    if (knex.client.config.client === "pg") {
      const [{ id }] = await knex("permissions")
        .insert({ name: permissionName })
        .returning("id");
      permissionId = id;
    } else {
      const [id] = await knex("permissions").insert({
        name: permissionName,
      });
      permissionId = id;
    }
    console.log(`Permission '${permissionName}' inserted with ID ${permissionId}`);
  } else {
    permissionId = existingPermission.id;
    console.log(`Permission '${permissionName}' already exists with ID ${permissionId}`);
  }

  // 2. Get Admin role ID
  const adminRole = await knex("roles").where("name", roleName).first();

  if (!adminRole) {
    console.log(`Role '${roleName}' not found. Skipping assignment.`);
    return;
  }

  const adminRoleId = adminRole.id;

  // 3. Assign permission to Admin role if not already assigned
  const existingAssignment = await knex("role_permissions")
    .where({
      role_id: adminRoleId,
      permission_id: permissionId,
    })
    .first();

  if (!existingAssignment) {
    await knex("role_permissions").insert({
      role_id: adminRoleId,
      permission_id: permissionId,
    });
    console.log(`Permission '${permissionName}' assigned to role '${roleName}'`);
  } else {
    console.log(`Permission '${permissionName}' already assigned to role '${roleName}'`);
  }
};
