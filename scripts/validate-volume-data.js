import process from "node:process";
import mongoose from "mongoose";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

function parseIntEnv(name, fallback) {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return parsed;
}

const config = {
  mongoUrl:
    process.env.MONGO_URL ||
    "mongodb://root:rootpassword@localhost:27017/ecom_volume?authSource=admin",
  expectedCategories: parseIntEnv("VOLUME_SEED_CATEGORIES", 100),
  expectedUsers: parseIntEnv("VOLUME_SEED_USERS", 5000),
  expectedProducts: parseIntEnv("VOLUME_SEED_PRODUCTS", 10000),
  expectedOrders: parseIntEnv("VOLUME_SEED_ORDERS", 5000),
};

async function main() {
  await mongoose.connect(config.mongoUrl);

  try {
    const actual = {
      categories: await categoryModel.countDocuments({}),
      admins: await userModel.countDocuments({ role: 1 }),
      users: await userModel.countDocuments({ role: 0 }),
      products: await productModel.countDocuments({}),
      orders: await orderModel.countDocuments({}),
    };

    const failures = [];

    if (actual.categories < config.expectedCategories) {
      failures.push(
        `categories below target (${actual.categories} < ${config.expectedCategories})`
      );
    }

    if (actual.users < config.expectedUsers) {
      failures.push(`users below target (${actual.users} < ${config.expectedUsers})`);
    }

    if (actual.products < config.expectedProducts) {
      failures.push(
        `products below target (${actual.products} < ${config.expectedProducts})`
      );
    }

    if (config.expectedOrders > 0 && actual.orders < config.expectedOrders) {
      failures.push(
        `orders below target (${actual.orders} < ${config.expectedOrders})`
      );
    }

    if (failures.length > 0) {
      console.error("[validate] failed", {
        expected: {
          categories: config.expectedCategories,
          users: config.expectedUsers,
          products: config.expectedProducts,
          orders: config.expectedOrders,
        },
        actual,
        failures,
      });
      process.exit(1);
    }

    console.log("[validate] dataset counts are ready", {
      expected: {
        categories: config.expectedCategories,
        users: config.expectedUsers,
        products: config.expectedProducts,
        orders: config.expectedOrders,
      },
      actual,
    });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("[validate] failed", error);
  process.exit(1);
});
