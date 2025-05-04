import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { sequelize } from "../database/connection.js";
import Order from "../database/models/order.model.js";
import User from "../database/models/user.model.js";
import Address from "../database/models/address.model.js";
import Product from "../database/models/product.model.js";

const stripe = new Stripe(process.env.STRIPE_KEY);

const generateOrderId = () => {
  return "SE" + Math.random().toString(36).slice(2, 12).toUpperCase();
};

const generateNotification = (message, sender) => {
  return {
    message,
    sender,
    date: new Date(),
    notificationId: uuidv4(),
    status: "Unread",
  };
};

export const pay = async (req, res) => {
  const {
    totalAmount,
    product,
    typeOfPayment,
    address,
    successURL,
    cancelURL,
  } = req.body;

  const currentUser = req.user;

  const calculateFinalPrice = (price, discount) => {
    if (discount >= 0 && discount <= 100) {
      return price * (1 - discount / 100);
    } else {
      return price;
    }
  };

  const transactionId = uuidv4();
  const orderId = generateOrderId();

  const transaction = await sequelize.transaction();

  try {
    const addressRecord = await Address.findByPk(address);
    if (!addressRecord) throw new Error("Invalid address ID.");

    const fullAddressObject = {
      type: addressRecord.type,
      name: addressRecord.name,
      mobile: addressRecord.mobile,
      addressLine1: addressRecord.addressLine1,
      addressLine2: addressRecord.addressLine2,
      addressLine3: addressRecord.addressLine3,
      pincode: addressRecord.pincode,
    };

    const createOrderInDB = async () => {
      const newOrder = await Order.create(
        {
          userId: currentUser.id,
          products: product,
          totalAmount,
          addressId: address,
          address: fullAddressObject,
          typeOfPayment,
          transactionId,
          orderId,
        },
        { transaction }
      );
      return newOrder.orderId;
    };

    if (typeOfPayment === "Stripe") {
      const line_items = product.map((item) => {
        let amount = calculateFinalPrice(item.price, item.discount);
        if (totalAmount < 500) amount += 40;

        return {
          price_data: {
            currency: "inr",
            product_data: {
              name: item.name,
              images: [item.image],
              description: item.brand,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        };
      });

      const sessionStripe = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        success_url: successURL,
        cancel_url: cancelURL,
      });

      const createdOrderId = await createOrderInDB();

      const user = await User.findByPk(currentUser.id, { transaction });
      if (!user) throw new Error("User not found.");

      const userNotification = generateNotification(
        `Your order with ID: ${orderId} has been placed.`,
        `${currentUser?.username || "System"} (User)`
      );

      await user.update(
        {
          notifications: [...(user.notifications || []), userNotification],
          orders: [...(user.orders || []), createdOrderId],
        },
        { transaction }
      );

      await transaction.commit();

      const admins = await User.findAll({ where: { isAdmin: true } });
      const adminNotification = generateNotification(
        `New order placed with ID: ${orderId}`,
        `${currentUser.id} (User)`
      );

      for (const admin of admins) {
        await admin.update({
          notifications: [...(admin.notifications || []), adminNotification],
        });
      }

      res.status(200).json({ url: sessionStripe.url, product });
    } else {
      const createdOrderId = await createOrderInDB();

      const user = await User.findByPk(currentUser.id, { transaction });
      const userNotification = generateNotification(
        `Your order with ID: ${orderId} has been placed.`,
        `System (Admin)`
      );

      await user.update(
        {
          notifications: [...(user.notifications || []), userNotification],
          orders: [...(user.orders || []), createdOrderId],
        },
        { transaction }
      );

      await Promise.all(
        product.map(async (item) => {
          const dbProduct = await Product.findOne({ where: { id: item.id } });
          if (dbProduct) {
            dbProduct.stock = Math.max(0, dbProduct.stock - 1);
            await dbProduct.save();
          }
        })
      );

      await transaction.commit();

      const admins = await User.findAll({ where: { isAdmin: true } });
      const adminNotification = generateNotification(
        `New order placed with ID: ${orderId}`,
        `${currentUser.id} (User)`
      );

      for (const admin of admins) {
        await admin.update({
          notifications: [...(admin.notifications || []), adminNotification],
        });
      }

      res.status(200).json({ url: successURL });
    }
  } catch (error) {
    await transaction.rollback();
    console.error("Payment error:", error);
    res.status(500).send({ error: error.message });
  }
};
