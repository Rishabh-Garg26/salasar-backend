const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../services/emailService");
const db = require("../config/db");

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default page = 1 and limit = 10 if not provided

    const offset = (page - 1) * limit; // Calculate the offset for pagination
    const admin = await db("roles").where("name", "admin").first();

    const users = await db("users")
      .join("roles", "roles.id", "users.role_id")
      .select(
        "users.active",
        "users.created_at",
        "users.email",
        "users.phone",
        "users.is_verified",
        "users.role_id",
        "users.fname",
        "users.lname",
        "roles.name as role_name"
      )
      .where("email", "like", `%${search}%`)
      .whereNot("users.id", admin.id)
      .orderBy("users.id", "asc")
      .limit(limit)
      .offset(offset);

    // Fetch the total number of brands (with the same search filter)
    const totalUsers = await db("users")
      .count({ count: "*" })
      .where("email", "like", `%${search}%`)
      .first();

    const totalPages = Math.ceil(totalUsers.count / limit); // Calculate total pages

    return res.status(200).send({ users, totalPages });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.addUser = async (req, res) => {
  try {
    const permissionCheck = await db("users")
      .where({
        email: req.body.email,
      })
      .first();

    if (permissionCheck) {
      return res.status(500).send({ message: "Duplicate email" });
    }
    // console.log(req.body);
    const hashedPassword = await require("bcrypt").hash("!2345Abc", 10);
    await db("users").insert({
      email: req.body.email,
      role_id: req.body.role_id,
      active: req.body.active,
      phone: req.body.phone,
      is_verified: req.body.is_verified,
      fname: req.body.fname,
      lname: req.body.lname,
      password: hashedPassword,
    });

    return res.status(200).send({ message: "user added successfully" });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.updateUsers = async (req, res) => {
  try {
    await db("users")
      .update({
        role_id: req.body.role_id,
        active: req.body.active,
        phone: req.body.phone,
        fname: req.body.fname,
        lname: req.body.lname,
      })
      .where({ email: req.body.email });

    return res.status(200).send({ message: "Permissions added successfully" });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.deleteUsers = async (req, res) => {
  try {
    // console.log("Content for deletion", req.body);
    await db("users").where({ email: req.body.email }).del();

    return res.status(200).send({ message: "User Deleted successfully" });
  } catch (error) {
    console.error("Deleting Permission error: ", error);
    res.status(500).send({ message: "Failed to Delete permissions." });
  }
};

//
//Permissions Controller
//

exports.getPermissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default page = 1 and limit = 10 if not provided

    const offset = (page - 1) * limit; // Calculate the offset for pagination

    const permissions = await db("permissions")
      .where("name", "like", `%${search}%`)
      .orderBy("id", "asc")
      .limit(limit)
      .offset(offset);

    // Fetch the total number of brands (with the same search filter)
    const totalPermissions = await db("permissions")
      .count({ count: "*" })
      .where("name", "like", `%${search}%`)
      .first();

    const totalPages = Math.ceil(totalPermissions.count / limit); // Calculate total pages

    return res.status(200).send({ permissions, totalPages });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.addPermissions = async (req, res) => {
  try {
    const permissionCheck = await db("permissions")
      .where({
        name: req.body.name,
      })
      .first();

    if (permissionCheck) {
      return res.status(500).send({ message: "Duplicate permissions" });
    }

    const newPermId = await db("permissions").insert({ name: req.body.name }, [
      "id",
    ]);

    const admin = await db("roles").where("name", "admin").first();

    await db("role_permissions").insert({
      role_id: admin.id,
      permission_id: newPermId[0].id,
    });

    return res.status(200).send({ message: "Permissions added successfully" });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.updatePermissions = async (req, res) => {
  try {
    const permissionCheck = await db("permissions")
      .where({
        name: req.body.name,
      })
      .andWhereNot({
        id: req.body.id,
      })
      .first();

    if (permissionCheck) {
      return res.status(500).send({ message: "Duplicate permissions name" });
    }

    await db("permissions")
      .update({ name: req.body.name })
      .where({ id: req.body.id });

    return res.status(200).send({ message: "Permissions added successfully" });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.deletePermission = async (req, res) => {
  try {
    // console.log("Content for deletion", req.body);
    await db("permissions")
      .where({ id: req.body.id, name: req.body.name })
      .del();

    await db("role_permissions").where("permission_id", req.body.id).del();

    return res
      .status(200)
      .send({ message: "Permissions Deleted successfully" });
  } catch (error) {
    console.error("Deleting Permission error: ", error);
    res.status(500).send({ message: "Failed to Delete permissions." });
  }
};

//
//Roles Controller
//

exports.getRole = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default page = 1 and limit = 10 if not provided

    const offset = (page - 1) * limit; // Calculate the offset for pagination

    const role = await db("roles")
      .where("name", "like", `%${search}%`)
      .whereNot("name", "admin")
      .orderBy("id", "asc")
      .limit(limit)
      .offset(offset);

    // Fetch the total number of brands (with the same search filter)
    const totalRoles = await db("roles")
      .count({ count: "*" })
      .where("name", "like", `%${search}%`)
      .first();

    const totalPages = Math.ceil(totalRoles.count / limit); // Calculate total pages

    return res.status(200).send({ role, totalPages });
  } catch (error) {
    console.error("Error fetching roles needed options:", error);
    res.status(500).send({ message: "Failed to fetch roles needed options." });
  }
};

exports.addRole = async (req, res) => {
  try {
    const RoleCheck = await db("roles")
      .where({
        name: req.body.name,
      })
      .first();

    if (RoleCheck) {
      return res.status(500).send({ message: "Duplicate Roles" });
    }

    await db("roles").insert({ name: req.body.name });

    return res.status(200).send({ message: "Roles added successfully" });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const roleCheck = await db("roles")
      .where({
        name: req.body.name,
      })
      .andWhereNot({
        id: req.body.id,
      })
      .first();

    if (roleCheck) {
      return res.status(500).send({ message: "Duplicate role name" });
    }

    await db("roles")
      .update({ name: req.body.name })
      .where({ id: req.body.id });

    return res.status(200).send({ message: "roles added successfully" });
  } catch (error) {
    console.error("Error fetching product needed options:", error);
    res
      .status(500)
      .send({ message: "Failed to fetch product needed options." });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    // console.log("Content for deletion", req.body);
    await db("roles").where({ id: req.body.id, name: req.body.name }).del();

    return res.status(200).send({ message: "roles Deleted successfully" });
  } catch (error) {
    console.error("Deleting Permission error: ", error);
    res.status(500).send({ message: "Failed to Delete roles." });
  }
};

//
// Role Permissions
//

exports.getRolePermissions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default page = 1 and limit = 10 if not provided

    const offset = (page - 1) * limit; // Calculate the offset for pagination

    // Fetch roles with pagination and search filter
    const roles = await db("roles")
      .where("roles.name", "like", `%${search}%`)
      .whereNot("roles.name", "admin")
      .orderBy("roles.id", "asc")
      .limit(limit)
      .offset(offset);

    // Fetch permissions for each role
    const roleIds = roles.map((role) => role.id);
    const rolePermissions = await db("role_permissions")
      .join("permissions", "role_permissions.permission_id", "permissions.id")
      .whereIn("role_permissions.role_id", roleIds)
      .select(
        "role_permissions.role_id",
        "permissions.name as permission_name",
        "permissions.id as permission_id"
      );

    // Group permissions by role
    const rolesWithPermissions = roles.map((role) => {
      const permissions = rolePermissions
        .filter((rp) => rp.role_id === role.id)
        .map((rp) => {
          return { name: rp.permission_name, id: rp.permission_id };
        });

      return {
        ...role,
        permissions,
      };
    });

    // Fetch the total number of roles (with the same search filter)
    const totalRoles = await db("roles")
      .count({ count: "*" })
      .where("name", "like", `%${search}%`)
      .first();

    const totalPages = Math.ceil(totalRoles.count / limit); // Calculate total pages

    return res
      .status(200)
      .send({ rolePermission: rolesWithPermissions, totalPages });
  } catch (error) {
    console.error("Error fetching roles needed options:", error);
    res.status(500).send({ message: "Failed to fetch roles needed options." });
  }
};

exports.updateRolePermissions = async (req, res) => {
  try {
    await db.transaction(async (trx) => {
      // Fetch existing permissions
      const existingPermissions = await trx("role_permissions")
        .where({ role_id: req.body.id })
        .pluck("permission_id");

      // Calculate additions and deletions
      const toAdd = req.body.permissions.filter(
        (item) => !existingPermissions.includes(item.id)
      );

      const permissionIds = req.body.permissions.map((perm) => perm.id);

      const toRemove = existingPermissions.filter(
        (id) => !permissionIds.includes(id)
      );

      // Perform deletions
      if (toRemove.length > 0) {
        await trx("role_permissions")
          .where({ role_id: req.body.id })
          .whereIn("permission_id", toRemove)
          .del();
      }

      // Perform insertions
      if (toAdd.length > 0) {
        const newEntries = toAdd.map((permissions) => ({
          role_id: req.body.id,
          permission_id: permissions.id,
        }));
        await trx("role_permissions").insert(newEntries);
      }
    });

    return res
      .status(200)
      .send({ message: "roles permissions updated successfully" });
  } catch (error) {
    console.error("Error updating roles permissions ", error);
    res.status(500).send({ message: "Failed to update roles permissions." });
  }
};
