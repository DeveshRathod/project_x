import { Op, fn, col, where } from "sequelize";
import Brand from "../database/models/brands.model.js";
import Product from "../database/models/product.model.js";
import User from "../database/models/user.model.js";

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

export const getAllNewArrival = async (req, res) => {
  const categories = ["mobiles", "travels", "electronics", "toys"];

  try {
    const latestEntries = await Promise.all(
      categories.map(async (category) => {
        const latest = await Product.findOne({
          where: { category },
          order: [["createdAt", "DESC"]],
        });
        return latest;
      })
    );

    const resultArray = latestEntries.filter(Boolean);

    return res.status(200).json(resultArray);
  } catch (error) {
    console.error("Error fetching latest entries:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const exploreProducts = async (req, res) => {
  const { category, searchQuery, type, page = 1 } = req.query;
  const limit = 8;
  const offset = (page - 1) * limit;

  try {
    const where = {};

    if (category && category.toLowerCase() !== "all") {
      where.category = category;
    }

    if (type && type.toLowerCase() !== "all") {
      where.type = type;
    }

    if (searchQuery) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${searchQuery}%` } },
        { description: { [Op.iLike]: `%${searchQuery}%` } },
        // Optional: search in brand name using JOIN
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Brand,
          attributes: ["name"], // Optional: include brand name
        },
      ],
    });

    return res.status(200).json({
      products,
      currentPage: Number(page),
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("Error exploring products:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addCart = async (req, res) => {
  const userId = req.user.id;
  const { id, colorIndex } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Extract product image and color info safely
    const productImages = product.images || [];
    const image = productImages[colorIndex]?.images?.[0]?.url || "";
    const colorName = productImages[colorIndex]?.name || "";

    // Get current cart or start fresh
    let currentCart = [];
    if (Array.isArray(user.cart)) {
      currentCart = [...user.cart]; // clone to be explicit
    }

    // Explicitly create the cart item object
    const newCartItem = {
      id: id,
      name: product.name,
      image,
      colorName,
      colorIndex,
      price: product.price,
      brand: product.brand,
      discount: product.discount,
      stock: product.stock,
      sold: product.sold,
    };

    const updatedCart = [...currentCart, newCartItem];
    user.cart = updatedCart;

    await user.save();

    return res.status(200).json(user.cart);
  } catch (error) {
    console.error("Error adding product to cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteCart = async (req, res) => {
  const userId = req.user.id;
  const { productId, colorIndex } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get current cart or start fresh
    let currentCart = [];
    if (Array.isArray(user.cart)) {
      currentCart = [...user.cart]; // Clone to be explicit
    }

    // Find the index of the first occurrence of the matching product
    const indexToDelete = currentCart.findIndex(
      (item) => item.productId === productId && item.colorIndex === colorIndex
    );

    if (indexToDelete !== -1) {
      // Remove only the first occurrence of the matching item
      currentCart.splice(indexToDelete, 1);

      // Update the user's cart
      user.cart = currentCart;
      await user.save();
    }

    return res.status(200).json(user.cart); // Return the updated cart
  } catch (error) {
    console.error("Error deleting product from cart:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCurrentProduct = async (req, res) => {
  const { productId } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  try {
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Brand,
          attributes: ["name", "brandId"],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCartItems = async (req, res) => {
  const userId = req.user.id; // Sequelize uses `id`, not `_id`

  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItems = user.cart || [];

    return res.status(200).json(cartItems);
  } catch (error) {
    console.error("Error retrieving cart items:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getLatestFurnitureProduct = async (req, res) => {
  try {
    const latestFurnitureProduct = await Product.findOne({
      where: {
        category: "furniture",
      },
      order: [["createdAt", "DESC"]],
    });

    // if (!latestFurnitureProduct) {
    //   return res.status(300).json({ message: "No furniture products found" });
    // }

    return res.status(200).json(latestFurnitureProduct);
  } catch (error) {
    console.error("Error fetching latest furniture product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllFashion = async (req, res) => {
  try {
    const latestProduct = await Product.findOne({
      where: {
        category: "fashion",
      },
      order: [["createdAt", "DESC"]],
    });

    if (!latestProduct) {
      return res.status(200).json({ resultArray: {}, brand: [] });
    }

    const { brand } = latestProduct;
    const productTypes = ["male", "female", "kids"];

    const latestProductsByType = await Product.findAll({
      where: {
        brand,
        category: "fashion",
        type: productTypes,
      },
      order: [["createdAt", "DESC"]],
      attributes: [
        "type",
        [
          Sequelize.fn("MAX", Sequelize.col("createdAt")),
          "latestEntryCreatedAt",
        ],
      ],
      group: ["type"],
    });

    const resultArray = productTypes
      .map((type) => {
        const foundEntry = latestProductsByType.find(
          (entry) => entry.type === type
        );
        return foundEntry ? foundEntry : null;
      })
      .filter(Boolean);

    return res.status(200).json({ resultArray, brand });
  } catch (error) {
    console.error(
      "Error fetching latest fashion products by brand and type:",
      error
    );
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const suggestion = async (req, res) => {
  const { searchQuery } = req.query;

  if (
    !searchQuery ||
    searchQuery.trim() === "" ||
    /[!@#$%^&*()_+={}\[\]:;"'<>,.?/\\|]/.test(searchQuery)
  ) {
    return res.json([]);
  }

  try {
    const lowerQuery = searchQuery.toLowerCase();

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          where(fn("LOWER", col("Product.name")), {
            [Op.like]: `%${lowerQuery}%`,
          }),
          where(fn("LOWER", col("Brand.name")), {
            [Op.like]: `%${lowerQuery}%`,
          }),
        ],
      },
      include: [
        {
          model: Brand,
          attributes: ["name"], // optional: include brand name in result
        },
      ],
      limit: 4,
    });

    const suggestions = products.map((product) => {
      const discount = product.discount || 0;
      const discountedPrice = product.price - (product.price * discount) / 100;
      return {
        name: product.name,
        price: discountedPrice.toFixed(2),
        brand: product.Brand?.name || "Unknown", // optional
      };
    });

    res.json(suggestions);
  } catch (error) {
    console.error("Error searching for suggestions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const allImages = async (req, res) => {
  try {
    const images = await Brand.findAll();

    const imageUrls = images.map((image) => image.url);
    res.json(imageUrls);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
};
