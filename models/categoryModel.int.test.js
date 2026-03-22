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
      // Arrange
      const categoryData = { name: "Sports", slug: "sports" };

      // Act
      const category = await Category.create(categoryData);

      // Assert
      expect(category._id).toBeDefined();
      expect(category.name).toBe("Sports");
      expect(category.slug).toBe("sports");
    });

    // Rayyan Ismail, A0259275R
    it("should convert slug to lowercase", async () => {
      // Arrange
      const categoryData = { name: "Home Appliances", slug: "Home-Appliances" };

      // Act
      const category = await Category.create(categoryData);

      // Assert
      expect(category.slug).toBe("home-appliances");
    });

    // Rayyan Ismail, A0259275R
    it("should allow creating a category without a name", async () => {
      // name required is commented out in schema
      // Arrange
      const categoryData = { slug: "no-name" };

      // Act
      const category = await Category.create(categoryData);

      // Assert
      expect(category._id).toBeDefined();
      expect(category.name).toBeUndefined();
      expect(category.slug).toBe("no-name");
    });

    // Rayyan Ismail, A0259275R
    it("should allow creating a category without a slug", async () => {
      // Arrange
      const categoryData = { name: "NoSlug" };

      // Act
      const category = await Category.create(categoryData);

      // Assert
      expect(category._id).toBeDefined();
      expect(category.name).toBe("NoSlug");
      expect(category.slug).toBeUndefined();
    });

    // Rayyan Ismail, A0259275R
    it("should allow duplicate category names", async () => {
      // unique is commented out in schema
      // Arrange
      // (no additional setup; seeded data does not conflict with "Duplicate")

      // Act
      const first = await Category.create({
        name: "Duplicate",
        slug: "duplicate-1",
      });
      const second = await Category.create({
        name: "Duplicate",
        slug: "duplicate-2",
      });

      // Assert
      expect(first.name).toBe("Duplicate");
      expect(second.name).toBe("Duplicate");
      expect(first._id).not.toEqual(second._id);
    });
  });

  describe("Database Persistence", () => {
    // Rayyan Ismail, A0259275R
    it("should save and retrieve a category by id", async () => {
      // Arrange
      const created = await Category.create({
        name: "Furniture",
        slug: "furniture",
      });

      // Act
      const found = await Category.findById(created._id);

      // Assert
      expect(found).not.toBeNull();
      expect(found.name).toBe("Furniture");
      expect(found.slug).toBe("furniture");
    });

    // Rayyan Ismail, A0259275R
    it("should find a category by slug", async () => {
      // Arrange
      // "electronics" category exists from seeded data

      // Act
      const found = await Category.findOne({ slug: "electronics" });

      // Assert
      expect(found).not.toBeNull();
      expect(found.name).toBe("Electronics");
    });

    // Rayyan Ismail, A0259275R
    it("should return null for a non-existent slug", async () => {
      // Arrange
      // no category with slug "nonexistent" exists in seeded data

      // Act
      const found = await Category.findOne({ slug: "nonexistent" });

      // Assert
      expect(found).toBeNull();
    });

    // Rayyan Ismail, A0259275R
    it("should update a category name", async () => {
      // Arrange
      const category = await Category.findOne({ slug: "electronics" });
      category.name = "Gadgets";

      // Act
      await category.save();

      // Assert
      const updated = await Category.findById(category._id);
      expect(updated.name).toBe("Gadgets");
    });

    // Rayyan Ismail, A0259275R
    it("should delete a category", async () => {
      // Arrange
      const category = await Category.findOne({ slug: "electronics" });

      // Act
      await Category.findByIdAndDelete(category._id);

      // Assert
      const deleted = await Category.findById(category._id);
      expect(deleted).toBeNull();
    });

    // Rayyan Ismail, A0259275R
    it("should retrieve all seeded categories", async () => {
      // Arrange
      // 3 categories exist from seeded data

      // Act
      const categories = await Category.find({});

      // Assert
      expect(categories).toHaveLength(3);
      const names = categories.map((c) => c.name).sort();
      expect(names).toEqual(["Book", "Clothing", "Electronics"]);
    });
  });
});
