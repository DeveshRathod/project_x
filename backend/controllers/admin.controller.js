import Brand from "../database/models/brands.model.js";
import Product from "../database/models/product.model.js";
import User from "../database/models/user.model.js";
import Order from "../database/models/order.model.js";
import { Op, fn, col, where } from "sequelize";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

import Address from "../database/models/address.model.js";

export const addBrand = async (req, res) => {
  const { name, url } = req.body;
  const isAdmin = req.user?.isAdmin;

  if (!isAdmin) {
    return res.status(403).json({ message: "Only admins can add brands" });
  }

  if (!name || !url) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields (name and url)" });
  }

  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  if (!urlRegex.test(url)) {
    return res.status(400).json({ message: "Please provide a valid URL" });
  }

  try {
    const brandId = Math.floor(
      100000000 + Math.random() * 900000000
    ).toString();

    const brand = await Brand.create({
      brandId,
      name,
      url,
    });

    return res.status(201).json(brand);
  } catch (error) {
    console.error("Error adding brand:", error);
    return res
      .status(500)
      .json({ message: `An error occurred: ${error.message}` });
  }
};

export const removeBrand = async (req, res) => {
  const { brandId, brandName } = req.body;

  if (!brandId || !brandName) {
    return res.status(400).json({ error: "Brand ID and name are required" });
  }

  try {
    // Find the brand by brandId and name
    const brand = await Brand.findOne({
      where: { brandId: brandId, name: brandName },
    });

    if (!brand) {
      return res.status(404).json({
        message: "Brand not found or name does not match the ID",
      });
    }

    // Delete all products that are associated with this brand
    const productResult = await Product.destroy({
      where: { brandId: brand.id }, // Delete products by brandId
    });

    // Delete the brand itself
    const brandResult = await brand.destroy();

    res.status(200).json({
      message: `${productResult} product(s) deleted and the brand has been removed`,
    });
  } catch (error) {
    console.error("Error removing brand:", error);
    res.status(500).json({
      error: "An error occurred while removing the brand and its products",
    });
  }
};

export const fetchAllBrandNames = async (req, res) => {
  try {
    // Fetch all brands with only name, url, and brandId fields
    const brands = await Brand.findAll({
      attributes: ["name", "url", "brandId"],
    });

    // Sort the brands alphabetically by name
    const brandData = brands
      .map((brand) => ({
        name: brand.name,
        url: brand.url,
        brandId: brand.brandId,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ brandData });
  } catch (error) {
    console.error("Error fetching brand names:", error);
    res.status(500).json({
      error: "An error occurred while fetching the brand names",
    });
  }
};

export const addProduct = async (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.isAdmin;

  if (!userId) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!isAdmin) {
    return res.status(403).json({ message: "Only admins can add products" });
  }

  const {
    name,
    price,
    description,
    specifications,
    images,
    category,
    brand: brandName,
    discount,
    sizes,
    stock,
    type,
    returnable,
    refundable,
    openbox,
    warranty,
  } = req.body;

  if (!returnable && refundable) {
    return res
      .status(400)
      .json({ message: "Non returnable cannot be refundable" });
  }

  if (price <= 0) {
    return res.status(400).json({ message: "Price must be greater than 0" });
  }

  if (stock <= 0) {
    return res.status(400).json({ message: "Stock must be greater than 0" });
  }

  try {
    const brand = await Brand.findOne({ where: { name: brandName } });

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    brand.products += 1;
    await brand.save();

    // Create product
    const product = await Product.create({
      name,
      price,
      description,
      specifications,
      images,
      category,
      brand: brandName,
      discount,
      brandId: brand.id,
      sizes,
      stock,
      type,
      returnable,
      refundable,
      openbox,
      warranty,
    });

    return res.status(201).json(product);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to add product: " + error.message });
  }
};

