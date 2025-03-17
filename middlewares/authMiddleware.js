const jwt = require("jsonwebtoken");
require("dotenv").config();
const db = require("../config/db");

const authenticateToken = async (req, res, next) => {
  const token = await req.header("Authorization")?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        console.log(req.header("Authorization"));
        return res
          .status(401)
          .json({ error: "Token expired, please log in again" });
      }
      return res.status(403).json({ error: "Token invalid" });
    }

    const userCheck = await db("users").where("id", user.id).first();

    // console.log(user, req.user);
    if (!userCheck) {
      console.log("usercheck");
      return res.status(401).send({ message: "Invalid User Management!" });
    }

    req.user = user; // Attach user details to the request object

    next();
  });
};

module.exports = { authenticateToken };
