import { registerController, loginController } from "./authController.js";
import userModel from "../models/userModel.js";
import { hashPassword, comparePassword } from "../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Mock dependencies
jest.mock("../models/userModel.js");
jest.mock("../helpers/authHelper.js");
jest.mock("jsonwebtoken");

describe("Auth Controller", () => {
  let req;
  let res;
  let consoleLogSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Mock environment variable
    process.env.JWT_SECRET = "test-secret";

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

  // loginController Tests
  describe("loginController", () => {
    describe("Request Validation", () => {
      it("should return 404 when email is not provided", async () => {
        // Arrange
        req.body = {
          password: "password123",
        };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should return 404 when password is not provided", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
        };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });
    });

    describe("User Not Found", () => {
      it("should return 404 when user is not registered", async () => {
        // Arrange
        req.body = {
          email: "nonexistent@example.com",
          password: "password123",
        };

        userModel.findOne.mockResolvedValue(null);

        // Act
        await loginController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Email is not registered",
        });
      });
    });

    describe("Invalid Password", () => {
      it("should return 401 when password does not match", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          password: "wrongpassword",
        };

        const mockUser = {
          _id: "userId123",
          name: "Test User",
          email: "test@example.com",
          password: "hashedPassword123",
          phone: "1234567890",
          address: "123 Test St",
          role: 0,
        };

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(false);

        // Act
        await loginController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(comparePassword).toHaveBeenCalledWith("wrongpassword", "hashedPassword123");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid Password",
        });
      });
    });

    describe("Successful Login", () => {
      it("should login successfully with valid credentials", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          password: "correctpassword",
        };

        const mockUser = {
          _id: "userId123",
          name: "Test User",
          email: "test@example.com",
          password: "hashedPassword123",
          phone: "1234567890",
          address: "123 Test St",
          role: 0,
        };

        const mockToken = "jwt.token.here";

        userModel.findOne.mockResolvedValue(mockUser);
        comparePassword.mockResolvedValue(true);
        JWT.sign.mockReturnValue(mockToken);

        // Act
        await loginController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
        expect(comparePassword).toHaveBeenCalledWith("correctpassword", "hashedPassword123");
        expect(JWT.sign).toHaveBeenCalledWith(
          { _id: "userId123" },
          "test-secret",
          { expiresIn: "7d" }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "login successfully",
          user: {
            _id: "userId123",
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            address: "123 Test St",
            role: 0,
          },
          token: mockToken,
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle error during login and log it", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          password: "password123",
        };

        const dbError = new Error("Database error");
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await loginController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error in login",
          error: dbError,
        });
      });
    });
  });
});
