
import { describe } from "node:test";
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController
} from "./productController.js";
import productModel from "../models/productModel.js";



// Mock Dependencies
jest.mock("../models/productModel.js");


// Functions
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res); 
  return res;
};

describe('Test Product Controller', () => {
  let req;
  let res;
  let consoleLogSpy;
  beforeEach(() => {

    jest.clearAllMocks()

    // SILENT CONSOLE
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    req = {}
    res = makeRes()
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  })

  // ==========================================
  // getProductController Tests
  // ==========================================
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





})