const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token after "Bearer"
  if (!token) {
    return res.status(401).json({ message: "Access Denied: Invalid Token Format" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Standardize to req.user.id
    req.user = {
      id: decoded.id || decoded._id || decoded.userId, // fallback if different format
      ...decoded,
    };

    console.log("✅ Authenticated user:", req.user.id);
    next();
  } catch (error) {
    console.error("❌ Token Verification Failed:", error);
    res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = authMiddleware;
