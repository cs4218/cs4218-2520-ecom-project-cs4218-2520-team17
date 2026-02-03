import { registerController } from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword } from "../helpers/authHelper.js";

// Mock dependencies
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");

describe("Auth Controller", () => {
  let req;
  let res;
  let consoleLogSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Setup default request object
    req = {
      body: {},
      params: {},
    };

    // Setup response mock
    res = {
      status: jest.fn().mockReturnThis(), // returns res for chaining
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // registerController Tests
  describe("registerController", () => {
    describe("Request Validation", () => {
      it("should return error when name is not provided", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      });

      it("should return error when email is not provided", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.send).toHaveBeenCalledWith({ message: "Email is Required" });
      });

      it("should return error when password is not provided", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.send).toHaveBeenCalledWith({ message: "Password is Required" });
      });

      it("should return error when phone is not provided", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          address: "123 Test St",
          answer: "answer",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.send).toHaveBeenCalledWith({ message: "Phone no is Required" });
      });

      it("should return error when address is not provided", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          answer: "answer",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.send).toHaveBeenCalledWith({ message: "Address is Required" });
      });

      it("should return error when answer is not provided", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is Required" });
      });
    });

    describe("Duplicate User Check", () => {
      it("should return error when user already exists", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        const existingUser = {
          _id: "123",
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        userModel.findOne.mockResolvedValue(existingUser);

        // Act
        await registerController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Already Register please login",
        });
      });
    });

    describe("Successful Registration", () => {
      it("should create a new user successfully with valid data", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        const hashedPass = "hashedPassword123";
        const savedUser = {
          _id: "newUserId123",
          name: "Test User",
          email: "test@example.com",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
          password: hashedPass,
          role: 0,
        };

        // Mock no existing user
        userModel.findOne.mockResolvedValue(null);
        // Mock password hashing
        hashPassword.mockResolvedValue(hashedPass);
        // Mock user save
        const saveMock = jest.fn().mockResolvedValue(savedUser);
        userModel.mockImplementation(() => ({
          save: saveMock,
        }));

        // Act
        await registerController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(hashPassword).toHaveBeenCalledWith("password123");
        expect(saveMock).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "User Register Successfully",
          user: savedUser,
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle error during registration and log it", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        const dbError = new Error("Database error");
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await registerController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in Registration",
          error: dbError,
        });
      });
    });
  });
});
