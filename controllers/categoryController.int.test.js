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

describe("Category Controller", () => {
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
        console.warn("Expected Slug:", expectedSlug);
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
    });
  });

  // ==========================================
  // categoryController Tests
  // ==========================================
  describe("categoryControlller", () => {
    describe("Successful Retrieval", () => {
      // Rayyan Ismail, A0259275R
      it("should retrieve all categories successfully with status 200", async () => {
        // Arrange
        const mockCategories = [
          { name: "Electronics", slug: "electronics" },
          { name: "Books", slug: "books" },
        ];
        categoryModel.find.mockResolvedValue(mockCategories);
        // Act
        await categoryControlller(req, res);

        // Assert
        expect(categoryModel.find).toHaveBeenCalledWith({});
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "All Categories List",
          category: mockCategories,
        });
      });
    });

    describe("Error Handling", () => {
      // Rayyan Ismail, A0259275R
      it("should return status 500 when database retrieval fails", async () => {
        // Arrange
        const dbError = new Error("Database retrieval failed");
        categoryModel.find.mockRejectedValue(dbError);

        // Act
        await categoryControlller(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error while getting all categories",
        });
      });
    });
  });

  // ==========================================
  // singleCategoryController Tests
  // ==========================================
  describe("singleCategoryController", () => {
    describe("Successful Retrieval", () => {
      // Rayyan Ismail, A0259275R
      it("should retrieve single category successfully with valid slug", async () => {
        // Arrange
        req.params = { slug: "electronics" };
        const mockCategory = { name: "Electronics", slug: "electronics" };
        categoryModel.findOne.mockResolvedValue(mockCategory);

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(categoryModel.findOne).toHaveBeenCalledWith({
          slug: "electronics",
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Get single category successfully",
          category: mockCategory,
        });
      });
    });

    describe("Error Handling", () => {
      // Rayyan Ismail, A0259275R
      it("should return 500 and log error when database retrieval fails", async () => {
        // Arrange
        req.params = { slug: "electronics" };
        const dbError = new Error("Database retrieval failed");
        categoryModel.findOne.mockRejectedValue(dbError);

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error while getting single category",
        });
      });
    });
  });

  // ==========================================
  // deleteCategoryController Tests
  // ==========================================
  describe("deleteCategoryController", () => {
    describe("Successful Deletion", () => {
      // Li Jiakai, A0252287Y
      it("should delete category successfully with valid id", async () => {
        // Arrange
        req.params = { id: "123" };
        categoryModel.findByIdAndDelete.mockResolvedValue({
          _id: "123",
          name: "Electronics",
        });

        // Act
        await deleteCategoryController(req, res);

        // Assert
        expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Category deleted successfully",
        });
      });
    });

    describe("Error Handling", () => {
      // Li Jiakai, A0252287Y
      it("should return 500 and log error when database deletion fails", async () => {
        // Arrange
        req.params = { id: "123" };
        const dbError = new Error("Database deletion failed");

        categoryModel.findByIdAndDelete.mockRejectedValue(dbError);

        // Act
        await deleteCategoryController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error while deleting category",
          error: dbError,
        });
      });
    });
  });
});
