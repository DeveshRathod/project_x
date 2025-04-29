import express from "express";
import { pay } from "../controllers/payment.controller.js";
import verifyUser from "../utils/verifyUser.js";

const router = express.Router();

router.post("/placeOrder", verifyUser, pay);

export default router;
