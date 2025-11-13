const express = require("express");
const controller = require("../controllers/modController");
const router = express.Router();

const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRole } = require("../middlewares/roleMiddleware");

router.get(
  "/users",
  authenticateToken,
  authorizeRole(["can_read_users"]),
  controller.getUsers
);

router.post(
  "/users",
  authenticateToken,
  authorizeRole(["can_add_users"]),
  controller.addUser
);

router.put(
  "/users",
  authenticateToken,
  authorizeRole(["can_update_users"]),
  controller.updateUsers
);

router.delete(
  "/users",
  authenticateToken,
  authorizeRole(["can_delete_users"]),
  controller.deleteUsers
);

//Permission Routes

router.get(
  "/permissions",
  authenticateToken,
  authorizeRole(["can_read_permissions"]),
  controller.getPermissions
);

router.post(
  "/permissions",
  authenticateToken,
  authorizeRole(["can_add_permissions"]),
  controller.addPermissions
);

router.put(
  "/permissions",
  authenticateToken,
  authorizeRole(["can_update_permissions"]),
  controller.updatePermissions
);

router.delete(
  "/permissions",
  authenticateToken,
  authorizeRole(["can_delete_permissions"]),
  controller.deletePermission
);

//Roles Routes

router.get(
  "/role",
  authenticateToken,
  authorizeRole(["can_read_role"]),
  controller.getRole
);

router.post(
  "/role",
  authenticateToken,
  authorizeRole(["can_add_role"]),
  controller.addRole
);

router.put(
  "/role",
  authenticateToken,
  authorizeRole(["can_update_role"]),
  controller.updateRole
);

router.delete(
  "/role",
  authenticateToken,
  authorizeRole(["can_delete_role"]),
  controller.deleteRole
);

//Role Permissions Routes

router.get(
  "/rolepermissions",
  authenticateToken,
  authorizeRole(["can_read_rolepermissions"]),
  controller.getRolePermissions
);

router.put(
  "/rolepermissions",
  authenticateToken,
  authorizeRole(["can_update_rolepermissions"]),
  controller.updateRolePermissions
);

//Google sheets Routes

router.get(
  "/google_sheet",
  authenticateToken,
  authorizeRole(["can_read_role"]),
  controller.getGoogleSheet
);

router.post(
  "/google_sheet",
  authenticateToken,
  authorizeRole(["can_add_role"]),
  controller.addGoogleSheet
);

router.put(
  "/google_sheet",
  authenticateToken,
  authorizeRole(["can_update_role"]),
  controller.updateGoogleSheet
);

router.delete(
  "/google_sheet",
  authenticateToken,
  authorizeRole(["can_delete_role"]),
  controller.deleteGoogleSheet
);

//notification users

router.get(
  "/notificationusers",
  authenticateToken,
  authorizeRole(["can_read_users"]),
  controller.getNotificationUsers
);

router.post(
  "/notificationusers",
  authenticateToken,
  authorizeRole(["can_add_users"]),
  controller.addNotificationusers
);

router.put(
  "/notificationusers",
  authenticateToken,
  authorizeRole(["can_update_users"]),
  controller.updatNotificationeUsers
);

router.delete(
  "/notificationusers",
  authenticateToken,
  authorizeRole(["can_delete_users"]),
  controller.deleteNotificationUsers
);

module.exports = router;
