import { readFileSync } from "fs";
import { join } from "path";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import slugify from "slugify";
import mongoose from "mongoose";


// Load Seed Data for MongoDB
const seedCategories = JSON.parse(
  readFileSync(join(process.cwd(), "mongo/seed/test.categories.json"), "utf-8")
).map(transformDoc);
const seedUsers = JSON.parse(
  readFileSync(join(process.cwd(), "mongo/seed/test.users.json"), "utf-8")
).map(transformDoc);
const seedProducts = JSON.parse(
  readFileSync(join(process.cwd(), "mongo/seed/test.products.json"), "utf-8")
).map(transformDoc);
const seedOrders = JSON.parse(
  readFileSync(join(process.cwd(), "mongo/seed/test.orders.json"), "utf-8")
).map(transformDoc);


/**
 * Transforms MongoDB special JSON types to native JS types for insertion.
 */
function transformDoc(doc) {
  if (doc === null || doc === undefined) return doc;
  if (Array.isArray(doc)) return doc.map(transformDoc);
  if (typeof doc !== "object") return doc;
  if ("$oid" in doc) return mongoose.Types.ObjectId.createFromHexString(doc.$oid);
  if ("$date" in doc) return new Date(doc.$date);
  if ("$binary" in doc) return Buffer.from(doc.$binary.base64, "base64");
  const result = {};
  for (const [key, value] of Object.entries(doc)) {
    result[key] = transformDoc(value);
  }
  return result;
}


/**
 * Converts a string to a lowercase slug like in MongoDB.
 */
export function createLowercaseSlug(text) {
  return slugify(text).toLowerCase();
}


/**
 * Cleans up the mongodb database and seeds it with initial data for testing.
 * Used for integration tests to ensure a consistent database state before each test suite runs.
 */
export async function cleanupAndSeedDb() {
  await Promise.all([
    categoryModel.deleteMany({}),
    userModel.deleteMany({}),
    productModel.deleteMany({}),
    orderModel.deleteMany({}),
  ]);

  await Promise.all([
    categoryModel.insertMany(seedCategories),
    userModel.insertMany(seedUsers),
    productModel.insertMany(seedProducts),
    orderModel.insertMany(seedOrders),
  ]);
}


/**
 * Disconnect from the MongoDB database.
 * Used after all tests have completed to cleanly close the connection.
 */
export async function disconnectDb() {
  await mongoose.disconnect();
}
