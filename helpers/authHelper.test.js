import { hashPassword, comparePassword } from "./authHelper.js";
import bcrypt from "bcrypt";

// Mock bcrypt
jest.mock("bcrypt");

// Tan Zhi Heng, A0252037M
describe("Auth Helper", () => {
  let consoleLogSpy;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock console.log to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // hashPassword Tests
  describe("hashPassword", () => {
    describe("Successful Hashing", () => {
      it("should call bcrypt.hash with the correct arguments", async () => {
        // Arrange
        const password = "mySecurePassword123";
        // Stub bcrypt.hash to return a placeholder value
        const hashedPassword = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
        bcrypt.hash.mockResolvedValue(hashedPassword);

        // Act
        const result = await hashPassword(password);
        
        // Assert
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(result).toBe(hashedPassword);
      });
    });

    describe("Error Handling", () => {
      it("should handle bcrypt.hash error and log it", async () => {
        // Arrange
        const password = undefined;
        const error = new Error("Bcrypt hashing failed");
        bcrypt.hash.mockRejectedValue(error);

        // Act
        const result = await hashPassword(password);

        // Assert
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
        expect(result).toBeUndefined();
      });
    });
  });

  // comparePassword Tests
  describe("comparePassword", () => {
    describe("Successful Comparison", () => {
      it("should call bcrypt.compare with the correct arguments", async () => {
        // Arrange
        const password = "myPassword123";
        const hashedPassword = "$2b$10$hashedPasswordExample";
        bcrypt.compare.mockResolvedValue(true);

        // Act
        const result = await comparePassword(password, hashedPassword);

        // Assert
        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });
    });
  });
});
