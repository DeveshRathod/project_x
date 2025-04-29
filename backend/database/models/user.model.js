import { DataTypes } from "sequelize";
import { sequelize } from "../connection.js";
import Address from "./address.model.js";
import Order from "./order.model.js";
import { v4 as uuidv4 } from "uuid";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birthday: {
      type: DataTypes.DATEONLY,
      defaultValue: "1999-01-01",
    },
    gender: {
      type: DataTypes.STRING,
      defaultValue: "M",
      validate: {
        isIn: {
          args: [["M", "F", "O"]],
          msg: 'Gender must be "M", "F", or "O"',
        },
      },
    },
    mobile: {
      type: DataTypes.STRING,
      defaultValue: "9999999999",
      validate: {
        is: {
          args: /^[0-9]{10}$/,
          msg: "Mobile number must be a 10-digit number",
        },
      },
    },
    profile: {
      type: DataTypes.STRING,
      defaultValue:
        "https://www.uhs-group.com/wp-content/uploads/2020/08/person-dummy-e1553259379744.jpg",
    },
    background: {
      type: DataTypes.STRING,
      defaultValue: "https://cdn.wallpapersafari.com/25/35/duzYIR.jpg",
    },
    cart: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    orders: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    notifications: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: (user) => {
        if (!user.username) {
          const prefix = `${user.firstName.slice(0, 3)}${user.lastName.slice(
            0,
            3
          )}`.toLowerCase();
          const random = Math.floor(100000 + Math.random() * 900000);
          user.username = `${prefix}${random}`;
        }
      },
    },
  }
);

export default User;
