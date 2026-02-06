import { hashPassword, comparePassword } from "./authHelper.js";
import bcrypt from "bcrypt";

// Mock bcrypt
jest.mock("bcrypt");

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
        const password = "mySecurePassword123";

        // Stub bcrypt.hash to return a placeholder value
        const hashedPassword = "$2b$10$abcdefghijklmnopqrstuvwxyz1234567890";
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const result = await hashPassword(password);

        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(result).toBe(hashedPassword);
      });
    });

    describe("Error Handling", () => {
      it("should handle bcrypt.hash error and log it", async () => {
        const password = undefined;
        const error = new Error("Bcrypt hashing failed");

        bcrypt.hash.mockRejectedValue(error);

        const result = await hashPassword(password);

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
        const password = "myPassword123";
        const hashedPassword = "$2b$10$hashedPasswordExample";

        bcrypt.compare.mockResolvedValue(true);

        const result = await comparePassword(password, hashedPassword);

        expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        expect(result).toBe(true);
      });
    });
  });
});
