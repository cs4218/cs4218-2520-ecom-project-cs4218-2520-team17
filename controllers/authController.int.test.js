import { registerController, loginController, forgotPasswordController, updateProfileController, testController } from "./authController.js";
import JWT from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../config/db.js";
import {
  cleanupAndSeedDb,
  disconnectDb,
} from "../test/utils.js";
import { ObjectId } from "mongodb";

describe("Auth Controller Integration Tests", () => {
  let req;
  let res;
  let consoleLogSpy;
  let consoleErrorSpy;
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

    // Mock console.log and console.error to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    // Mock environment variable
    process.env.JWT_SECRET = "test-jwt-secret";

    // Setup default request object
    req = {
      body: {},
      params: {},
    };

    // Setup response mock
    res = {
      status: jest.fn().mockReturnThis(), // returns res for chaining
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Seed the database with initial data before each test
    await cleanupAndSeedDb();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  // Tan Zhi Heng, A0252037M
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
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Name is Required" });
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
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is Required" });
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
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Password is Required" });
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
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Phone no is Required" });
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
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Address is Required" });
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
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Answer is Required" });
      });
    });

    describe("Duplicate User Check", () => {
      it("should return error when user already exists", async () => {
        // Arrange
        req.body = {
          name: "Test User",
          email: "cs4218@test.com", // Email of existing user in seeded data
          password: "password123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
        };

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
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

        // Act
        await registerController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "User Register Successfully",
          user: expect.objectContaining({
            name: "Test User",
            email: "test@example.com",
            phone: "1234567890",
            address: "123 Test St",
            answer: "answer",
            role: 0, // default role
          }),
        });
      });
    });
  });

  // Tan Zhi Heng, A0252037M
  // loginController Tests
  describe("loginController", () => {
    describe("Request Validation", () => {
      it("should return 400 when email is not provided", async () => {
        // Arrange
        req.body = {
          password: "password123",
        };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });

      it("should return 400 when password is not provided", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
        };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Invalid email or password",
        });
      });
    });

    describe("User Not Found", () => {
      it("should return 401 when user is not registered", async () => {
        // Arrange
        req.body = {
          email: "nonexistent@example.com",
          password: "password123",
        };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
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
          email: "cs4218@test.com",
          password: "wrongpassword",
        };

        // Act
        await loginController(req, res);

        // Assert
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
          email: "cs4218@test.com",
          password: "cs4218@test.com",
        };

        // Act
        await loginController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "login successfully",
          user: {
            _id: new ObjectId("67a218decf4efddf1e5358ac"),
            name: "CS 4218 Test Account",
            email: "cs4218@test.com",
            phone: "81234567",
            address: "1 Computing Drive",
            role: 0,
          },
          token: expect.any(String),
        });
      });
    });
  });

  // Tan Zhi Heng, A0252037M
  // forgotPasswordController Tests
  describe("forgotPasswordController", () => {
    describe("Request Validation", () => {
      it("should return 400 when email is not provided", async () => {
        // Arrange
        req.body = {
          answer: "myAnswer",
          newPassword: "newPassword123",
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Email is required" });
      });

      it("should return 400 when answer is not provided", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          newPassword: "newPassword123",
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "Answer is required" });
      });

      it("should return 400 when newPassword is not provided", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          answer: "myAnswer",
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ success: false, message: "New Password is required" });
      });
    });

    describe("User Not Found", () => {
      it("should return 401 when email and answer combination is wrong", async () => {
        // Arrange
        req.body = {
          email: "cs4218@test.com",
          answer: "wrongAnswer",
          newPassword: "newPassword123",
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Wrong Email Or Answer",
        });
      });
    });

    describe("Successful Password Reset", () => {
      it("should reset password successfully with valid email and answer", async () => {
        // Arrange
        req.body = {
          email: "cs4218@test.com",
          answer: "password is cs4218@test.com",
          newPassword: "newSecurePassword",
        };

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Password Reset Successfully",
        });
      });
    });
  });

   // Tan Zhi Heng, A0252037M
  // updateProfileController Tests
  describe("updateProfileController", () => {
    it("should enforce the password requirements of a string with minimum 6 characters", async () => {
      // Arrange
      req.user = { _id: "67a218decf4efddf1e5358ac" };
      req.body = {
        password: "12345", // Less than 6 characters
      };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Password is required to be minimally 6 character long",
      });
    });

    it("should update the user profile with a full request body data", async () => {
      // Arrange
      req.user = { _id: "67a218decf4efddf1e5358ac" };
      req.body = {
        name: "Updated Name",
        phone: "98765432",
        email: "new@example.com",
        address: "456 New St",
        password: "newPassword123",
      };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expect.objectContaining({
          name: "Updated Name",
          email: "new@example.com",
          phone: "98765432",
          address: "456 New St",
        })
      });
    });

    it("should update the user profile with subset of fields", async () => {
      // Arrange
      req.user = { _id: "67a218decf4efddf1e5358ac" };
      req.body = { name: "Updated Name" }

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: expect.objectContaining({
          name: "Updated Name",
          email: "cs4218@test.com",
          phone: "81234567",
          address: "1 Computing Drive",
        }),
      });
    });

    it("should handle errors and return 500 status with error message", async () => {
      // Arrange
      req.user = { _id: "userId123" }; // Non-existent user ID to trigger error
      req.body = { name: "Updated Name" };

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating profile",
        error: expect.any(Error),
      });
    });
  });
});
