const controller = require("../controllers/userController");

const { authenticateToken } = require("../middlewares/authMiddleware");
const { authorizeRole } = require("../middlewares/roleMiddleware");

module.exports = function (app) {
  app.use(function (req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.post("/api/users/register", controller.registerUser);
  app.get("/api/users/verify", controller.verifyEmail);
  app.post("/api/users/login", controller.loginUser);
  app.post("/api/users/refresh", controller.refreshAccessToken);
  app.post("/api/users/logout", controller.logoutUser);

  //Users self profile routes
  app.get("/api/users/profile", authenticateToken, controller.getProfile);
  app.put(
    "/api/users/updatePassword",
    authenticateToken,
    controller.updatePassword
  );

  //forgot password routes
  app.post("/api/users/forgotPasswordEmail", controller.forgotPasswordEmail);

  //forgot password routes
  app.put("/api/users/resetpassword", controller.resetpassword);
};