export const deleteProduct = async (req, res) => {
  const userId = req.user?.id;
  const isAdmin = req.user?.isAdmin;
  const productId = req.params.productId;

  if (!userId) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!isAdmin) {
    return res.status(403).json({ message: "Not an Admin" });
  }

  if (!productId) {
    return res.status(404).json({ message: "Product ID is required" });
  }

  try {
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Optional: decrease product count in Brand
    const brand = await Brand.findByPk(product.brandId);
    if (brand && brand.products > 0) {
      brand.products -= 1;
      await brand.save();
    }

    await product.destroy(); // Sequelize way to delete a row

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProduct = async (req, res) => {
  const userId = req.user?.id;
  const isAdmin = req.user?.isAdmin;
  const productId = req.params.productId;

  if (!userId) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!isAdmin) {
    return res.status(403).json({ message: "Not an Admin" });
  }

  if (!productId) {
    return res.status(404).json({ message: "Product ID is required" });
  }

  try {
    const product = await Product.findByPk(productId, {
      include: [{ model: Brand, attributes: ["name", "brandId"] }],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllProduct = async (req, res) => {
  try {
    const { searchQuery, category } = req.query;

    const whereClause = {};

    if (searchQuery) {
      const lowerQuery = `%${searchQuery.toLowerCase()}%`;
      whereClause[Op.or] = [
        where(fn("LOWER", col("Product.name")), {
          [Op.like]: lowerQuery,
        }),
        where(fn("LOWER", col("Product.description")), {
          [Op.like]: lowerQuery,
        }),
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const products = await Product.findAll({
      where: whereClause,
      include: [
        {
          model: Brand,
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDashboard = async (req, res) => {
  const userId = req.user?.id;
  const isAdmin = req.user?.isAdmin;

  if (!userId) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!isAdmin) {
    return res.status(403).json({ message: "Not an Admin" });
  }

  try {
    const userCount = await User.count({ where: { isAdmin: false } });

    const productCount = await Product.count();

    const pendingOrdersCount = await Order.count({
      where: {
        status: {
          [Op.in]: ["Placed"],
        },
      },
    });

    const completedOrdersCount = await Order.count({
      where: {
        status: "Delivered",
      },
    });

    return res.status(200).json({
      userCount,
      productCount,
      pendingOrdersCount,
      completedOrdersCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProduct = async (req, res) => {
  const userId = req.user?.id;
  const isAdmin = req.user?.isAdmin;
  const productId = req.params.productId;

  if (!userId) return res.status(404).json({ message: "User not found" });
  if (!isAdmin) return res.status(403).json({ message: "Not an Admin" });
  if (!productId) return res.status(404).json({ message: "Product not found" });

  const {
    name,
    price,
    description,
    specifications,
    images,
    category,
    brandId,
    stock,
    returnable,
    refundable,
    openbox,
    warranty,
  } = req.body;

  try {
    const product = await Product.findByPk(productId);

    if (!product) return res.status(404).json({ message: "Product not found" });

    await product.update({
      name,
      price,
      description,
      specifications,
      images,
      category,
      brandId,
      stock,
      returnable,
      refundable,
      openbox,
      warranty,
    });

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllNonAdminUsers = async (req, res) => {
  const {
    searchquery,
    page = 1,
    sortField = "createdAt",
    sortOrder = "asc",
  } = req.query;
  const limit = 11;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const where = {
      isAdmin: false,
    };

    if (searchquery) {
      const lowerQuery = searchquery.toLowerCase();

      where[Op.or] = [
        {
          username: {
            [Op.like]: fn("LOWER", col("username")),
            [Op.like]: `%${lowerQuery}%`,
          },
        },
        {
          email: {
            [Op.like]: fn("LOWER", col("email")),
            [Op.like]: `%${lowerQuery}%`,
          },
        },
        {
          mobile: {
            [Op.like]: fn("LOWER", col("mobile")),
            [Op.like]: `%${lowerQuery}%`,
          },
        },
      ];
    }

    const users = await User.findAll({
      where,
      order: [[sortField, sortOrder === "asc" ? "ASC" : "DESC"]],
      limit,
      offset,
    });

    const userSuggestions = users.map((user) => {
      return {
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        profile: user.profile,
        birthday: user.birthday
          ? format(new Date(user.birthday), "yyyy-MM-dd")
          : null, // Format birthday
        createdAt: format(new Date(user.createdAt), "yyyy-MM-dd HH:mm:ss"),
      };
    });

    return res.status(200).json(userSuggestions);
  } catch (error) {
    console.error("Error fetching non-admin users:", error);
    return res.status(500).json({ message: "Failed to fetch non-admin users" });
  }
};

export const deleteUser = async (req, res) => {
  const isAdmin = req.user?.isAdmin;
  const { userId } = req.body;

  try {
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized, admin access required" });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.destroy();

    return res.status(200).json({ deletedUser: user });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const addUser = async (req, res) => {
  const isAdmin = req.user?.isAdmin;

  try {
    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized, admin access required" });
    }

    const user = await User.create(req.body);
    return res.status(201).json(user);
  } catch (error) {
    console.error("Error adding user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getOrders = async (req, res) => {
  const isAdmin = req.user?.isAdmin;
  if (!isAdmin) {
    return res.status(403).json({
      message: "Only Admin can access this information",
    });
  }

  const {
    searchquery,
    page = 1,
    sortField = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const limit = 11;
  const offset = (parseInt(page) - 1) * limit;

  try {
    const where = {};

    if (searchquery) {
      const trimmedQuery = searchquery.trim();
      where[Op.or] = [
        {
          userId: {
            [Op.like]: `%${trimmedQuery}%`,
          },
        },
        {
          orderId: {
            [Op.like]: `%${trimmedQuery}%`,
          },
        },
        {
          transactionId: {
            [Op.like]: `%${trimmedQuery}%`,
          },
        },
        {
          status: {
            [Op.like]: `%${trimmedQuery}%`,
          },
        },
      ];
    }

    const orders = await Order.findAll({
      where,
      include: [
        {
          model: Address,
          attributes: ["pincode"],
        },
      ],
      order: [[sortField, sortOrder.toUpperCase()]],
      limit,
      offset,
    });

    const formattedOrders = orders.map((order) => ({
      orderId: order.orderId,
      transactionId: order.transactionId || "N/A",
      amount: order.totalAmount,
      userId: order.userId,
      pincode: order.address?.pincode || "N/A",
      date: format(new Date(order.createdAt), "yyyy-MM-dd HH:mm:ss"),
      status: order.status,
      payment: order.typeOfPayment,
    }));

    return res.status(200).json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({ message: "Server error" });
  }
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

export const updateOrder = async (req, res) => {
  const isAdmin = req.user?.isAdmin;
  if (!isAdmin) {
    return res.status(403).json({
      message: "Only Admin can access this information",
    });
  }

  const {
    state,
    orderId,
    transactionId,
    userId,
    typeOfPayment,
    products,
    comment,
  } = req.body;

  try {
    const order = await Order.findOne({ where: { orderId } });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update the order status
    order.status = state;
    await order.save();

    // Notify all admins
    const admins = await User.findAll({ where: { isAdmin: true } });
    const adminMsg = `Order with ID ${orderId} status updated to ${state}`;

    await Promise.all(
      admins.map(async (admin) => {
        const existing = Array.isArray(admin.notifications)
          ? admin.notifications
          : [];
        admin.notifications = [
          ...existing,
          generateNotification(adminMsg, "System (Admin)"),
        ];
        await admin.save();
      })
    );

    // Notify the customer
    const user = await User.findOne({ where: { id: userId } });
    if (user) {
      const existing = Array.isArray(user.notifications)
        ? user.notifications
        : [];

      let userMsg = `Your order with ID ${orderId} has been ${state}.`;

      // Refund notice
      if (typeOfPayment === "Stripe" && state.toLowerCase() === "cancelled") {
        userMsg += ` Refund for transaction ${transactionId} will be processed within 4-7 business days.`;
      }

      const userNotifications = [
        ...existing,
        generateNotification(userMsg, "System (Admin)"),
      ];

      // Optional comment
      if (comment && comment.trim() !== "") {
        userNotifications.push(
          generateNotification(
            `Admin note for Order ${orderId}: ${comment.trim()}`,
            "System (Admin)"
          )
        );
      }

      // Restock products if cancelled
      if (state.toLowerCase() === "cancelled" && Array.isArray(products)) {
        await Promise.all(
          products.map(async (item) => {
            const product = await Product.findOne({ where: { id: item.id } });
            if (product) {
              product.stock = product.stock + 1;
              await product.save();
            }
          })
        );
      }

      user.notifications = userNotifications;
      await user.save();
    }

    return res.status(200).json({
      message: `Order status updated to ${state}`,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getOrder = async (req, res) => {
  const { orderId } = req.body;
  const isAdmin = req.user?.isAdmin;
  if (!isAdmin) {
    return res.status(403).json({
      message: "Only Admin can access this information",
    });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const getLatestOrders = async (req, res) => {
  const isAdmin = req.user?.isAdmin;
  if (!isAdmin) {
    return res.status(403).json({
      message: "Only Admin can access this information",
    });
  }

  try {
    const latestOrders = await Order.findAll({
      attributes: ["orderId", "typeOfPayment", "totalAmount"],
      where: { status: "placed" },
      order: [["createdAt", "DESC"]],
      limit: 10,
    });

    return res.status(200).json({
      latestOrders,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getOutOfStock = async (req, res) => {
  const isAdmin = req.user?.isAdmin;
  if (!isAdmin) {
    return res.status(403).json({
      message: "Only Admin can access this information",
    });
  }

  try {
    const outOfStockProducts = await Product.findAll({
      where: { stock: 0 },
      attributes: ["name", "discount"],
      include: [
        {
          model: Brand,
          attributes: ["name"],
        },
      ],
    });

    res.status(200).json({
      outOfStockProducts,
    });
  } catch (error) {
    console.error("Error fetching out-of-stock products:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
