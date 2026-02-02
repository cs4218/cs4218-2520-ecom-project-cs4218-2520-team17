import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Mock dependencies
jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("Auth Middleware", () => {
  let req;
  let res;
  let next;
  let consoleLogSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

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
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // requireSignIn Tests
  describe("requireSignIn", () => {
    it("should verify token and call next on successful authentication", async () => {
      // Arrange
      const token = "valid-token";
      const decodedUser = { _id: "user123" };
      req.headers.authorization = token;
      JWT.verify.mockReturnValue(decodedUser);

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(JWT.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
      expect(req.user).toEqual(decodedUser);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid token and log the error", async () => {
      // Arrange
      req.headers.authorization = "invalid-token";
      const error = new Error("invalid token");
      JWT.verify.mockImplementation(() => {
        throw error;
      });

      // Act
      await requireSignIn(req, res, next);

      // Assert
      expect(JWT.verify).toHaveBeenCalledWith(
        "invalid-token",
        process.env.JWT_SECRET
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(error);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // isAdmin Tests
  describe("isAdmin", () => {
    it("should call next when user is admin (role === 1)", async () => {
      // Arrange
      req.user = { _id: "admin123" };
      const adminUser = { _id: "admin123", role: 1 };
      userModel.findById.mockResolvedValue(adminUser);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith("admin123");
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.send).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not admin (role === 0)", async () => {
      // Arrange
      req.user = { _id: "user123" };
      const regularUser = { _id: "user123", role: 0 };
      userModel.findById.mockResolvedValue(regularUser);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith("user123");
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "UnAuthorized Access",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should handle database error when finding user and log it", async () => {
      // Arrange
      req.user = { _id: "user789" };
      const dbError = new Error("Database error");
      userModel.findById.mockRejectedValue(dbError);

      // Act
      await isAdmin(req, res, next);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith("user789");
      expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: dbError,
        message: "Error in admin middleware",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
