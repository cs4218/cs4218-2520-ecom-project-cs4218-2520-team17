
import { describe } from "node:test";
import {
  getProductController,
} from "./productController.js";
import productModel from "../models/productModel.js";



// Mock Dependencies
jest.mock("../models/productModel.js");


// Functions
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

describe('Test Product Controller', () => {
  let req;
  let res;
  let consoleLogSpy;
  beforeEach(() => {

    jest.clearAllMocks()

    // SILENT YOU PEASANTS
    jest.spyOn(console, "log").mockImplementation(() => {});

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

      console.log.mockRestore();
    });
  })

})