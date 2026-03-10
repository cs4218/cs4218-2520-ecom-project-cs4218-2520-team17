import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../config/db.js";
import {
  cleanupAndSeedDb,
  disconnectDb,
} from "../test/utils.js";

// Tan Zhi Heng, A0252037M
describe("Auth Middleware Integration Tests", () => {
  let req;
  let res;
  let next;
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

    // Mock console.log to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Mock environment variable
    process.env.JWT_SECRET = "test-jwt-secret";

    // Setup default request object
    req = {
      headers: {},
      user: {},
    };

    // Setup response mock
    res = {
      status: jest.fn().mockReturnThis(), // returns res for chaining
      send: jest.fn().mockReturnThis(),
    };

    // Setup next function mock
    next = jest.fn();

    // Seed the database with initial data before each test
    await cleanupAndSeedDb();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // requireSignIn Tests
  describe("requireSignIn", () => {
    it("should verify token and call next on successful authentication", async () => {
      // Arrange
      const token = JWT.sign({ _id: "67a218decf4efddf1e5358ac" }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
      req.headers.authorization = token;

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(req.user._id).toEqual("67a218decf4efddf1e5358ac");
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid token and log the error", async () => {
      // Arrange
      const token = JWT.sign({ _id: "67a218decf4efddf1e5358ac" }, "wrong-jwt-secret", {
        expiresIn: "7d",
      });
      req.headers.authorization = token;

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error in requireSignIn middleware",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  // isAdmin Tests
  describe("isAdmin", () => {
    it("should call next when user is admin (role === 1)", async () => {
      // Arrange
      req.user._id = "671218f37e0f5f9fddeb66e9"; // Admin user ID from seeded data

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not admin (role === 0)", async () => {
      // Arrange
      req.user._id = "67a218decf4efddf1e5358ac"; // Non-admin user ID from seeded data

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UnAuthorized Access",
      });
      expect(next).not.toHaveBeenCalled();
    });
    
    it("should handle any error and log it", async () => {
      // Arrange
      // userModel.findById returns null for a non-existent user and 
      // the middleware then tries to access null.role, throwing a TypeError.
      req.user._id = "123456789abcdef123456789"; // Non-existent user ID

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: expect.any(Error),
        message: "Error in admin middleware",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
