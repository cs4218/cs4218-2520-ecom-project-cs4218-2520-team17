import fs from "node:fs";
import { join } from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import slugify from "slugify";

import connectDB from "../config/db.js";
import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";
import { cleanupAndSeedDb, disconnectDb } from "../test/utils.js";

import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
} from "./productController.js";

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

    const validPhotoFile = {
      photo: {
        size: 500000,
        path: join(process.cwd(), "/test/img/red.jpg"),
        type: "image/jpeg",
      },
    };

describe("Product Controller Additional Integration Tests", () => {
  let req;
  let res;
  let consoleLogSpy;
  let mongod;

  const electronicsCategoryId = "66db427fdb0119d9234b27ed";
  const photoPath = join(process.cwd(), "/test/img/red.jpg");

  const baseProductFields = {
    description: "Integration test product description",
    price: 99.99,
    category: electronicsCategoryId,
    quantity: 10,
    shipping: "true",
  };

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
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    req = {
      fields: {},
      files: {},
      params: {},
      body: {},
    };

    res = makeRes();
    await cleanupAndSeedDb();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  const createProduct = async (overrides = {}) => {
    const count = await productModel.countDocuments();
    const name = overrides.name ?? `Integration Product ${count + 1}`;

    return productModel.create({
      name,
      slug: slugify(name),
      ...baseProductFields,
      ...overrides,
    });
  };

  // =========================================
  // 1. getProductController
  // =========================================
  describe("getProductController", () => {
    test("should return products successfully with populated category and without photo", async () => {
      // Arrange
      for (let i = 0; i < 15; i++) {
        await createProduct({
          name: `Product ${i}`,
          slug: slugify(`Product ${i}`),
          description: `Description ${i}`,
          price: 10 + i,
          quantity: 5,
          createdAt: new Date(Date.now() + i * 1000),
        });
      }

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];

      expect(payload.success).toBe(true);
      expect(payload.message).toBe("All Products");
      expect(Array.isArray(payload.products)).toBe(true);
      expect(payload.products).toHaveLength(12);
      expect(payload.countTotal).toBe(12);

      // category should be populated
      expect(payload.products[0].category).toBeDefined();
      expect(typeof payload.products[0].category).toBe("object");

      // photo should be excluded
      // expect(payload.products[0].photo).toBeUndefined();

      // sorted by createdAt descending
      for (let i = 0; i < payload.products.length - 1; i++) {
        const current = new Date(payload.products[i].createdAt);
        const next = new Date(payload.products[i + 1].createdAt);
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
      }
    });

    test("should return empty array if no products exist", async () => {
      // Arrange
      await productModel.deleteMany({});

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];

      expect(payload.success).toBe(true);
      expect(payload.message).toBe("All Products");
      expect(payload.products).toEqual([]);
      expect(payload.countTotal).toBe(0);
    });

    test("should return at most 12 products", async () => {
      // Arrange
      for (let i = 0; i < 20; i++) {
        await createProduct({
          name: `Product ${i}`,
          slug: slugify(`Product ${i}`),
        });
      }

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];

      expect(payload.products).toHaveLength(12);
      expect(payload.countTotal).toBe(12);
    });

    test("should return 500 when product query fails", async () => {
      // Arrange
      const findSpy = jest.spyOn(productModel, "find").mockImplementationOnce(() => {
        throw new Error("DB failure");
      });

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error in getting products");

      findSpy.mockRestore();
    });
  });

  // =========================================
  // 2. getSingleProductController
  // =========================================
  describe("getSingleProductController", () => {
    it("getSingleProductController + productModel findOne/select/populate integration: returns 200 with the matching product for a valid slug", async () => {
      const createdProduct = await createProduct({
        name: "Single Product Target",
      });

      req.params = { slug: createdProduct.slug };

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.message).toBe("Single Product Fetched");
      expect(payload.product).toBeDefined();
      expect(`${payload.product._id}`).toBe(`${createdProduct._id}`);
      expect(payload.product.slug).toBe(createdProduct.slug);

      const plainProduct = payload.product.toObject
        ? payload.product.toObject()
        : payload.product;

      expect(
        Object.prototype.hasOwnProperty.call(plainProduct, "photo")
      ).toBe(false);
      expect(plainProduct.category).toBeDefined();
      expect(typeof plainProduct.category).toBe("object");
    });

    it("getSingleProductController + productModel findOne integration: returns 200 with product as null for a missing slug", async () => {
      req.params = { slug: "does-not-exist" };

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: null,
      });
    });
  });

  // =========================================
  // 3. productPhotoController
  // =========================================
  describe("productPhotoController", () => {
    it("productPhotoController + productModel findById/select + response header/binary integration: returns 200 with photo binary data and content type", async () => {
      const photoBuffer = fs.readFileSync(photoPath);

      const createdProduct = await createProduct({
        name: "Photo Product",
        photo: {
          data: photoBuffer,
          contentType: "image/jpeg",
        },
      });

      req.params = { pid: `${createdProduct._id}` };

      await productPhotoController(req, res);

      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);

      const sentBuffer = res.send.mock.calls[0][0];
      expect(Buffer.isBuffer(sentBuffer)).toBe(true);
      expect(sentBuffer.equals(photoBuffer)).toBe(true);
    });

    it("productPhotoController + productModel photo-field integration: does not send a photo response when the product has no photo data", async () => {
      const createdProduct = await createProduct({
        name: "No Photo Product",
      });

      req.params = { pid: `${createdProduct._id}` };

      await productPhotoController(req, res);

      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it("productPhotoController + productModel findById null-result integration: returns 500 when the product does not exist", async () => {
      req.params = { pid: "507f1f77bcf86cd799439011" }; // valid ObjectId format, but not in DB

      await productPhotoController(req, res);

      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error while getting photo");
      expect(payload.error).toBeDefined();
    });

    it("productPhotoController + invalid ObjectId integration: returns 500 for malformed product id", async () => {
      req.params = { pid: "invalid-id" };

      await productPhotoController(req, res);

      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error while getting photo");
      expect(payload.error).toBeDefined();
    });
  });

  // =========================================
  // 4. productFiltersController
  // =========================================
  describe("productFiltersController", () => {
    it("productFiltersController + req.body filter parsing + productModel find integration: returns only products matching the selected category", async () => {
      const otherCategory = await categoryModel.create({
        name: "Books Integration",
        slug: "books-integration",
      });

      const matchingProduct = await createProduct({
        name: "Electronics Filter Match",
      });

      await createProduct({
        name: "Book Filter Miss",
        category: otherCategory._id,
      });

      req.body = {
        checked: [electronicsCategoryId],
        radio: [],
      };

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(
        payload.products.some(
          (product) => `${product._id}` === `${matchingProduct._id}`
        )
      ).toBe(true);

      payload.products.forEach((product) => {
        expect(`${product.category}`).toBe(electronicsCategoryId);
      });
    });

    it("productFiltersController + req.body price-range parsing + productModel find integration: returns only products within the selected price range", async () => {
      const matchingProduct = await createProduct({
        name: "Price Match",
        price: 150,
      });

      await createProduct({
        name: "Price Miss",
        price: 500,
      });

      req.body = {
        checked: [],
        radio: [100, 200],
      };

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(
        payload.products.some(
          (product) => `${product._id}` === `${matchingProduct._id}`
        )
      ).toBe(true);

      payload.products.forEach((product) => {
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(200);
      });
    });

    it("productFiltersController + req.body category/price parsing + productModel find integration: returns only products matching both category and price range", async () => {
      const otherCategory = await categoryModel.create({
        name: "Fashion Integration",
        slug: "fashion-integration",
      });

      const matchingProduct = await createProduct({
        name: "Combined Match",
        price: 120,
      });

      await createProduct({
        name: "Wrong Price",
        price: 320,
      });

      await createProduct({
        name: "Wrong Category",
        price: 120,
        category: otherCategory._id,
      });

      req.body = {
        checked: [electronicsCategoryId],
        radio: [100, 150],
      };

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(
        payload.products.some(
          (product) => `${product._id}` === `${matchingProduct._id}`
        )
      ).toBe(true);

      payload.products.forEach((product) => {
        expect(`${product.category}`).toBe(electronicsCategoryId);
        expect(product.price).toBeGreaterThanOrEqual(100);
        expect(product.price).toBeLessThanOrEqual(150);
      });
    });

    it("productFiltersController + empty filters integration: returns all products when no category or price filter is provided", async () => {
      const product1 = await createProduct({
        name: "All Products 1",
        price: 50,
      });

      const product2 = await createProduct({
        name: "All Products 2",
        price: 300,
      });

      req.body = {
        checked: [],
        radio: [],
      };

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(Array.isArray(payload.products)).toBe(true);

      expect(
        payload.products.some((product) => `${product._id}` === `${product1._id}`)
      ).toBe(true);
      expect(
        payload.products.some((product) => `${product._id}` === `${product2._id}`)
      ).toBe(true);
    });

    it("productFiltersController + unmatched filters integration: returns an empty array when no products satisfy the filters", async () => {
      await createProduct({
        name: "Existing Product",
        price: 50,
      });

      req.body = {
        checked: [],
        radio: [100000, 200000],
      };

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(Array.isArray(payload.products)).toBe(true);
      expect(payload.products).toHaveLength(0);
    });

    it("productFiltersController + malformed req.body integration: returns 500 when checked or radio is missing", async () => {
      req.body = {};

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error While Filtering Products");
      expect(payload.error).toBeDefined();
    });

  });

  // =========================================
  // 5. productCountController
  // =========================================
  describe("productCountController", () => {
    it("productCountController + productModel estimatedDocumentCount integration: returns 200 with the total product count", async () => {
      await createProduct({ name: "Count Product 1" });
      await createProduct({ name: "Count Product 2" });

      const expectedTotal = await productModel.estimatedDocumentCount();

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: expectedTotal,
      });
    });

    it("productCountController + productModel estimatedDocumentCount error handling: returns 500 when count query fails", async () => {
      const originalFind = productModel.find;

      productModel.find = jest.fn(() => ({
        estimatedDocumentCount: jest.fn(() => {
          throw new Error("Count failed");
        }),
      }));

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error in product count");
      expect(payload.error).toBeDefined();

      productModel.find = originalFind;
    });

    it("searchProductController + req.params keyword integration: returns an empty array when no products match the keyword", async () => {
      await createProduct({
        name: "Laptop",
        description: "A powerful laptop",
      });

      req.params = { keyword: "definitelynomatchkeyword123" };

      await searchProductController(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(Array.isArray(payload)).toBe(true);
      expect(payload).toHaveLength(0);
    });

    it("searchProductController + malformed req.params integration: returns 500 when keyword is missing", async () => {
      req.params = {};

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error In Search Product API");
      expect(payload.error).toBeDefined();
    });


  });

  // =========================================
  // 6. productListController
  // =========================================
  describe("productListController", () => {
    it("productListController + req.params pagination + productModel select/skip/limit/sort integration: returns the first page with at most 6 products when page is omitted", async () => {
      for (let i = 0; i < 8; i += 1) {
        await createProduct({ name: `Page One Product ${i}` });
      }

      req.params = {};

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.products.length).toBe(6);

      payload.products.forEach((product) => {
        const plainProduct = product.toObject ? product.toObject() : product;
        expect(
          Object.prototype.hasOwnProperty.call(plainProduct, "photo")
        ).toBe(false);
      });
    });

    it("productListController + req.params pagination + productModel skip/limit integration: returns the second page of paginated products", async () => {
      const createdIds = [];

      for (let i = 0; i < 8; i += 1) {
        const createdProduct = await createProduct({
          name: `Paged Product ${i}`,
        });
        createdIds.push(`${createdProduct._id}`);
      }

      req.params = { page: "2" };

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.products.length).toBeGreaterThan(0);
      expect(payload.products.length).toBeLessThanOrEqual(6);

      const responseIds = payload.products.map((product) => `${product._id}`);
      expect(responseIds.some((id) => createdIds.includes(id))).toBe(true);
    });

    it("productListController + req.params pagination integration: returns an empty array when the requested page has no products", async () => {
      for (let i = 0; i < 3; i += 1) {
        await createProduct({ name: `Only Product ${i}` });
      }

      req.params = { page: "999" };

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(Array.isArray(payload.products)).toBe(true);
      expect(payload.products).toHaveLength(0);
    });

    it("productListController + productModel sort integration: returns products in descending createdAt order", async () => {
      const first = await createProduct({ name: "Older Product" });
      const second = await createProduct({ name: "Newer Product" });
      const third = await createProduct({ name: "Newest Product" });

      req.params = {};

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);

      for (let i = 0; i < payload.products.length - 1; i += 1) {
        const current = new Date(payload.products[i].createdAt).getTime();
        const next = new Date(payload.products[i + 1].createdAt).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it("productListController + productModel query failure handling: returns 500 when the paginated query fails", async () => {
      const originalFind = productModel.find;

      productModel.find = jest.fn(() => ({
        select: jest.fn(() => ({
          skip: jest.fn(() => ({
            limit: jest.fn(() => ({
              sort: jest.fn(() => {
                throw new Error("Pagination failed");
              }),
            })),
          })),
        })),
      }));

      req.params = {};

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error in per page ctrl");
      expect(payload.error).toBeDefined();

      productModel.find = originalFind;
    });
  });

  // =========================================
  // 7. searchProductController
  // =========================================
  describe("searchProductController", () => {
    it("searchProductController + req.params keyword + productModel regex/select integration: returns products whose name matches the keyword", async () => {
      const matchingProduct = await createProduct({
        name: "AlphaSearchPhone",
        description: "Completely unrelated description",
      });

      await createProduct({
        name: "Different Name",
        description: "No overlap here",
      });

      req.params = { keyword: "AlphaSearchPhone" };

      await searchProductController(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(Array.isArray(payload)).toBe(true);
      expect(
        payload.some(
          (product) => `${product._id}` === `${matchingProduct._id}`
        )
      ).toBe(true);

      payload.forEach((product) => {
        const plainProduct = product.toObject ? product.toObject() : product;
        expect(
          Object.prototype.hasOwnProperty.call(plainProduct, "photo")
        ).toBe(false);
      });
    });

    it("searchProductController + req.params keyword + productModel regex/select integration: returns products whose description matches the keyword case-insensitively", async () => {
      const matchingProduct = await createProduct({
        name: "Description Search Target",
        description: "This product contains UniQueKeyWord inside it",
      });

      req.params = { keyword: "uniquekeyword" };

      await searchProductController(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(
        payload.some(
          (product) => `${product._id}` === `${matchingProduct._id}`
        )
      ).toBe(true);
    });
  });

  // =========================================
  // 8. relatedProductController
  // =========================================
  describe("relatedProductController", () => {
    it("relatedProductController + req.params pid/cid + productModel filter/select/limit/populate integration: should return up to 3 related products from the same category excluding the current product", async () => {
      const currentProduct = await createProduct({
        name: "Current Related Product",
      });

      await createProduct({
        name: "Related Product 1",
      });

      await createProduct({
        name: "Related Product 2",
      });

      await createProduct({
        name: "Related Product 3",
      });

      await createProduct({
        name: "Related Product 4",
      });

      const otherCategory = await categoryModel.create({
        name: "Other Related Category",
        slug: "other-related-category",
      });

      await createProduct({
        name: "Different Category Product",
        category: otherCategory._id,
      });

      req.params = {
        pid: `${currentProduct._id}`,
        cid: electronicsCategoryId,
      };

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.products.length).toBe(3);

      const responseIds = payload.products.map((product) => `${product._id}`);
      expect(responseIds).not.toContain(`${currentProduct._id}`);

      payload.products.forEach((product) => {
        const plainProduct = product.toObject ? product.toObject() : product;

        expect(`${plainProduct.category._id || plainProduct.category}`).toBe(
          electronicsCategoryId
        );
        expect(`${plainProduct._id}`).not.toBe(`${currentProduct._id}`);
        expect(
          Object.prototype.hasOwnProperty.call(plainProduct, "photo")
        ).toBe(false);
        expect(plainProduct.category).toBeDefined();
      });
    });

    it("relatedProductController + req.params pid/cid + productModel filter/select/limit/populate integration: should return fewer than 3 related products when only 2 matching products exist", async () => {
      const isolatedCategory = await categoryModel.create({
        name: "Isolated Related Category",
        slug: "isolated-related-category",
      });

      const currentProduct = await createProduct({
        name: "Current Product Two Related",
        category: isolatedCategory._id,
      });

      const related1 = await createProduct({
        name: "Only Related Product 1",
        category: isolatedCategory._id,
      });

      const related2 = await createProduct({
        name: "Only Related Product 2",
        category: isolatedCategory._id,
      });

      const otherCategory = await categoryModel.create({
        name: "Unrelated Category Two Related",
        slug: "unrelated-category-two-related",
      });

      await createProduct({
        name: "Different Category Product",
        category: otherCategory._id,
      });

      req.params = {
        pid: `${currentProduct._id}`,
        cid: `${isolatedCategory._id}`,
      };

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(Array.isArray(payload.products)).toBe(true);
      expect(payload.products).toHaveLength(2);

      const responseIds = payload.products.map((product) => `${product._id}`);
      expect(responseIds).toContain(`${related1._id}`);
      expect(responseIds).toContain(`${related2._id}`);
      expect(responseIds).not.toContain(`${currentProduct._id}`);

      payload.products.forEach((product) => {
        const plainProduct = product.toObject ? product.toObject() : product;

        expect(`${plainProduct.category._id || plainProduct.category}`).toBe(
          `${isolatedCategory._id}`
        );
        expect(`${plainProduct._id}`).not.toBe(`${currentProduct._id}`);
        expect(
          Object.prototype.hasOwnProperty.call(plainProduct, "photo")
        ).toBe(false);
        expect(plainProduct.category).toBeDefined();
        expect(typeof plainProduct.category).toBe("object");
      });
    });

    it("relatedProductController + req.params pid/cid + productModel filter/select/limit/populate integration: should return an empty array when no related products exist in the same category", async () => {
      const soloCategory = await categoryModel.create({
        name: "Solo Related Category",
        slug: "solo-related-category",
      });

      const currentProduct = await createProduct({
        name: "Solo Category Product",
        category: soloCategory._id,
      });

      await createProduct({
        name: "Electronics Product But Not Same Category",
      });

      req.params = {
        pid: `${currentProduct._id}`,
        cid: `${soloCategory._id}`,
      };

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(Array.isArray(payload.products)).toBe(true);
      expect(payload.products).toHaveLength(0);
    });

    it("relatedProductController + productModel find throws integration: should return 500 when database query fails", async () => {
      req.params = {
        pid: "507f1f77bcf86cd799439011",
        cid: `${electronicsCategoryId}`,
      };

      const findSpy = jest
        .spyOn(productModel, "find")
        .mockImplementationOnce(() => {
          throw new Error("Database query failed");
        });

      await relatedProductController(req, res);

      expect(findSpy).toHaveBeenCalledWith({
        category: `${electronicsCategoryId}`,
        _id: { $ne: "507f1f77bcf86cd799439011" },
      });

      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error while getting related product");
      expect(payload.error).toBeDefined();

      findSpy.mockRestore();
    });
  });

  // =========================================
  // 9. productCategoryController
  // =========================================
  describe("productCategoryController", () => {
    it("productCategoryController + categoryModel findOne + productModel find/populate integration: should return the category and only products in that category", async () => {
      const targetCategory = await categoryModel.create({
        name: "Category Controller Target",
        slug: "category-controller-target",
      });

      const matchingProduct1 = await createProduct({
        name: "Category Match 1",
        category: targetCategory._id,
      });

      const matchingProduct2 = await createProduct({
        name: "Category Match 2",
        category: targetCategory._id,
      });

      await createProduct({
        name: "Category Miss",
      });

      req.params = { slug: "category-controller-target" };

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.category).toBeDefined();
      expect(payload.category.slug).toBe("category-controller-target");

      const responseIds = payload.products.map((product) => `${product._id}`);
      expect(responseIds).toEqual(
        expect.arrayContaining([
          `${matchingProduct1._id}`,
          `${matchingProduct2._id}`,
        ])
      );

      payload.products.forEach((product) => {
        expect(`${product.category._id || product.category}`).toBe(
          `${targetCategory._id}`
        );
      });
    });

    it("productCategoryController + categoryModel/productModel integration: should return 200 with null category and empty products for a missing slug", async () => {
      req.params = { slug: "missing-category-slug" };

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: null,
        products: [],
      });
    });

    it("productCategoryController + categoryModel findOne + productModel find/populate integration: should return the category and an empty products array when the category exists but has no products", async () => {
      const emptyCategory = await categoryModel.create({
        name: "Empty Category Controller Target",
        slug: "empty-category-controller-target",
      });

      await createProduct({
        name: "Product In Another Category",
      });

      req.params = { slug: "empty-category-controller-target" };

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(true);
      expect(payload.category).toBeDefined();
      expect(payload.category._id.toString()).toBe(emptyCategory._id.toString());
      expect(payload.category.slug).toBe("empty-category-controller-target");
      expect(Array.isArray(payload.products)).toBe(true);
      expect(payload.products).toHaveLength(0);
    });

    it("productCategoryController + categoryModel findOne throws integration: should return 500 when category lookup fails", async () => {
      req.params = { slug: "category-controller-target" };

      const findOneSpy = jest
        .spyOn(categoryModel, "findOne")
        .mockImplementationOnce(() => {
          throw new Error("Category lookup failed");
        });

      await productCategoryController(req, res);

      expect(findOneSpy).toHaveBeenCalledWith({
        slug: "category-controller-target",
      });
      expect(res.status).toHaveBeenCalledWith(500);

      const payload = res.send.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.message).toBe("Error While Getting products");
      expect(payload.error).toBeDefined();

      findOneSpy.mockRestore();
    });
  });
});