import fs from "node:fs";
import { join } from "node:path";
import braintree from "braintree";
import { MongoMemoryServer } from "mongodb-memory-server";
import slugify from "slugify";
import connectDB from "../config/db.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import { cleanupAndSeedDb, disconnectDb } from "../test/utils.js";
import {
  braintreePaymentController,
  braintreeTokenController,
  createProductController,
  deleteProductController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  relatedProductController,
  searchProductController,
  updateProductController,
} from "./productController.js";

// Helper Functions
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("Product Controller Integration Tests", () => {
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
      // created by express-formidable
      fields: {},
      // created by express-formidable
      files: {},
      params: {},
    };

    // Setup response mock with chained methods
    res = makeRes();

    // Seed the database with initial data before each test
    await cleanupAndSeedDb();
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
      // Electronics category ID
      category: "66db427fdb0119d9234b27ed",
      quantity: 1,
      shipping: "true",
    };

    const validPhotoFile = {
      photo: {
        size: 500000,
        path: join(process.cwd(), "/test/img/red.jpg"),
        type: "image/jpeg",
      },
    };

    describe("Request Validation - Missing Required Fields", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when name is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: undefined };

        // Act
        await createProductController(req, res);

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
        req.fields = { ...validProductFields, name: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Name is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when description is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Description is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when description is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Description is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when price is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Price is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when price is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: 0 };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Price is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when category is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Category is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when category is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Category is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when quantity is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Quantity is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when quantity is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: 0 };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Quantity is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when shipping is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: undefined };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Shipping is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when shipping is empty string", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: "" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Shipping is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when shipping is not a valid boolean string", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: "invalid" };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Shipping must be a true or false string",
        });
      });
    });

    describe("Request Validation - Photo Size", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when photo size exceeds 1mb", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {
          photo: {
            ...validPhotoFile.photo,
            size: 1000001,
          },
        };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Photo should be less than 1mb",
        });
      });

      // Li Jiakai, A0252287Y
      it("should allow photo exactly at 1mb limit", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {
          photo: {
            ...validPhotoFile.photo,
            size: 1000000,
          },
        };

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe("Successful Creation", () => {
      // Li Jiakai, A0252287Y
      it("should create product successfully without photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = {};

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        // Check response content
        const response = res.send.mock.calls[0][0];
        const { success, message, products } = response;
        expect(success).toBe(true);
        expect(message).toBe("Product created successfully");

        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(products._id).toBeDefined();
        expect(products.slug).toBe(slugify(req.fields.name));

        // Database persistence check
        const productInDb = await productModel.findOne({
          name: req.fields.name,
        });
        expect(productInDb).not.toBeNull();
        expect(productInDb._id).toStrictEqual(products._id);
        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(productInDb.slug).toBe(slugify(req.fields.name));
      });

      // Li Jiakai, A0252287Y
      it("should create product successfully with valid photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.files = validPhotoFile;

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        // Check response content
        const response = res.send.mock.calls[0][0];
        const { success, message, products } = response;
        expect(success).toBe(true);
        expect(message).toBe("Product created successfully");

        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(products._id).toBeDefined();
        expect(products.slug).toBe(slugify(req.fields.name));

        const photo = products.photo;
        expect(photo).toBeDefined();
        expect(photo.contentType).toBe(validPhotoFile.photo.type);
        expect(Buffer.from(photo.data).toString("base64")).toBe(
          fs.readFileSync(validPhotoFile.photo.path).toString("base64"),
        );

        // Database persistence check
        const productInDb = await productModel.findOne({
          name: req.fields.name,
        });
        expect(productInDb).not.toBeNull();
        expect(productInDb._id).toStrictEqual(products._id);
        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(productInDb.slug).toBe(slugify(req.fields.name));
      });

      // Li Jiakai, A0252287Y
      it("should create product with name containing special characters", async () => {
        // Arrange
        const productName = "NUS 120 T-Shirt";
        req.fields = { ...validProductFields, name: productName };
        req.files = {};

        // Act
        await createProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        // Check response content
        const response = res.send.mock.calls[0][0];
        const { success, message, products } = response;
        expect(success).toBe(true);
        expect(message).toBe("Product created successfully");

        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(products._id).toBeDefined();
        expect(products.slug).toBe(slugify(req.fields.name));

        // Database persistence check
        const productInDb = await productModel.findOne({
          name: req.fields.name,
        });
        expect(productInDb).not.toBeNull();
        expect(productInDb._id).toStrictEqual(products._id);
        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(productInDb.slug).toBe(slugify(req.fields.name));
      });
    });
  });

  // ==========================================
  // deleteProductController Tests
  // ==========================================
  describe("deleteProductController", () => {
    describe("Successful Deletion", () => {
      // Li Jiakai, A0252287Y
      it("should delete product successfully with valid pid", async () => {
        // Arrange
        const productId = "66db427fdb0119d9234b27f1"; // Valid product ID from seed data
        req.params = { pid: productId };

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product deleted successfully",
        });

        // Database deletion check
        const deletedProduct = await productModel.findById(productId);
        expect(deletedProduct).toBeNull();
      });

      // Li Jiakai, A0252287Y
      it("should return success even when product does not exist", async () => {
        // Arrange
        const productId = "000000000000000000000000"; // Non-existent product ID
        req.params = { pid: productId };

        // Act
        await deleteProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Product deleted successfully",
        });
      });
    });
  });

  // ==========================================
  // updateProductController Tests
  // ==========================================
  describe("updateProductController", () => {
    const validProductId = "66db427fdb0119d9234b27f3"; // Valid product ID (Laptop) from seed data
    const validProductFields = {
      name: "Updated Product",
      description: "An updated product description",
      price: 123.45,
      // Electronics category ID
      category: "66db427fdb0119d9234b27ed",
      quantity: 20,
      shipping: "false",
    };
    const validPhotoFile = {
      photo: {
        size: 500000,
        path: join(process.cwd(), "/test/img/red.jpg"),
        type: "image/jpeg",
      },
    };

    describe("Request Validation - Missing Required Fields", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when name is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, name: undefined };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

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
        req.fields = { ...validProductFields, name: "" };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Name is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when description is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: undefined };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Description is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when description is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, description: "" };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Description is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when price is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: undefined };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Price is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when price is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, price: 0 };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Price is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when category is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: undefined };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Category is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when category is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, category: "" };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Category is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when quantity is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: undefined };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Quantity is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when quantity is zero", async () => {
        // Arrange
        req.fields = { ...validProductFields, quantity: 0 };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Quantity is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when shipping is not provided", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: undefined };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Shipping is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when shipping is empty", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: "" };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Shipping is required",
        });
      });

      // Li Jiakai, A0252287Y
      it("should return 400 when shipping is not a valid boolean string", async () => {
        // Arrange
        req.fields = { ...validProductFields, shipping: "invalid" };
        req.params = { pid: validProductId };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Shipping must be a true or false string",
        });
      });
    });

    describe("Request Validation - Photo Size", () => {
      // Li Jiakai, A0252287Y
      it("should return 400 when photo size exceeds 1mb", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: validProductId };
        req.files = {
          photo: {
            ...validPhotoFile.photo,
            size: 1000001,
          },
        };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Photo should be less than 1mb",
        });
      });

      // Li Jiakai, A0252287Y
      it("should allow photo exactly at 1mb limit during update", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: validProductId };
        req.files = {
          photo: { ...validPhotoFile.photo, size: 1000000 },
        };

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
      });
    });

    describe("Successful Update", () => {
      // Li Jiakai, A0252287Y
      it("should update product successfully without photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: validProductId };
        req.files = {};

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        const response = res.send.mock.calls[0][0];
        const { success, message, products } = response;
        expect(success).toBe(true);
        expect(message).toBe("Product Updated Successfully");

        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(products._id).toBeDefined();
        expect(products.slug).toBe(slugify(req.fields.name));

        // Database persistence check
        const productInDb = await productModel.findOne({
          name: req.fields.name,
        });
        expect(productInDb).not.toBeNull();
        expect(productInDb._id).toStrictEqual(products._id);
        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(productInDb.slug).toBe(slugify(req.fields.name));
      });

      // Li Jiakai, A0252287Y
      it("should update product successfully with new photo", async () => {
        // Arrange
        req.fields = { ...validProductFields };
        req.params = { pid: validProductId };
        req.files = validPhotoFile;

        // Act
        await updateProductController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);

        const response = res.send.mock.calls[0][0];
        const { success, message, products } = response;
        expect(success).toBe(true);
        expect(message).toBe("Product Updated Successfully");

        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(products._id).toBeDefined();
        expect(products.slug).toBe(slugify(req.fields.name));

        const photo = products.photo;
        expect(photo).toBeDefined();
        expect(photo.contentType).toBe(validPhotoFile.photo.type);
        expect(Buffer.from(photo.data).toString("base64")).toBe(
          fs.readFileSync(validPhotoFile.photo.path).toString("base64"),
        );

        // Database persistence check
        const productInDb = await productModel.findOne({
          name: req.fields.name,
        });
        expect(productInDb).not.toBeNull();
        expect(productInDb._id).toStrictEqual(products._id);
        Object.entries(req.fields).forEach(([key, value]) => {
          expect(`${products[key]}`).toEqual(`${value}`);
        });
        expect(productInDb.slug).toBe(slugify(req.fields.name));
      });
    });
  });

  describe("Test getProductController", () => {
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
        countTotal: 2,
        message: "All Products",
        products: fakeProducts,
      });
    });

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
        message: "Error in getting products",
        error: err,
      });
    });
  });

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
        message: "Error while getting single product",
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

      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(fakePhotoData);
    });

    test("does not send a response when photo data is absent", async () => {
      // Arrange
      req.params = { pid: "product123" };

      const fakeProduct = {
        photo: { data: null, contentType: "image/jpeg" },
      };

      const query = {
        select: jest.fn().mockResolvedValue(fakeProduct),
      };

      productModel.findById.mockReturnValue(query);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
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
        message: "Error while getting photo",
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
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["cat1", "cat2"],
      });
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

    test("returns 500 on error", async () => {
      // Arrange
      req.body = { checked: ["cat1"], radio: [1, 2] };

      const err = new Error("DB blew up");
      productModel.find.mockRejectedValue(err);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
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

    test("returns 500 on error", async () => {
      // Arrange
      const err = new Error("DB blew up");

      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
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

    test("returns 500 on error", async () => {
      // Arrange
      req.params = { page: "2" };

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page ctrl",
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

    test("returns 500 on error", async () => {
      // Arrange
      req.params = { keyword: "iphone" };

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product API",
        error: err,
      });
    });
  });

  describe("Test relatedProductController", () => {
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
      await relatedProductController(req, res);

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

    test("returns 500 on error", async () => {
      // Arrange
      req.params = { pid: "p1", cid: "c1" };

      const err = new Error("DB blew up");
      productModel.find.mockImplementation(() => {
        throw err;
      });

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting related product",
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
      expect(productModel.find).toHaveBeenCalledWith({
        category: fakeCategory,
      });
      expect(query.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: fakeCategory,
        products: fakeProducts,
      });
    });

    test("returns 500 on error (category lookup fails)", async () => {
      // Arrange
      req.params = { slug: "phones" };

      const err = new Error("DB blew up");
      categoryModel.findOne.mockRejectedValue(err);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: err,
        message: "Error While Getting products",
      });
    });

    test("returns 500 on error (product lookup fails)", async () => {
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
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: err,
        message: "Error While Getting products",
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
      // Rayyan Ismail, A0259275R
      it("should generate token successfully", async () => {
        // Arrange
        gateway.clientToken.generate.mockImplementationOnce(
          (options, callback) => {
            callback(null, { clientToken: "fake-client-token" });
          },
        );

        // Act
        await braintreeTokenController(req, res);

        // Assert
        expect(gateway.clientToken.generate).toHaveBeenCalledWith(
          {},
          expect.any(Function),
        );
        expect(res.send).toHaveBeenCalledWith({
          clientToken: "fake-client-token",
        });
      });
    });

    describe("Error Handling", () => {
      // Rayyan Ismail, A0259275R
      it("should return 500 when token generation fails", async () => {
        // Arrange
        const generationError = new Error("Token generation failed");
        gateway.clientToken.generate.mockImplementationOnce(
          (options, callback) => {
            callback(generationError, null);
          },
        );

        // Act
        await braintreeTokenController(req, res);

        // Assert
        expect(gateway.clientToken.generate).toHaveBeenCalledWith(
          {},
          expect.any(Function),
        );
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith(generationError);
      });
      it("should log errors to console", async () => {
        // Arrange
        const gatewayError = new Error("Gateway crashed");
        gateway.clientToken.generate.mockImplementationOnce(() => {
          throw gatewayError;
        });

        // Act
        await braintreeTokenController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(gatewayError);
      });
    });
  });

  // ==========================================
  // braintreePaymentController Tests
  // ==========================================
  describe("braintreePaymentController", () => {
    let gateway;

    beforeEach(() => {
      // Get the actual gateway instance the controller is using
      gateway = new braintree.BraintreeGateway();
    });

    describe("Successful Payment Processing", () => {
      // Rayyan Ismail, A0259275R
      it("should process payment successfully", async () => {
        // Arrange
        req.body = {
          nonce: "fake-nonce",
          cart: [{ price: 10.0 }, { price: 15.5 }],
        };
        req.user = { _id: "user123" };
        gateway.transaction.sale.mockImplementationOnce(
          (saleRequest, callback) => {
            callback(null, {
              success: true,
              transaction: { id: "fake-transaction-id" },
            });
          },
        );

        // Act
        await braintreePaymentController(req, res);

        // Assert
        expect(gateway.transaction.sale).toHaveBeenCalledWith(
          {
            amount: 25.5,
            paymentMethodNonce: "fake-nonce",
            options: { submitForSettlement: true },
          },
          expect.any(Function),
        );
        expect(orderModel).toHaveBeenCalledWith({
          products: req.body.cart,
          payment: {
            success: true,
            transaction: { id: "fake-transaction-id" },
          },
          buyer: "user123",
        });
        expect(res.json).toHaveBeenCalledWith({ ok: true });
      });
      // Rayyan Ismail, A0259275R
      it("should process payment successfully with empty cart as a total of 0", async () => {
        // Arrange
        req.body = {
          nonce: "fake-nonce",
          cart: [],
        };
        req.user = { _id: "user123" };
        gateway.transaction.sale.mockImplementationOnce(
          (saleRequest, callback) => {
            callback(null, {
              success: true,
              transaction: { id: "fake-transaction-id" },
            });
          },
        );

        // Act
        await braintreePaymentController(req, res);

        // Assert
        expect(gateway.transaction.sale).toHaveBeenCalledWith(
          {
            amount: 0,
            paymentMethodNonce: "fake-nonce",
            options: { submitForSettlement: true },
          },
          expect.any(Function),
        );
        expect(orderModel).toHaveBeenCalledWith({
          products: req.body.cart,
          payment: {
            success: true,
            transaction: { id: "fake-transaction-id" },
          },
          buyer: "user123",
        });
        expect(res.json).toHaveBeenCalledWith({ ok: true });
      });
      // Rayyan Ismail, A0259275R
      it("should process payment successfully with cart items having zero price", async () => {
        // Arrange
        req.body = {
          nonce: "fake-nonce",
          cart: [{ price: 0 }, { price: 0 }],
        };
        req.user = { _id: "user123" };
        gateway.transaction.sale.mockImplementationOnce(
          (saleRequest, callback) => {
            callback(null, {
              success: true,
              transaction: { id: "fake-transaction-id" },
            });
          },
        );

        // Act
        await braintreePaymentController(req, res);

        // Assert
        expect(gateway.transaction.sale).toHaveBeenCalledWith(
          {
            amount: 0,
            paymentMethodNonce: "fake-nonce",
            options: { submitForSettlement: true },
          },
          expect.any(Function),
        );
        expect(orderModel).toHaveBeenCalledWith({
          products: req.body.cart,
          payment: {
            success: true,
            transaction: { id: "fake-transaction-id" },
          },
          buyer: "user123",
        });
        expect(res.json).toHaveBeenCalledWith({ ok: true });
      });
      // Rayyan Ismail, A0259275R
      it("should process payment successfully with cart items having negative price", async () => {
        // Arrange
        req.body = {
          nonce: "fake-nonce",
          cart: [{ price: -5.0 }, { price: 10.0 }],
        };
        req.user = { _id: "user123" };
        gateway.transaction.sale.mockImplementationOnce(
          (saleRequest, callback) => {
            callback(null, {
              success: true,
              transaction: { id: "fake-transaction-id" },
            });
          },
        );

        // Act
        await braintreePaymentController(req, res);

        // Assert
        expect(gateway.transaction.sale).toHaveBeenCalledWith(
          {
            amount: 5.0,
            paymentMethodNonce: "fake-nonce",
            options: { submitForSettlement: true },
          },
          expect.any(Function),
        );
        expect(orderModel).toHaveBeenCalledWith({
          products: req.body.cart,
          payment: {
            success: true,
            transaction: { id: "fake-transaction-id" },
          },
          buyer: "user123",
        });
        expect(res.json).toHaveBeenCalledWith({ ok: true });
      });
    });
    describe("Error Handling", () => {
      // Rayyan Ismail, A0259275R
      it("should return 500 when payment processing fails", async () => {
        // Arrange
        req.body = {
          nonce: "fake-nonce",
          cart: [{ price: 10.0 }],
        };
        req.user = { _id: "user123" };
        gateway.transaction.sale.mockImplementationOnce(
          (saleRequest, callback) => {
            callback(new Error("Payment processing failed"), null);
          },
        );

        // Act
        await braintreePaymentController(req, res);

        // Assert
        expect(orderModel).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(500);
      });
    });
    // Rayyan Ismail, A0259275R
    it("should log error when payment processing fails", async () => {
      // Arrange
      req.body = {
        nonce: "fake-nonce",
        cart: [{ _id: "p1", name: "Item 1", price: 10 }],
      };
      req.user = { _id: "user123" };
      const gatewayError = new Error("Gateway crashed");
      gateway.transaction.sale.mockImplementationOnce(() => {
        throw gatewayError;
      });

      // Act
      await braintreePaymentController(req, res);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(gatewayError);
    });
  });
});
