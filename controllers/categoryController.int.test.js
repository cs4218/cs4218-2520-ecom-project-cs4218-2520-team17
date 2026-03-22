import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../config/db.js";
import categoryModel from "../models/categoryModel.js";
import {
  cleanupAndSeedDb,
  createLowercaseSlug,
  disconnectDb,
} from "../test/utils.js";
import {
  categoryControlller,
  createCategoryController,
  deleteCategoryController,
  singleCategoryController,
  updateCategoryController,
} from "./categoryController.js";

describe("Category Controller Integration Tests", () => {
  let req;
  let res;
  let consoleLogSpy;
  let mongod;

  // Start a single in-memory MongoDB instance for the whole test
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
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log to suppress output and allow assertions
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Setup default request object
    req = {
      body: {},
      params: {},
    };

    // Setup response mock with chained methods
    res = {
      // Set status code
      status: jest.fn().mockReturnThis(),
      // Send response
      send: jest.fn().mockReturnThis(),
    };

    // Seed the database with initial data before each test
    await cleanupAndSeedDb();
  });

  afterEach(async () => {
    consoleLogSpy.mockRestore();
  });

  // ==========================================
  // createCategoryController Tests
  // ==========================================
  describe("createCategoryController", () => {
    describe("Request Validation", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when name is not provided", async () => {
        // Arrange
        req.body = {};

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Name is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when name is empty string", async () => {
        // Arrange
        req.body = { name: "" };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Name is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when name is null", async () => {
        // Arrange
        req.body = { name: null };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Name is required",
        });
      });
    });

    describe("Duplicate Category Check", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when category already exists", async () => {
        // Arrange
        req.body = { name: "Electronics" };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Category already exists",
        });
      });
    });

    describe("Successful Creation", () => {
      // Li Jiakai, A0252287Y
      it("should create category successfully with valid name", async () => {
        // Arrange
        const categoryName = "Computers";
        const expectedSlug = createLowercaseSlug(categoryName);
        req.body = { name: categoryName };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.message).toBe("New category created");

        const responseCategory = response.category;
        expect(responseCategory).toHaveProperty("_id");
        expect(responseCategory.name).toBe(categoryName);
        expect(responseCategory.slug).toBe(expectedSlug);

        // Verify creation in DB
        const createdCategory = await categoryModel.findOne({
          name: categoryName,
        });
        expect(createdCategory).not.toBeNull();
        expect(createdCategory._id).toStrictEqual(responseCategory._id);
        expect(createdCategory.name).toBe(categoryName);
        expect(createdCategory.slug).toBe(expectedSlug);
      });

      // Li Jiakai, A0252287Y
      it("should create category with name containing spaces", async () => {
        // Arrange
        const categoryName = "Home Appliances";
        const expectedSlug = createLowercaseSlug(categoryName);
        req.body = { name: categoryName };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.message).toBe("New category created");

        const responseCategory = response.category;
        expect(responseCategory).toHaveProperty("_id");
        expect(responseCategory.name).toBe(categoryName);
        expect(responseCategory.slug).toBe(expectedSlug);

        // Verify creation in DB
        const createdCategory = await categoryModel.findOne({
          name: categoryName,
        });
        expect(createdCategory).not.toBeNull();
        expect(createdCategory._id).toStrictEqual(responseCategory._id);
        expect(createdCategory.name).toBe(categoryName);
        expect(createdCategory.slug).toBe(expectedSlug);
      });
    });
  });

  // ==========================================
  // updateCategoryController Tests
  // ==========================================
  describe("updateCategoryController", () => {
    describe("Successful Update", () => {
      // Li Jiakai, A0252287Y
      it("should update category successfully with valid id and name", async () => {
        // Arrange
        const newCategoryName = "Updated Electronics";
        const expectedSlug = createLowercaseSlug(newCategoryName);
        // Get from seed data
        const categoryId = "66db427fdb0119d9234b27ed";

        req.body = { name: newCategoryName };
        req.params = { id: categoryId };

        // Act
        await updateCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);

        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.message).toBe("Category updated successfully");

        const responseCategory = response.category;
        expect(responseCategory.id).toBe(categoryId);
        expect(responseCategory.name).toBe(newCategoryName);
        expect(responseCategory.slug).toBe(expectedSlug);

        // Verify creation in DB
        const createdCategory = await categoryModel.findOne({
          name: newCategoryName,
        });
        expect(createdCategory).not.toBeNull();
        expect(createdCategory._id).toStrictEqual(responseCategory._id);
        expect(createdCategory.name).toBe(newCategoryName);
        expect(createdCategory.slug).toBe(expectedSlug);
      });

      // Li Jiakai, A0252287Y
      it("should update category successfully when database returns null", async () => {
        // Arrange
        const newCategoryName = "Not Exist Category";
        const categoryId = "000000000000000000000000";

        req.body = { name: newCategoryName };
        req.params = { id: categoryId };

        // Act
        await updateCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);

        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.message).toBe("Category updated successfully");
        expect(response.category).toBeNull();

        // Verify category not created in DB
        const createdCategory = await categoryModel.findOne({
          name: newCategoryName,
        });
        expect(createdCategory).toBeNull();
      });

      describe("Duplicate Category Check", () => {
        // Li Jiakai, A0252287Y
        it("should return 400 when category name already exists", async () => {
          // Arrange
          const newCategoryName = "Electronics";
          // Get from seed data - ID for Book
          const categoryId = "66db427fdb0119d9234b27ef";

          req.body = { name: newCategoryName };
          req.params = { id: categoryId };

          // Act
          await updateCategoryController(req, res);

          // Assert
          expect(res.status).toHaveBeenCalledWith(400);
          const response = res.send.mock.calls[0][0];
          expect(response.success).toBe(false);
          expect(response.message).toBe("Category already exists");
        });
      });
    });
  });

  // ==========================================
  // categoryController Tests
  // ==========================================
  describe("categoryControlller", () => {
    describe("Integration Tests", () => {
      // Rayyan Ismail, A0259275R
      it("should retrieve all seeded categories from the database", async () => {
        // Act
        await categoryControlller(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.message).toBe("All Categories List");
        expect(response.category).toHaveLength(3);

        const categoryNames = response.category.map((c) => c.name).sort();
        expect(categoryNames).toEqual(["Book", "Clothing", "Electronics"]);
      });

      // Rayyan Ismail, A0259275R
      it("should return categories with correct slugs", async () => {
        // Act
        await categoryControlller(req, res);

        // Assert
        const response = res.send.mock.calls[0][0];
        const categories = response.category;

        const electronics = categories.find((c) => c.name === "Electronics");
        expect(electronics.slug).toBe("electronics");

        const book = categories.find((c) => c.name === "Book");
        expect(book.slug).toBe("book");

        const clothing = categories.find((c) => c.name === "Clothing");
        expect(clothing.slug).toBe("clothing");
      });

      // Rayyan Ismail, A0259275R
      it("should return empty array when no categories exist", async () => {
        // Arrange
        await categoryModel.deleteMany({});

        // Act
        await categoryControlller(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.category).toEqual([]);
      });

      // Rayyan Ismail, A0259275R
      it("should include newly created categories in results", async () => {
        // Arrange
        await new categoryModel({ name: "Sports", slug: "sports" }).save();

        // Act
        await categoryControlller(req, res);

        // Assert
        const response = res.send.mock.calls[0][0];
        expect(response.category).toHaveLength(4);
        const categoryNames = response.category.map((c) => c.name).sort();
        expect(categoryNames).toEqual([
          "Book",
          "Clothing",
          "Electronics",
          "Sports",
        ]);
      });
    });
  });

  // ==========================================
  // singleCategoryController Tests
  // ==========================================
  describe("singleCategoryController", () => {
    describe("Integration Tests", () => {
      // Rayyan Ismail, A0259275R
      it("should retrieve a single category by slug from the database", async () => {
        // Arrange
        req.params = { slug: "electronics" };

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.message).toBe("Get single category successfully");
        expect(response.category.name).toBe("Electronics");
        expect(response.category.slug).toBe("electronics");
      });

      // Rayyan Ismail, A0259275R
      it("should retrieve the Book category by slug", async () => {
        // Arrange
        req.params = { slug: "book" };

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.category.name).toBe("Book");
        expect(response.category.slug).toBe("book");
      });

      // Rayyan Ismail, A0259275R
      it("should return null category for a non-existent slug", async () => {
        // Arrange
        req.params = { slug: "nonexistent" };

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.success).toBe(true);
        expect(response.category).toBeNull();
      });

      // Rayyan Ismail, A0259275R
      it("should return the correct category after it has been updated", async () => {
        // Arrange
        await categoryModel.findOneAndUpdate(
          { slug: "electronics" },
          { name: "Gadgets", slug: "gadgets" },
        );
        req.params = { slug: "gadgets" };

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.category.name).toBe("Gadgets");
        expect(response.category.slug).toBe("gadgets");
      });

      // Rayyan Ismail, A0259275R
      it("should not find a category after it has been deleted", async () => {
        // Arrange
        await categoryModel.deleteOne({ slug: "electronics" });
        req.params = { slug: "electronics" };

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        const response = res.send.mock.calls[0][0];
        expect(response.category).toBeNull();
      });
    });
  });

  // ==========================================
  // deleteCategoryController Tests
  // ==========================================
  describe("deleteCategoryController", () => {
    // Li Jiakai, A0252287Y
    it("should delete category successfully with valid id", async () => {
      // Arrange
      const categoryId = "66db427fdb0119d9234b27ed";
      req.params = { id: categoryId };

      // Act
      await deleteCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Category deleted successfully",
      });

      // Verify deletion in DB
      const deletedCategory = await categoryModel.findById(categoryId);
      expect(deletedCategory).toBeNull();
    });
  });

  // Li Jiakai, A0252287Y
  it("should delete category successfully with invalid id", async () => {
    // Arrange
    const categoryId = "000000000000000000000000";
    req.params = { id: categoryId };

    // Act
    await deleteCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Category deleted successfully",
    });

    // Verify deletion in DB
    const deletedCategory = await categoryModel.findById(categoryId);
    expect(deletedCategory).toBeNull();
  });
});
