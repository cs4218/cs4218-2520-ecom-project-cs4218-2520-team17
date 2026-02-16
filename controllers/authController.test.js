import { registerController, loginController, forgotPasswordController, updateProfileController, testController } from "./authController.js";
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
  let consoleErrorSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log and console.error to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

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
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
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
        expect(res.status).toHaveBeenCalledWith(400);
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
        expect(res.status).toHaveBeenCalledWith(400);
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
        expect(res.status).toHaveBeenCalledWith(400);
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
        expect(res.status).toHaveBeenCalledWith(400);
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
        expect(res.status).toHaveBeenCalledWith(400);
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
        expect(res.status).toHaveBeenCalledWith(400);
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
          password: "hashedPassword123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "answer",
          role: 0,
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

        userModel.findOne.mockResolvedValue(null);

        // Act
        await loginController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({ email: "nonexistent@example.com" });
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
          answer: "answer",
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
          answer: "answer",
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
        expect(res.send).toHaveBeenCalledWith({ message: "Email is required" });
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
        expect(res.send).toHaveBeenCalledWith({ message: "Answer is required" });
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
        expect(res.send).toHaveBeenCalledWith({ message: "New Password is required" });
      });
    });

    describe("User Not Found", () => {
      it("should return 404 when email and answer combination is wrong", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          answer: "wrongAnswer",
          newPassword: "newPassword123",
        };

        userModel.findOne.mockResolvedValue(null);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "wrongAnswer",
        });
        expect(res.status).toHaveBeenCalledWith(404);
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
          email: "test@example.com",
          answer: "correctAnswer",
          newPassword: "newSecurePassword",
        };

        const mockUser = {
          _id: "userId123",
          name: "Test User",
          email: "test@example.com",
          password: "hashedPassword123",
          phone: "1234567890",
          address: "123 Test St",
          answer: "correctAnswer",
          role: 0,
        };

        const hashedNewPassword = "hashedNewPassword123";

        userModel.findOne.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue(hashedNewPassword);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(userModel.findOne).toHaveBeenCalledWith({
          email: "test@example.com",
          answer: "correctAnswer",
        });
        expect(hashPassword).toHaveBeenCalledWith("newSecurePassword");
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith("userId123", {
          password: hashedNewPassword,
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({
          success: true,
          message: "Password Reset Successfully",
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle error and log it", async () => {
        // Arrange
        req.body = {
          email: "test@example.com",
          answer: "answer",
          newPassword: "newPass123",
        };

        const dbError = new Error("Database error");
        userModel.findOne.mockRejectedValue(dbError);

        // Act
        await forgotPasswordController(req, res);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Something went wrong",
          error: dbError,
        });
      });
    });
  });

  // testController Tests
  describe("testController", () => {
    it("should send 'Protected Routes' message", () => {
      // Act
      testController(req, res);

      // Assert
      expect(res.send).toHaveBeenCalledWith("Protected Routes");
    });

    it("should handle errors and send error response", () => {
      // Arrange
      const mockError = new Error("Test error");
      res.send = jest.fn().mockImplementationOnce(() => {
        throw mockError;
      }).mockReturnThis();

      // Act
      testController(req, res);

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
      expect(res.send).toHaveBeenCalledTimes(2); // First call throws, second call handles error
      expect(res.send).toHaveBeenLastCalledWith({ error: mockError });
    });
  });

  // updateProfileController Tests
  describe("updateProfileController", () => {
    it("should enforce the password requirements of a string with minimum 6 characters", async () => {
      // Arrange
      req.user = { _id: "userId123" };
      req.body = {
        password: "12345", // Less than 6 characters
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

      userModel.findById.mockResolvedValue(mockUser);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({
        error: "Password is required to be minimally 6 character long",
      });

      expect(hashPassword).not.toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should update the user profile with a full request body data", async () => {
      // Arrange
      req.user = { _id: "userId123" };
      req.body = {
        name: "Updated Name",
        phone: "9876543210",
        email: "new@example.com",
        address: "456 New St",
        password: "newPassword123",
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

      const hashedNewPassword = "hashedNewPassword123";

      userModel.findById.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue(hashedNewPassword);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        name: "Updated Name",
        phone: "9876543210",
        email: "new@example.com",
        address: "456 New St",
        password: hashedNewPassword,
      });

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith("newPassword123");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "userId123",
        {
          name: "Updated Name",
          password: hashedNewPassword,
          email: "new@example.com",
          phone: "9876543210",
          address: "456 New St",
        },
        { new: true }
      );
    });

    it("should update the user profile with subset of fields", async () => {
      // Arrange
      req.user = {
        _id: "userId123"
      };

      req.body = {
        name: "Updated Name" //Only name
      }

      const mockUser = {
        _id: "userId123",
        name: "Test User",
        email: "test@example.com",
        password: "hashedPassword123",
        phone: "1234567890",
        address: "123 Test St",
        role: 0,
      };
      
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        name: "Updated Name",
      });

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(hashPassword).not.toHaveBeenCalled(); // No password update
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "userId123",
        {
          name: "Updated Name",
          password: "hashedPassword123",
          email: "test@example.com",
          phone: "1234567890",        
          address: "123 Test St",
        },
        { new: true }
      );
    });

    it("should return 200 status and success message upon successful update", async () => {
      // Arrange
      req.user = { _id: "userId123" };
      req.body = {
        name: "Updated Name",
        phone: "9876543210",
        address: "456 New St",
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

      const updatedUserData = {
        _id: "userId123",
        name: "Updated Name",
        email: "test@example.com",
        password: "hashedPassword123",
        phone: "9876543210",
        address: "456 New St",
        role: 0,
      };

      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(updatedUserData);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Profile Updated Successfully",
        updatedUser: updatedUserData,
      });
    });

    it("should handle errors and return 400 status with error message", async () => {
      // Arrange
      req.user = { _id: "userId123" };
      req.body = {
        name: "Updated Name",
      };

      const dbError = new Error("Database error");
      userModel.findById.mockRejectedValue(dbError);

      // Act
      await updateProfileController(req, res);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(dbError);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while updating profile",
        error: dbError,
      });
    });
  });
});
