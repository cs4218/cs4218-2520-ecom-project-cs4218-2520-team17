import { MongoMemoryServer } from "mongodb-memory-server";
import { cleanupAndSeedDb, disconnectDb } from "../test/utils.js";
import Category from "./categoryModel.js";
import connectDB from "../config/db.js";

describe("Category Model Integration Tests", () => {
  let mongod;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongod.getUri();
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDb();
    await mongod.stop();
  });

  beforeEach(async () => {
    await cleanupAndSeedDb();
  });

  describe("Schema Validation", () => {
    // Rayyan Ismail, A0259275R
    it("should create a category with name and slug", async () => {
      const category = await Category.create({
        name: "Sports",
        slug: "sports",
      });

      expect(category._id).toBeDefined();
      expect(category.name).toBe("Sports");
      expect(category.slug).toBe("sports");
    });

    // Rayyan Ismail, A0259275R
    it("should convert slug to lowercase", async () => {
      const category = await Category.create({
        name: "Home Appliances",
        slug: "Home-Appliances",
      });

      expect(category.slug).toBe("home-appliances");
    });

    // Rayyan Ismail, A0259275R
    it("should allow creating a category without a name", async () => {
      // name required is commented out in schema
      const category = await Category.create({ slug: "no-name" });

      expect(category._id).toBeDefined();
      expect(category.name).toBeUndefined();
      expect(category.slug).toBe("no-name");
    });

    // Rayyan Ismail, A0259275R
    it("should allow creating a category without a slug", async () => {
      const category = await Category.create({ name: "NoSlug" });

      expect(category._id).toBeDefined();
      expect(category.name).toBe("NoSlug");
      expect(category.slug).toBeUndefined();
    });

    // Rayyan Ismail, A0259275R
    it("should allow duplicate category names", async () => {
      // unique is commented out in schema
      const first = await Category.create({
        name: "Duplicate",
        slug: "duplicate-1",
      });
      const second = await Category.create({
        name: "Duplicate",
        slug: "duplicate-2",
      });

      expect(first.name).toBe("Duplicate");
      expect(second.name).toBe("Duplicate");
      expect(first._id).not.toEqual(second._id);
    });
  });

  describe("Database Persistence", () => {
    // Rayyan Ismail, A0259275R
    it("should save and retrieve a category by id", async () => {
      const created = await Category.create({
        name: "Furniture",
        slug: "furniture",
      });

      const found = await Category.findById(created._id);

      expect(found).not.toBeNull();
      expect(found.name).toBe("Furniture");
      expect(found.slug).toBe("furniture");
    });

    // Rayyan Ismail, A0259275R
    it("should find a category by slug", async () => {
      const found = await Category.findOne({ slug: "electronics" });

      expect(found).not.toBeNull();
      expect(found.name).toBe("Electronics");
    });

    // Rayyan Ismail, A0259275R
    it("should return null for a non-existent slug", async () => {
      const found = await Category.findOne({ slug: "nonexistent" });

      expect(found).toBeNull();
    });

    // Rayyan Ismail, A0259275R
    it("should update a category name", async () => {
      const category = await Category.findOne({ slug: "electronics" });
      category.name = "Gadgets";
      await category.save();

      const updated = await Category.findById(category._id);
      expect(updated.name).toBe("Gadgets");
    });

    // Rayyan Ismail, A0259275R
    it("should delete a category", async () => {
      const category = await Category.findOne({ slug: "electronics" });
      await Category.findByIdAndDelete(category._id);

      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    // Rayyan Ismail, A0259275R
    it("should retrieve all seeded categories", async () => {
      const categories = await Category.find({});

      expect(categories).toHaveLength(3);
      const names = categories.map((c) => c.name).sort();
      expect(names).toEqual(["Book", "Clothing", "Electronics"]);
    });
  });
});
