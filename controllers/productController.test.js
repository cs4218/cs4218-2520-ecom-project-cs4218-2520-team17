// Mock braintree before importing productController (must be first)
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn().mockImplementation(() => ({
    clientToken: {
      generate: jest.fn(),
    },
    transaction: {
      sale: jest.fn(),
    },
  })),
  Environment: {
    Sandbox: "sandbox",
  },
}));

import {
  createProductController,
  deleteProductController,
  updateProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
} from "./productController.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";



// Mock dependencies
jest.mock("../models/productModel.js");
jest.mock("fs");
jest.mock("slugify");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");

// Helper Functions
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res); 
  res.json = jest.fn().mockReturnValue(res); 
  return res;
};

describe("Product Controller", () => {
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
      // created by express-formidable
      fields: {},
      // created by express-formidable
      files: {},
      params: {},
    };

    // Setup response mock with chained methods
    res = makeRes()

    // Default slugify mock behavior
    slugify.mockImplementation((text) => text.toLowerCase().replace(/\s+/g, "-"));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // ==========================================
  // createProductController Tests
  // ==========================================
  describe("createProductController", () => {
    // These fields are extracted from req.fields
    const validProductFields = {
      name: "Test Product",
      description: "A test product description",
      price: 12.34,
      category: "123",
      quantity: 1,
      // Frontend uses "1" for true, "0" for false
      shipping: "1"
    };

    describe("Request Validation - Missing Required Fields", () => {
      it("should return 400 when name is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });

      it("should return 400 when name is empty string", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });

      it("should return 400 when description is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Description is required" });
      });

      it("should return 400 when description is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Description is required" });
      });

      it("should return 400 when price is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Price is required" });
      });

      it("should return 400 when price is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: 0 };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Price is required" });
      });

      it("should return 400 when category is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Category is required" });
      });

      it("should return 400 when category is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Category is required" });
      });

      it("should return 400 when quantity is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Quantity is required" });
      });

      it("should return 400 when quantity is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: 0 };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Quantity is required" });
      });

      it("should return 400 when shipping is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Shipping is required" });
      });

      it("should return 400 when shipping is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Shipping is required" });
      });
    });

    describe("Request Validation - Photo Size", () => {
      it("should return 400 when photo size exceeds 1mb", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {
          photo: { size: 1000001, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Photo should be less than 1mb" });
      });

      it("should allow photo exactly at 1mb limit", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {
          photo: { size: 1000000, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        const mockProduct = {
          ...validProductFields,
          slug: "test-product",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockReturnValue(Buffer.from("fake image data"));

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe("Successful Creation", () => {
      it("should create product successfully without photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {};

        const mockProduct = {
          ...validProductFields,
          slug: "test-product",
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.mockImplementation(() => mockProduct);

        // Act
        await createProductController(req, res);

        // Assert
        expect(slugify).toHaveBeenCalledWith("Test Product");
        expect(productModel).toHaveBeenCalledWith({
          ...validProductFields,
          slug: "test-product",
        });
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product created successfully",
          products: mockProduct,
        });
      });

      it("should create product successfully with valid photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {
          photo: { size: 500000, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        const photoBuffer = Buffer.from("fake image data");
        fs.readFileSync.mockReturnValue(photoBuffer);

        const mockProduct = {
          ...validProductFields,
          slug: "test-product",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };
        productModel.mockImplementation(() => mockProduct);

        // Act
        await createProductController(req, res);

        // Assert
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/photo.jpg");
        expect(mockProduct.photo.data).toEqual(photoBuffer);
        expect(mockProduct.photo.contentType).toBe("image/jpeg");
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product created successfully",
          products: mockProduct,
        });
      });

      it("should create product with name containing special characters", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: "NUS 120 T-Shirt" };
        req.files = {};

        slugify.mockReturnValue("nus-120-t-shirt");

        const mockProduct = {
          ...validProductFields,
          name: "NUS 120 T-Shirt",
          slug: "nus-120-t-shirt",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.mockImplementation(() => mockProduct);

        // Act
        await createProductController(req, res);

        // Assert
        expect(slugify).toHaveBeenCalledWith("NUS 120 T-Shirt");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product created successfully",
          products: mockProduct,
        });
      });
    });

    describe("Error Handling", () => {
      it("should return 500 and log error when save throws", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {};

        const saveError = new Error("Database save failed");
        const mockProduct = {
          ...validProductFields,
          slug: "test-product",
          photo: {},
          save: jest.fn().mockRejectedValue(saveError),
        };

        productModel.mockImplementation(() => mockProduct);

        // Act
        await createProductController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(saveError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: saveError,
          message: "Error while creating product",
        });
      });

      it("should return 500 and log error when fs.readFileSync throws", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {
          photo: { size: 500000, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        const fsError = new Error("File read failed");
        const mockProduct = {
          ...validProductFields,
          slug: "test-product",
          photo: {},
          save: jest.fn(),
        };

        productModel.mockImplementation(() => mockProduct);
        fs.readFileSync.mockImplementation(() => {
          throw fsError;
        });

        // Act
        await createProductController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(fsError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: fsError,
          message: "Error while creating product",
        });
      });
    });
  });

  // ==========================================
  // deleteProductController Tests
  // ==========================================
  describe("deleteProductController", () => {
    describe("Successful Deletion", () => {
      it("should delete product successfully with valid pid", async () => {
        // Arrange
        req.params = { pid: "123" };

        const mockQuery = {
          select: jest.fn().mockResolvedValue({ _id: "123", name: "Test Product" }),
        };
        productModel.findByIdAndDelete.mockReturnValue(mockQuery);

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("123");
        expect(mockQuery.select).toHaveBeenCalledWith("-photo");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product deleted successfully",
        });
      });

      it("should return success even when product does not exist", async () => {
        // Arrange
        req.params = { pid: "invalidId123" };

        const mockQuery = {
          select: jest.fn().mockResolvedValue(null),
        };
        productModel.findByIdAndDelete.mockReturnValue(mockQuery);

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("invalidId123");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product deleted successfully",
        });
      });
    });

    describe("Error Handling", () => {
      it("should return 500 and log error when database deletion fails", async () => {
        // Arrange
        req.params = { pid: "123" };
        const dbError = new Error("Database deletion failed");

        const mockQuery = {
          select: jest.fn().mockRejectedValue(dbError),
        };
        productModel.findByIdAndDelete.mockReturnValue(mockQuery);

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error while deleting product",
          error: dbError,
        });
      });
    });
  });

  // ==========================================
  // updateProductController Tests
  // ==========================================
  describe("updateProductController", () => {
    const validProductFields = {
      name: "Updated Product",
      description: "An updated product description",
      price: 123.45,
      category: "456",
      quantity: 20,
      shipping: "0",
    };

    describe("Request Validation - Missing Required Fields", () => {
      it("should return 400 when name is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: undefined };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });

      it("should return 400 when name is empty string", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: "" };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is required" });
      });

      it("should return 400 when description is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: undefined };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Description is required" });
      });

      it("should return 400 when description is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: "" };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Description is required" });
      });

      it("should return 400 when price is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: undefined };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Price is required" });
      });

      it("should return 400 when price is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: 0 };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Price is required" });
      });

      it("should return 400 when category is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: undefined };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Category is required" });
      });

      it("should return 400 when category is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: "" };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Category is required" });
      });

      it("should return 400 when quantity is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: undefined };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Quantity is required" });
      });

      it("should return 400 when quantity is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: 0 };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Quantity is required" });
      });

      it("should return 400 when shipping is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: undefined };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Shipping is required" });
      });

      it("should return 400 when shipping is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: "" };
        req.params = { pid: "456" };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Shipping is required" });
      });
    });

    describe("Request Validation - Photo Size", () => {
      it("should return 400 when photo size exceeds 1mb", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {
          photo: { size: 1000001, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Photo should be less than 1mb" });
      });

      it("should allow photo exactly at 1mb limit during update", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {
          photo: { size: 1000000, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        const mockProduct = {
          ...validProductFields,
          slug: "updated-product",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);
        fs.readFileSync.mockReturnValue(Buffer.from("fake image data"));

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe("Successful Update", () => {
      it("should update product successfully without photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {};

        const mockProduct = {
          ...validProductFields,
          _id: "456",
          slug: "updated-product",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(slugify).toHaveBeenCalledWith("Updated Product");
        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "456",
          { ...validProductFields, slug: "updated-product" },
          { new: true }
        );
        expect(mockProduct.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product Updated Successfully",
          products: mockProduct,
        });
      });

      it("should update product successfully with new photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {
          photo: { size: 500000, path: "/tmp/newphoto.jpg", type: "image/png" },
        };

        const photoBuffer = Buffer.from("new fake image data");
        fs.readFileSync.mockReturnValue(photoBuffer);

        const mockProduct = {
          ...validProductFields,
          _id: "456",
          slug: "updated-product",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/newphoto.jpg");
        expect(mockProduct.photo.data).toEqual(photoBuffer);
        expect(mockProduct.photo.contentType).toBe("image/png");
        expect(mockProduct.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product Updated Successfully",
          products: mockProduct,
        });
      });

      it("should update product with different slug transformation", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: "New & Improved Product v2!" };
        req.params = { pid: "456" };
        req.files = {};

        slugify.mockReturnValue("new-improved-product-v2");

        const mockProduct = {
          ...validProductFields,
          _id: "456",
          name: "New & Improved Product v2!",
          slug: "new-improved-product-v2",
          photo: {},
          save: jest.fn().mockResolvedValue(true),
        };

        productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(slugify).toHaveBeenCalledWith("New & Improved Product v2!");
        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "456",
          expect.objectContaining({ slug: "new-improved-product-v2" }),
          { new: true }
        );
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe("Error Handling", () => {
      it("should return 500 and log error when findByIdAndUpdate throws", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {};

        const dbError = new Error("Database update failed");
        productModel.findByIdAndUpdate.mockRejectedValue(dbError);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: dbError,
          message: "Error while updating product",
        });
      });

      it("should return 500 and log error when save throws after update", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {};

        const saveError = new Error("Save after update failed");
        const mockProduct = {
          ...validProductFields,
          _id: "456",
          slug: "updated-product",
          photo: {},
          save: jest.fn().mockRejectedValue(saveError),
        };

        productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);

        // Act
        await updateProductController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(saveError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: saveError,
          message: "Error while updating product",
        });
      });

      it("should return 500 and log error when fs.readFileSync throws during update", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: "456" };
        req.files = {
          photo: { size: 500000, path: "/tmp/photo.jpg", type: "image/jpeg" },
        };

        const fsError = new Error("File read failed during update");
        const mockProduct = {
          ...validProductFields,
          _id: "456",
          slug: "updated-product",
          photo: {},
          save: jest.fn(),
        };

        productModel.findByIdAndUpdate.mockResolvedValue(mockProduct);
        fs.readFileSync.mockImplementation(() => {
          throw fsError;
        });

        // Act
        await updateProductController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(fsError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          error: fsError,
          message: "Error while updating product",
        });
      });
    });
  });

  describe(("Test getProductController"), () => {
    test("return 200 with products", async () => {
      // Arrange
      const req = {};
      const res = makeRes();

      const fakeProducts = [
        { _id: "1", name: "A" },
        { _id: "2", name: "B" },
      ];

      const query = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(fakeProducts), // final awaited value
      };

      // Act
      productModel.find.mockReturnValue(query);
      await getProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(query.populate).toHaveBeenCalledWith("category");
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.limit).toHaveBeenCalledWith(12);
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        counTotal: 2,
        message: "ALlProducts ",
        products: fakeProducts,
      });
    })

    test("returns 500 on error", async () => {
      // Arrange
      const req = {};
      const res = makeRes();

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err; // error happens inside try block
      });

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Erorr in getting products",
        error: "DB blew up",
      });

    });
  })

  describe("Test getSingleProductController", () => {
    test("returns 200 with single product", async () => {
      // Arrange
      req.params = { slug: "iphone-15" };

      const fakeProduct = { _id: "p1", name: "iPhone 15", slug: "iphone-15" };

      const query = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(fakeProduct), // last call awaited
      };

      productModel.findOne.mockReturnValue(query);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "iphone-15" });
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: fakeProduct,
      });
    });

    test("returns 500 on error", async () => {
      // Arrange
      req.params = { slug: "iphone-15" };

      const err = new Error("DB blew up");
      productModel.findOne.mockImplementation(() => {
        throw err;
      });

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Eror while getitng single product",
        error: err, // your controller sends the full error object (not error.message)
      });
    });
  });

  describe("Test productPhotoController", () => {
    test("returns 200 and photo data", async () => {
      // Arrange
      req.params = { pid: "product123" };

      const fakePhotoData = Buffer.from("fake-image-bytes");

      const fakeProduct = {
        photo: {
          data: fakePhotoData,
          contentType: "image/jpeg",
        },
      };

      const query = {
        select: jest.fn().mockResolvedValue(fakeProduct),
      };

      productModel.findById.mockReturnValue(query);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith("product123");
      expect(query.select).toHaveBeenCalledWith("photo");

      expect(res.set).toHaveBeenCalledWith(
        "Content-type",
        "image/jpeg"
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(fakePhotoData);
    });

    test("returns 500 on error", async () => {
      // Arrange
      req.params = { pid: "product123" };

      const err = new Error("DB blew up");
      productModel.findById.mockImplementation(() => {
        throw err;
      });

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Erorr while getting photo",
        error: err,
      });
    });
  });

  describe("Test productFiltersController", () => {
    test("filters by category only", async () => {
      // Arrange
      req.body = { checked: ["cat1", "cat2"], radio: [] };

      const fakeProducts = [{ _id: "1" }, { _id: "2" }];
      productModel.find.mockResolvedValue(fakeProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({ category: ["cat1", "cat2"] });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("filters by price only", async () => {
      // Arrange
      req.body = { checked: [], radio: [10, 50] };

      const fakeProducts = [{ _id: "1" }];
      productModel.find.mockResolvedValue(fakeProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 10, $lte: 50 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("filters by category + price", async () => {
      // Arrange
      req.body = { checked: ["cat1"], radio: [100, 200] };

      const fakeProducts = [{ _id: "x" }];
      productModel.find.mockResolvedValue(fakeProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1"],
        price: { $gte: 100, $lte: 200 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("no filters -> empty args {}", async () => {
      // Arrange
      req.body = { checked: [], radio: [] };

      const fakeProducts = [{ _id: "1" }];
      productModel.find.mockResolvedValue(fakeProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("returns 400 on error", async () => {
      // Arrange
      req.body = { checked: ["cat1"], radio: [1, 2] };

      const err = new Error("DB blew up");
      productModel.find.mockRejectedValue(err);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error WHile Filtering Products",
        error: err,
      });
    });
  });

  describe("Test productCountController", () => {
    test("returns 200 with product count", async () => {
      // Arrange
      const fakeCount = 42;

      const query = {
        estimatedDocumentCount: jest.fn().mockResolvedValue(fakeCount),
      };

      productModel.find.mockReturnValue(query);

      // Act
      await productCountController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(query.estimatedDocumentCount).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: fakeCount,
      });
    });

    test("returns 400 on error", async () => {
      // Arrange
      const err = new Error("DB blew up");

      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Error in product count",
        error: err,
        success: false,
      });
    });
  });

  describe("Test productListController", () => {
    test("returns 200 with products for page 1 (default)", async () => {
      // Arrange
      req.params = {}; // no page -> default 1

      const fakeProducts = [{ _id: "1" }, { _id: "2" }];

      const query = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(fakeProducts), // awaited final result
      };

      productModel.find.mockReturnValue(query);

      // Act
      await productListController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.skip).toHaveBeenCalledWith(0); // (1 - 1) * 6
      expect(query.limit).toHaveBeenCalledWith(6);
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("returns 200 with products for page 3", async () => {
      // Arrange
      req.params = { page: "3" }; // note: params are strings in Express

      const fakeProducts = [{ _id: "x" }];

      const query = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(fakeProducts),
      };

      productModel.find.mockReturnValue(query);

      // Act
      await productListController(req, res);

      // Assert
      expect(query.skip).toHaveBeenCalledWith(12); // (3 - 1) * 6 = 12
      expect(query.limit).toHaveBeenCalledWith(6);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("returns 400 on error", async () => {
      // Arrange
      req.params = { page: "2" };

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error in per page ctrl",
        error: err,
      });
    });
  });

  describe("Test searchProductController", () => {
    test("returns products matching keyword", async () => {
      // Arrange
      req.params = { keyword: "iphone" };

      const fakeProducts = [
        { _id: "1", name: "iPhone 15" },
        { _id: "2", name: "iPhone Case" },
      ];

      const query = {
        select: jest.fn().mockResolvedValue(fakeProducts),
      };

      productModel.find.mockReturnValue(query);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "iphone", $options: "i" } },
          { description: { $regex: "iphone", $options: "i" } },
        ],
      });

      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(res.json).toHaveBeenCalledWith(fakeProducts);
    });

    test("returns 400 on error", async () => {
      // Arrange
      req.params = { keyword: "iphone" };

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product API",
        error: err,
      });
    });
  });

  describe("Test realtedProductController", () => {
    test("returns 200 with related products", async () => {
      // Arrange
      req.params = { pid: "p1", cid: "c1" };

      const fakeProducts = [
        { _id: "p2", name: "Related A" },
        { _id: "p3", name: "Related B" },
      ];

      const query = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(fakeProducts), // last awaited call
      };

      productModel.find.mockReturnValue(query);

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: "c1",
        _id: { $ne: "p1" },
      });

      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.limit).toHaveBeenCalledWith(3);
      expect(query.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: fakeProducts,
      });
    });

    test("returns 400 on error", async () => {
      // Arrange
      req.params = { pid: "p1", cid: "c1" };

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while geting related product",
        error: err,
      });
    });
  });

  describe("Test productCategoryController", () => {
    test("returns 200 with category + products", async () => {
      // Arrange
      req.params = { slug: "phones" };

      const fakeCategory = { _id: "c1", name: "Phones", slug: "phones" };
      const fakeProducts = [{ _id: "p1" }, { _id: "p2" }];

      categoryModel.findOne.mockResolvedValue(fakeCategory);

      const query = {
        populate: jest.fn().mockResolvedValue(fakeProducts), // last awaited call
      };
      productModel.find.mockReturnValue(query);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "phones" });
      expect(productModel.find).toHaveBeenCalledWith({ category: fakeCategory });
      expect(query.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: fakeCategory,
        products: fakeProducts,
      });
    });

    test("returns 400 on error (category lookup fails)", async () => {
      // Arrange
      req.params = { slug: "phones" };

      const err = new Error("DB blew up");
      categoryModel.findOne.mockRejectedValue(err);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: err,
        message: "Error While Getting products",
      });
    });

    test("returns 400 on error (product lookup fails)", async () => {
      // Arrange
      req.params = { slug: "phones" };

      const fakeCategory = { _id: "c1", name: "Phones", slug: "phones" };
      categoryModel.findOne.mockResolvedValue(fakeCategory);

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: err,
        message: "Error While Getting products",
      });
    });
  });






});
