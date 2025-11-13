const localhostOnly = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const isLocalhost =
    ip === "127.0.0.1" || ip === "::1" || ip.endsWith("127.0.0.1");

  if (isLocalhost) {
    return next();
  }

  res.status(404).json({ message: "Page not found." });
};

module.exports = localhostOnly;
