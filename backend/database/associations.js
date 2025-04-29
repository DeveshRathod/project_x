import User from "./models/user.model.js";
import Address from "./models/address.model.js";
import Order from "./models/order.model.js";
import Product from "./models/product.model.js";
import Brand from "./models/brands.model.js";

const defineAssociations = () => {
  User.hasMany(Address, {
    foreignKey: "userId",
    as: "addressList",
  });
  Address.belongsTo(User, { foreignKey: "userId" });

  Order.belongsTo(Address, {
    foreignKey: {
      name: "addressId",
      allowNull: false,
    },
  });

  Order.belongsTo(User, {
    foreignKey: {
      name: "userId",
      allowNull: false,
    },
    onDelete: "CASCADE",
  });

  User.hasMany(Order, {
    foreignKey: "userId",
  });

  Product.hasMany(Order, {
    foreignKey: "productId",
    onDelete: "CASCADE",
  });
  Order.belongsTo(Product, { foreignKey: "productId" });

  Product.belongsTo(Brand, {
    foreignKey: "brandId",
    targetKey: "id",
    onDelete: "CASCADE",
  });
  Brand.hasMany(Product, {
    foreignKey: "brandId",
    sourceKey: "id",
    onDelete: "CASCADE",
  });
};

export default defineAssociations;
