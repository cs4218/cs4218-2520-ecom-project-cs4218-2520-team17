import { hashPassword, comparePassword } from "./authHelper.js";

// Tan Zhi Heng, A0252037M
describe("Auth Helper Integration Tests", () => {
  let consoleLogSpy;

  beforeEach(() => {
    // Mock console.log to suppress output
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // hashPassword Tests
  describe("hashPassword", () => {
    describe("Successful Hashing", () => {
      it("should produce different hashes for the same password on repeated calls", async () => {
        // Arrange
        const password = "samePassword";

        // Act
        const hash1 = await hashPassword(password);
        const hash2 = await hashPassword(password);

        // Assert
        expect(hash1).not.toBe(hash2);
      });

      it("should return a bcrypt hash with the correct prefix", async () => {
        // Arrange
        const password = "testPassword";

        // Act
        const result = await hashPassword(password);

        // Assert
        expect(result).toMatch(/^\$2b\$10\$/); // 2b is the bcrypt version, 10 is the salt rounds
      });
    });

    describe("Error Handling", () => {
      it("should handle bcrypt.hash error and log it", async () => {
        // Arrange
        const password = undefined;

        // Act
        const result = await hashPassword(password);

        // Assert
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(result).toBeUndefined();
      });
    });
  });

  // comparePassword Tests
  describe("comparePassword", () => {
    describe("Successful Comparison", () => {
      it("should compare passwords correctly", async () => {
        // Arrange
        const password = "mySecurePassword123";
        const hashedPassword = await hashPassword(password);

        // Act
        const result = await comparePassword(password, hashedPassword);

        // Assert
        expect(result).toBe(true);
      });

      it("should return false for an incorrect password", async () => {
        // Arrange
        const password = "correctPassword";
        const wrongPassword = "wrongPassword";
        const hashedPassword = await hashPassword(password);

        // Act
        const result = await comparePassword(wrongPassword, hashedPassword);

        // Assert
        expect(result).toBe(false);
      });
    });
  });
});