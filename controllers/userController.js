const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendVforgotPasswordEmail,
} = require("../services/emailService");
const db = require("../config/db");
const jwt = require("jsonwebtoken");
exports.registerUser = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const [roleId] = await db("roles").where({ name: role }).pluck("id");
    if (!roleId) {
      return res.status(400).json({ error: "Invalid role" });
    }
    // console.log(roleId);

    await db("users").insert({
      email,
      password: hashedPassword,
      role_id: roleId,
      verification_token: verificationToken,
    });

    await sendVerificationEmail(email, verificationToken);

    res
      .status(201)
      .json({ message: "Registration successful. Please verify your email." });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Registration failed" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const user = await db("users").where("verification_token", token).first();

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    await db("users")
      .where("id", user.id)
      .update({ is_verified: true, verification_token: null });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db("users").where("email", email).first();

    if (
      !user ||
      !user.active ||
      !(await bcrypt.compare(password, user.password))
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: "Email not verified" });
    }

    // Generate Access Token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1h" }
    );

    // Generate Refresh Token
    const refreshToken = crypto.randomBytes(64).toString("hex");
    await db("users")
      .where("id", user.id)
      .update({ refresh_token: refreshToken });

    // Set refresh token as HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, // Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // Use HTTPS in production
      sameSite: "none", // Prevent cross-site cookie access
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const permissionsName = await db("role_permissions")
      .select("permissions.name")
      .join("permissions", "permissions.id", "role_permissions.permission_id")
      .where("role_permissions.role_id", user.role_id);

    const permissions = permissionsName.map((item) => item.name);

    const dashAccess = permissions.includes("desk_permission") ? "true" : false;

    const expiresIn = jwt.decode(accessToken).exp;
    return res.status(200).json({
      accessToken,
      refreshToken,
      permissions: permissions,
      dashAccess: dashAccess,
      role: user.role_id,
      email: user.email,
      expiresIn,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Login failed" });
  }
};

exports.refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body; // Extract the refresh token from cookies
  // const refreshToken1 = req.cookies;
  // console.log("cookies:   ", req.cookies.refreshToken);
  // console.log("refresh:   ", refreshToken);
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is missing" });
  }

  try {
    const user = await db("users").where("refresh_token", refreshToken).first();

    if (!user) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    // Generate new Access Token
    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "1h" }
    );
    const expiresIn = jwt.decode(newAccessToken).exp;
    res.status(200).json({ accessToken: newAccessToken, expiresIn });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(500).json({ error: "Could not refresh token" });
  }
};

exports.logoutUser = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    await db("users")
      .where("refresh_token", refreshToken)
      .update({ refresh_token: null });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ error: "Logout failed" });
  }
};

//user profile funcitons

exports.getProfile = async (req, res) => {
  try {
    const users = await db("users")
      .select("email", "fname", "lname")
      .where("id", req.user.id)
      .first();

    res.status(200).json({ users });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Verification failed" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await db("users").where({ id: req.user.id }).first();

    if (!user || !(await bcrypt.compare(req.body.oldPassword, user.password))) {
      return res.status(500).json({ error: "Current password is invalid" });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);

    await db("users")
      .update("password", hashedPassword)
      .where("id", req.user.id);

    return res.status(200).send({ message: "Password update successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send({ message: "Failed to update password." });
  }
};

exports.forgotPasswordEmail = async (req, res) => {
  try {
    console.log(req.body);
    const user = await db("users").where({ email: req.body.email }).first();

    if (!user) {
      return res
        .status(200)
        .json({ error: "Password reset email sent successully" });
    }
    const now = new Date();
    const expiryTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // Add 48 hours in milliseconds

    const verificationToken = crypto.randomBytes(32).toString("hex");

    await db("users")
      .update({
        verification_token: verificationToken,
        forgotPasswordExpiry: expiryTime,
      })
      .where("email", req.body.email);

    console.log(verificationToken, expiryTime);
    await sendVerificationEmail(req.body.email, verificationToken);

    return res
      .status(200)
      .send({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send({ message: "Failed to update password." });
  }
};

exports.resetpassword = async (req, res) => {
  try {
    const user = await db("users")
      .where({ verification_token: req.body.hash })
      .first();

    if (!user) {
      console.log("EXPIRED TOKEN : ");
      return res.status(200).json({ error: "Password reset successully" });
    }

    const now = new Date();
    if (now > user.verification_token) {
      // The token has expired
      return res.status(400).json({ error: "Token has expired" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    await db("users")
      .update({ password: hashedPassword, verification_token: null, is_verified: true })
      .where("id", user.id);

    return res.status(200).send({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).send({ message: "Failed to update password." });
  }
};
