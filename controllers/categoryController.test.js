import {
  createCategoryController,
  updateCategoryController,
  categoryControlller,
  singleCategoryController,
  deleteCategoryController,
} from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import { describe } from "node:test";

// Mock dependencies
jest.mock("../models/categoryModel.js");
jest.mock("slugify");

describe("Category Controller", () => {
  let req;
  let res;
  let consoleLogSpy;

  beforeEach(() => {
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

    // Default slugify mock behavior
    slugify.mockImplementation((text) => text.toLowerCase().replace(/\s+/g, "-"));
  });

  afterEach(() => {
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
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when name is empty string", async () => {
        // Arrange
        req.body = { name: "" };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when name is null", async () => {
        // Arrange
        req.body = { name: null };

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });
    });

    describe("Duplicate Category Check", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when category already exists", async () => {
        // Arrange
        req.body = { name: "Electronics" };
        const existingCategory = { _id: "123", name: "Electronics", slug: "electronics" };
        categoryModel.findOne.mockResolvedValue(existingCategory);

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
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
        req.body = { name: "Electronics" };
        const savedCategory = { _id: "123", name: "Electronics", slug: "electronics" };

        categoryModel.findOne.mockResolvedValue(null);
        const saveMock = jest.fn().mockResolvedValue(savedCategory);
        categoryModel.mockImplementation(() => ({
          save: saveMock,
        }));

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
        expect(slugify).toHaveBeenCalledWith("Electronics");
        expect(categoryModel).toHaveBeenCalledWith({
          name: "Electronics",
          slug: "electronics",
        });
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "New category created",
          category: savedCategory,
        });
      });

      // Li Jiakai, A0252287Y
      it("should create category with name containing spaces", async () => {
        // Arrange
        req.body = { name: "Home Appliances" };
        const savedCategory = { _id: "456", name: "Home Appliances", slug: "home-appliances" };

        categoryModel.findOne.mockResolvedValue(null);
        const saveMock = jest.fn().mockResolvedValue(savedCategory);
        categoryModel.mockImplementation(() => ({
          save: saveMock,
        }));

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(slugify).toHaveBeenCalledWith("Home Appliances");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "New category created",
          category: savedCategory,
        });
      });
    });

    describe("Error Handling", () => {
      // Li Jiakai, A0252287Y
      it("should return 500 and log error when findOne throws", async () => {
        // Arrange
        req.body = { name: "Electronics" };
        const dbError = new Error("Database connection failed");
        categoryModel.findOne.mockRejectedValue(dbError);

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error in category",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 500 and log error when save throws", async () => {
        // Arrange
        req.body = { name: "Electronics" };
        const saveError = new Error("Save operation failed");

        categoryModel.findOne.mockResolvedValue(null);
        categoryModel.mockImplementation(() => ({
          save: jest.fn().mockRejectedValue(saveError),
        }));

        // Act
        await createCategoryController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(saveError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: saveError,
          message: "Error in category",
        });
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
        req.body = { name: "Updated Electronics" };
        req.params = { id: "123" };
        const updatedCategory = { _id: "123", name: "Updated Electronics", slug: "updated-electronics" };

        categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

        // Act
        await updateCategoryController(req, res);

        // Assert
        expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "123",
          { name: "Updated Electronics", slug: "updated-electronics" },
          { new: true }
        );
        expect(slugify).toHaveBeenCalledWith("Updated Electronics");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Category updated successfully",
          category: updatedCategory,
        });
      });

      // Li Jiakai, A0252287Y
      it("should update category successfully when database returns null", async () => {
        // Arrange
        req.body = { name: "Updated Electronics" };
        req.params = { id: "123" };
        const updatedCategory = null;

        categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

        // Act
        await updateCategoryController(req, res);

        // Assert
        expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "123",
          { name: "Updated Electronics", slug: "updated-electronics" },
          { new: true }
        );
        expect(slugify).toHaveBeenCalledWith("Updated Electronics");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Category updated successfully",
          category: null,
        });
      });
    });

    describe("Error Handling", () => {
      // Li Jiakai, A0252287Y
      it("should return 500 and log error when database update fails", async () => {
        // Arrange
        req.body = { name: "Electronics" };
        req.params = { id: "cat123" };
        const dbError = new Error("Database update failed");

        categoryModel.findByIdAndUpdate.mockRejectedValue(dbError);

        // Act
        await updateCategoryController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error while updating category",
        });
      });
    });
  });

  // ==========================================
  // categoryController Tests
  // ==========================================
  describe("categoryControlller", () => {
    describe("Successful Retrieval", () => {
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
      })
    });
  });

  // ==========================================
  // singleCategoryController Tests
  // ==========================================
  describe("singleCategoryController", () => {
    describe("Successful Retrieval", () => {
      it("should retrieve single category successfully with valid slug", async () => {
        // Arrange
        req.params = { slug: "electronics" };
        const mockCategory = { name: "Electronics", slug: "electronics" };
        categoryModel.findOne.mockResolvedValue(mockCategory);

        // Act
        await singleCategoryController(req, res);

        // Assert
        expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "electronics" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Get single category successfully",
          category: mockCategory,
        });
      });
    });

    describe("Error Handling", () => {
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
        categoryModel.findByIdAndDelete.mockResolvedValue({ _id: "123", name: "Electronics" });

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
