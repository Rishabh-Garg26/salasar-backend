const knex = require("../config/db");

const authorizeRole = (requiredPermissions) => async (req, res, next) => {
  try {
    const rolePermissions = await knex("role_permissions")
      .join(
        "permissions",
        "role_permissions.permission_id",
        "=",
        "permissions.id"
      )
      .where("role_permissions.role_id", req.user.role)
      .select("permissions.name");

    const userPermissions = rolePermissions.map((p) => p.name);

    // Check if user has all required permissions
    if (!requiredPermissions.every((perm) => userPermissions.includes(perm))) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Authorization failed" });
  }
};

module.exports = { authorizeRole };
