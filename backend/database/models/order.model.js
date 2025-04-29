import { DataTypes, DATE } from "sequelize";
import { sequelize } from "../connection.js";
import User from "./user.model.js";
import Address from "./address.model.js";
import { v4 as uuidv4 } from "uuid";

const Order = sequelize.define(
  "Order",
  {
    orderId: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
      allowNull: false,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    products: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "Placed",
    },
    address: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    typeOfPayment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  }
);

export default Order;
