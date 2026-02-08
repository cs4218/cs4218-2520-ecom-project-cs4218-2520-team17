// Mock braintree before importing productController (must be first)
jest.mock("braintree", () => {
  const mockGenerate = jest.fn();
  const mockSale = jest.fn();
  return {
    BraintreeGateway: jest.fn().mockReturnValue({
      clientToken: { generate: mockGenerate },
      transaction: { sale: mockSale },
    }),
    Environment: { Sandbox: "sandbox" },
  };
});

import {
  createProductController,
  deleteProductController,
  updateProductController,
  braintreeTokenController,
  braintreePaymentController,
} from "./productController.js";
import productModel from "../models/productModel.js";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";

// Mock dependencies
jest.mock("../models/productModel.js");
jest.mock("fs");
jest.mock("slugify");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");

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
  
  // ==========================================
  // braintreeTokenController Tests
  // ==========================================
  describe("braintreeTokenController", () => {
    let gateway;

    beforeEach(() => {
      // Get the actual gateway instance the controller is using
      gateway = new braintree.BraintreeGateway();
    });

    describe("Successful Token Generation", () => {
      it("should generate token successfully", async () => {
        // Arrange
        gateway.clientToken.generate.mockImplementationOnce((options, callback) => {
          callback(null, { clientToken: "fake-client-token" });
        });

        // Act
        await braintreeTokenController(req, res);

        // Assert
        expect(gateway.clientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
        expect(res.send).toHaveBeenCalledWith({ clientToken: "fake-client-token" });
      });
    });

    describe("Error Handling", () => {
      it("should return 500 when token generation fails", async () => {
        // Arrange
        const generationError = new Error("Token generation failed");
        gateway.clientToken.generate.mockImplementationOnce((options, callback) => {
          callback(generationError, null);
        });

        // Act
        await braintreeTokenController(req, res);

        // Assert
        expect(gateway.clientToken.generate).toHaveBeenCalledWith({}, expect.any(Function));
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(generationError);
      });
    });
  });

  // ==========================================
  // braintreePaymentController Tests
  // ==========================================
  describe("braintreePaymentController", () => {
    
  });
});
