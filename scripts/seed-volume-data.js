import process from "node:process";
import path from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import mongoose from "mongoose";
import slugify from "slugify";
import { hashPassword } from "../helpers/authHelper.js";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";

function parseIntEnv(name, defaultValue) {
  const value = process.env[name];
  if (!value) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return parsed;
}

function parseBoolEnv(name, defaultValue) {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const config = {
  mongoUrl:
    process.env.MONGO_URL ||
    "mongodb://root:rootpassword@localhost:27017/ecom_volume?authSource=admin",
  categories: parseIntEnv("VOLUME_SEED_CATEGORIES", 100),
  users: parseIntEnv("VOLUME_SEED_USERS", 5000),
  admins: parseIntEnv("VOLUME_SEED_ADMINS", 5),
  products: parseIntEnv("VOLUME_SEED_PRODUCTS", 10000),
  orders: parseIntEnv("VOLUME_SEED_ORDERS", 5000),
  maxDistinctProductsPerOrder: parseIntEnv("VOLUME_MAX_DISTINCT_PRODUCTS", 20),
  maxQuantityPerProduct: parseIntEnv("VOLUME_MAX_PRODUCT_QTY", 10),
  reset: parseBoolEnv("VOLUME_SEED_RESET", true),
  password: process.env.VOLUME_TEST_PASSWORD || "VolumeTest!123",
  categoryBatchSize: parseIntEnv("VOLUME_CATEGORY_BATCH", 500),
  userBatchSize: parseIntEnv("VOLUME_USER_BATCH", 500),
  productBatchSize: parseIntEnv("VOLUME_PRODUCT_BATCH", 1000),
  orderBatchSize: parseIntEnv("VOLUME_ORDER_BATCH", 250),
};

function buildCategoryDoc(index) {
  const name = `Volume Category ${String(index).padStart(4, "0")}`;
  return {
    name,
    slug: slugify(name).toLowerCase(),
  };
}

function buildAdminDoc(index, hashedPassword) {
  const suffix = String(index).padStart(4, "0");
  return {
    name: `Volume Admin ${suffix}`,
    email: `volume-admin-${suffix}@test.local`,
    password: hashedPassword,
    phone: `9000${String(index).padStart(4, "0")}`,
    address: `Volume HQ #${suffix}`,
    answer: `volume-admin-${suffix}`,
    role: 1,
  };
}

function buildUserDoc(index, hashedPassword) {
  const suffix = String(index).padStart(6, "0");
  return {
    name: `Volume User ${suffix}`,
    email: `volume-user-${suffix}@test.local`,
    password: hashedPassword,
    phone: `8${String(index).padStart(7, "0")}`,
    address: `Volume Address ${suffix}`,
    answer: `volume-user-${suffix}`,
    role: 0,
  };
}

function buildProductDoc(index, categoryIds) {
  const suffix = String(index).padStart(6, "0");
  const name = `Volume Product ${suffix}`;
  return {
    name,
    slug: slugify(name).toLowerCase(),
    description: `Synthetic product ${suffix} for volume testing`,
    price: randomInt(5, 5000),
    category: categoryIds[randomInt(0, categoryIds.length - 1)],
    quantity: randomInt(10, 500),
    shipping: Math.random() < 0.7,
  };
}

function buildOrderDoc(index, userIds, productCatalog) {
  const distinctTarget = randomInt(
    1,
    Math.min(config.maxDistinctProductsPerOrder, productCatalog.length)
  );

  const selectedMap = new Map();
  while (selectedMap.size < distinctTarget) {
    const item = productCatalog[randomInt(0, productCatalog.length - 1)];
    selectedMap.set(String(item._id), item);
  }

  const productRefs = [];
  let totalAmount = 0;

  for (const item of selectedMap.values()) {
    const quantity = randomInt(1, config.maxQuantityPerProduct);
    totalAmount += item.price * quantity;

    for (let i = 0; i < quantity; i += 1) {
      productRefs.push(item._id);
    }
  }

  return {
    products: productRefs,
    payment: {
      provider: "simulated-volume-seed",
      success: true,
      transactionId: `vol-seed-${index}-${Date.now()}`,
      amount: Number(totalAmount.toFixed(2)),
    },
    buyer: userIds[randomInt(0, userIds.length - 1)],
    status: "Not Process",
  };
}

async function insertInBatches(total, batchSize, buildDoc, insertFn, label) {
  for (let start = 1; start <= total; start += batchSize) {
    const end = Math.min(total, start + batchSize - 1);
    const docs = [];

    for (let index = start; index <= end; index += 1) {
      docs.push(buildDoc(index));
    }

    await insertFn(docs);
    console.log(`[seed] ${label}: ${end}/${total}`);
  }
}

async function seedOrders(orderCount, userIds, productCatalog) {
  await insertInBatches(
    orderCount,
    config.orderBatchSize,
    (index) => buildOrderDoc(index, userIds, productCatalog),
    (docs) => orderModel.insertMany(docs, { ordered: false }),
    "orders"
  );
}

async function main() {
  console.log("[seed] connecting to mongo", config.mongoUrl);
  await mongoose.connect(config.mongoUrl);

  try {
    if (config.reset) {
      console.log("[seed] resetting collections");
      await Promise.all([
        categoryModel.deleteMany({}),
        userModel.deleteMany({}),
        productModel.deleteMany({}),
        orderModel.deleteMany({}),
      ]);
    }

    await insertInBatches(
      config.categories,
      config.categoryBatchSize,
      (index) => buildCategoryDoc(index),
      (docs) => categoryModel.insertMany(docs, { ordered: false }),
      "categories"
    );

    const categories = await categoryModel.find({}, "_id").lean();
    const categoryIds = categories.map((item) => item._id);

    if (categoryIds.length === 0) {
      throw new Error("No categories available after category seeding");
    }

    const hashedPassword = await hashPassword(config.password);

    await insertInBatches(
      config.admins,
      config.userBatchSize,
      (index) => buildAdminDoc(index, hashedPassword),
      (docs) => userModel.insertMany(docs, { ordered: false }),
      "admins"
    );

    await insertInBatches(
      config.users,
      config.userBatchSize,
      (index) => buildUserDoc(index, hashedPassword),
      (docs) => userModel.insertMany(docs, { ordered: false }),
      "users"
    );

    await insertInBatches(
      config.products,
      config.productBatchSize,
      (index) => buildProductDoc(index, categoryIds),
      (docs) => productModel.insertMany(docs, { ordered: false }),
      "products"
    );

    const buyers = await userModel.find({ role: 0 }, "_id").lean();
    const productCatalog = await productModel.find({}, "_id price").lean();

    if (buyers.length === 0) {
      throw new Error("No users available for order seeding");
    }

    if (productCatalog.length === 0) {
      throw new Error("No products available for order seeding");
    }

    await seedOrders(
      config.orders,
      buyers.map((item) => item._id),
      productCatalog
    );

    const summary = {
      categories: await categoryModel.countDocuments({}),
      admins: await userModel.countDocuments({ role: 1 }),
      users: await userModel.countDocuments({ role: 0 }),
      products: await productModel.countDocuments({}),
      orders: await orderModel.countDocuments({}),
      maxDistinctProductsPerOrder: config.maxDistinctProductsPerOrder,
      maxQuantityPerProduct: config.maxQuantityPerProduct,
    };

    const reportsDir = path.join(process.cwd(), "k6", "reports");
    mkdirSync(reportsDir, { recursive: true });
    writeFileSync(
      path.join(reportsDir, "seed-summary.json"),
      JSON.stringify(summary, null, 2)
    );

    console.log("[seed] completed", JSON.stringify(summary, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("[seed] failed", error);
  process.exit(1);
});
