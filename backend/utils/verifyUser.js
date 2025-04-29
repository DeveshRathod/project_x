import User from "../database/models/user.model.js";
import jwt from "jsonwebtoken";

const verifyUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "Token not provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user.dataValues;
    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error from Middleware" });
  }
};

export default verifyUser;
