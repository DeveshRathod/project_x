import express from "express";
import {
  addCart,
  allImages,
  deleteCart,
  exploreProducts,
  getAllFashion,
  getAllNewArrival,
  getCartItems,
  getCurrentProduct,
  getLatestFurnitureProduct,
  suggestion,
} from "../controllers/product.controller.js";
import verifyUser from "../utils/verifyUser.js";

const router = express.Router();

router.get("/newarrivals", getAllNewArrival);
router.get("/newfashion", getAllFashion);
router.get("/newFurniture", getLatestFurnitureProduct);
router.get("/exploreProducts", exploreProducts);
router.post("/addToCart", verifyUser, addCart);
router.get("/getcart", verifyUser, getCartItems);
router.post("/getProduct", getCurrentProduct);
router.post("/deleteCart", verifyUser, deleteCart);
router.get("/getSuggestion", suggestion);
router.get("/getBrands", allImages);

export default router;
