import express from "express";
import {
  addAddress,
  deleteAddress,
  getAddress,
  me,
  signin,
  signup,
  updateUser,
  deleteUser,
  getOrders,
  getNotifications,
  markAllNotificationsAsRead,
  deleteNotifications,
  cancelOrder,
} from "../controllers/user.controller.js";
import verifyUser from "../utils/verifyUser.js";

const router = express.Router();

router.get("/me", me);
router.post("/signin", signin);
router.post("/signup", signup);
router.put("/update", verifyUser, updateUser);
router.delete("/delete", verifyUser, deleteUser);
router.get("/getAddress", verifyUser, getAddress);
router.post("/addAddress", verifyUser, addAddress);
router.delete("/deleteAddress", verifyUser, deleteAddress);
router.get("/getOrders", verifyUser, getOrders);
router.post("/cancelOrder", verifyUser, cancelOrder);
router.get("/notifications", verifyUser, getNotifications);
router.get("/markAsRead", verifyUser, markAllNotificationsAsRead);
router.delete("/deleteNotifications", verifyUser, deleteNotifications);

export default router;
