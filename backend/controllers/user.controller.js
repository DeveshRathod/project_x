import User from "../database/models/user.model.js";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import Address from "../database/models/address.model.js";
import Order from "../database/models/order.model.js";
import { v4 as uuidv4 } from "uuid";

const generateNotification = (message, sender) => {
  return {
    message,
    sender,
    date: new Date(),
    notificationId: uuidv4(),
    status: "Unread",
  };
};

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{3,15}$/;
  return usernameRegex.test(username);
}

export const me = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: "Token required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = {
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      birthday: user.birthday,
      gender: user.gender,
      mobile: user.mobile,
      profile: user.profile,
      isAdmin: user.isAdmin,
      background: user.background,
      createdAt: user.createdAt,
    };

    return res.status(200).json({ currentUser });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isPasswordValid = bcryptjs.compareSync(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400, // expires in 24 hours
    });

    const currentUser = {
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      birthday: user.birthday,
      gender: user.gender,
      mobile: user.mobile,
      profile: user.profile,
      isAdmin: user.isAdmin,
      background: user.background,
      createdAt: user.createdAt,
    };

    return res.status(200).json({ token, currentUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const signup = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    birthday,
    gender,
    confirmPassword,
  } = req.body;

  if (confirmPassword !== password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Invalid email" });
  }

  try {
    const exists = await User.findOne({ where: { email } });

    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = bcryptjs.hashSync(password, 8);
    const user = await User.create({
      firstName,
      lastName,
      birthday,
      gender,
      email,
      password: hashedPassword,
    });

    const token = jwt.sign({ _id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400,
    });

    const currentUser = {
      _id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      birthday: user.birthday,
      gender: user.gender,
      mobile: user.mobile,
      profile: user.profile,
      isAdmin: user.isAdmin,
      background: user.background,
      createdAt: user.createdAt,
    };

    return res.status(201).json({ token, currentUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  const userId = req.user.id;
  const userData = req.body;

  try {
    if (userData.email && !isValidEmail(userData.email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (userData.username && !isValidUsername(userData.username)) {
      return res.status(400).json({ message: "Invalid username format" });
    }

    if (userData.password) {
      if (userData.password.length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be 8 characters long" });
      }
      if (userData.confirmPassword !== userData.password) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      userData.password = await bcryptjs.hash(userData.password, 8);
    }

    const updateFields = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      background: userData.background,
      username: userData.username,
      email: userData.email,
      birthday: userData.birthday,
      gender: userData.gender,
      mobile: userData.mobile,
      profile: userData.profile,
      password: userData.password,
    };

    Object.keys(updateFields).forEach(
      (key) =>
        (updateFields[key] === undefined ||
          updateFields[key] === "" ||
          updateFields[key] === null) &&
        delete updateFields[key]
    );

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update(updateFields);

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.user.id;
  console.log(userId);

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();

    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAddress = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId, {
      include: {
        model: Address,
        as: "addressList",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.addressList);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addAddress = async (req, res) => {
  const {
    type,
    name,
    mobile,
    addressLine1,
    addressLine2,
    addressLine3,
    pincode,
  } = req.body;
  const userId = req.user.id;

  if (
    !type ||
    !name ||
    !mobile ||
    !addressLine1 ||
    !addressLine2 ||
    !addressLine3 ||
    !pincode
  ) {
    return res.status(400).json({ message: "Please fill all fields" });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAddress = await Address.create({
      type,
      name,
      mobile,
      addressLine1,
      addressLine2,
      addressLine3,
      pincode,
      userId,
    });

    return res
      .status(200)
      .json({ message: "Address Added", address: newAddress });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAddress = async (req, res) => {
  const { addressId } = req.body;
  const userId = req.user.id;

  try {
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId: userId,
      },
    });

    if (!address) {
      return res
        .status(404)
        .json({ message: "Address not found for this user" });
    }

    await address.destroy();

    const updatedAddresses = await Address.findAll({
      where: { userId },
    });

    return res.status(200).json({
      message: "Address deleted",
      address: updatedAddresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getOrders = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const whereClause = { userId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      whereClause.createdAt = {
        [Op.between]: [startDate, endDate],
      };
    }

    const orders = await Order.findAll({
      where: whereClause,
      include: [Address],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelOrder = async (req, res) => {
  const { orderId, transactionId } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(orderId);
    console.log(user.orders);
    const order = user.orders.find((id) => id === orderId);

    if (!order) {
      return res
        .status(404)
        .json({ error: "Order not found in user's orders list" });
    }

    const orderInDb = await Order.findByPk(orderId);
    if (!orderInDb) {
      return res.status(404).json({ error: "Order not found in the database" });
    }

    orderInDb.status = "Requested cancellation";
    await orderInDb.save();

    const adminUser = await User.findOne({ where: { isAdmin: true } });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const adminMessage = `A cancellation request has been submitted for Order ID: ${orderId}, Transaction ID: ${transactionId}. Please review and process the request accordingly.`;
    const adminNotification = generateNotification(adminMessage, userId);

    adminUser.notifications.push(adminNotification);
    await adminUser.save();

    const userMessage = `Dear Customer, your cancellation request for Order ID: ${orderId} has been successfully submitted. If the payment has already been made, the refund process will be initiated shortly. Thank you for shopping with us.`;
    const userNotification = generateNotification(userMessage, "System");

    user.notifications.push(userNotification);
    await user.save();

    return res.status(200).json({
      message:
        "Order cancellation requested and notifications sent to both admin and user",
    });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while canceling the order" });
  }
};

export const getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const notifications = user.notifications || [];

    const sortedNotifications = notifications.sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const unreadCount = sortedNotifications.filter(
      (notification) => notification.status === "Unread"
    ).length;

    return res.status(200).json({
      notifications: sortedNotifications,
      unreadCount: unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedNotifications = (user.notifications || []).map(
      (notification) => ({
        ...notification,
        status: "Read",
      })
    );

    user.notifications = updatedNotifications;
    await user.save();

    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNotifications = async (req, res) => {
  const userId = req.user.id;
  const { notificationIds } = req.body;

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const filteredNotifications = (user.notifications || []).filter(
      (notification) => !notificationIds.includes(notification.notificationId)
    );

    user.notifications = filteredNotifications;
    await user.save();

    return res.status(200).json(user.notifications);
  } catch (error) {
    console.error("Error deleting notifications:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
