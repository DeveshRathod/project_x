import express from "express";
import verifyUser from "../utils/verifyUser.js";
import {
  addBrand,
  addProduct,
  addUser,
  deleteProduct,
  deleteUser,
  fetchAllBrandNames,
  getAllNonAdminUsers,
  getAllProduct,
  getDashboard,
  getLatestOrders,
  getOrder,
  getOrders,
  getOutOfStock,
  getProduct,
  removeBrand,
  updateOrder,
  updateProduct,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/addBrand", verifyUser, addBrand);
router.post("/removeBrand", verifyUser, removeBrand);
router.get("/getAllBrands", verifyUser, fetchAllBrandNames);
router.post("/addProduct", verifyUser, addProduct);
router.delete("/deleteProduct/:productId", verifyUser, deleteProduct);
router.get("/getProduct/:productId", verifyUser, getProduct);
router.get("/getAllProduct", verifyUser, getAllProduct);
router.put("/updateProduct/:productId", verifyUser, updateProduct);
router.get("/getUsers", verifyUser, getAllNonAdminUsers);
router.get("/getDashboardDetails", verifyUser, getDashboard);
router.delete("/deleteUser", verifyUser, deleteUser);
router.post("/addUser", verifyUser, addUser);
router.get("/getOrders", verifyUser, getOrders);
router.post("/getOrder", verifyUser, getOrder);
router.get("/getLatestOrders", verifyUser, getLatestOrders);
router.get("/getOutOfStock", verifyUser, getOutOfStock);

export default router;
