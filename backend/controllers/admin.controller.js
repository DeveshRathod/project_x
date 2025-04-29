import Brand from "../database/models/brands.model.js";
import Product from "../database/models/product.model.js";
import User from "../database/models/user.model.js";
import Order from "../database/models/order.model.js";
import { Op } from "sequelize";

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

    const where = {};

    if (searchQuery) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchQuery}%` } },
        { description: { [Op.iLike]: `%${searchQuery}%` } },
        // You can also join and search brand name if needed
      ];
    }

    if (category) {
      where.category = category;
    }

    const products = await Product.findAll({
      where,
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
          [Op.in]: ["Placed", "Shipped"],
        },
      },
    });

    const completedOrdersCount = await Order.count({
      where: {
        status: "Completed",
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
      const search = `%${searchquery}%`;
      where[Op.or] = [
        { username: { [Op.iLike]: search } },
        { email: { [Op.iLike]: search } },
        { mobile: { [Op.iLike]: search } },
      ];
    }

    const users = await User.findAll({
      where,
      order: [[sortField, sortOrder === "asc" ? "ASC" : "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json(users);
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
