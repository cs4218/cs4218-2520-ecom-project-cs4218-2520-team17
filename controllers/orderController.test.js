import { getOrdersController } from "./orderController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

describe("Order Controller Tests", () => {
    let req;
    let res;
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();

        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        req = {
            body: {},
            params: {},
            user: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    // getOrdersController Tests
    describe("getOrdersController", () => {
    // Helper function to create orderModel stub that simulates MongoDB with separate collections
    const createOrderModelStub = (database) => {
      const { orders, products, users } = database;
      
      const stub = {
        find: jest.fn((query) => {
          // Simulate MongoDB filtering by buyer ID
          const filteredOrders = orders.filter(
            order => order.buyer === query.buyer
          );
          
          // Return chainable populate methods
          const firstPopulate = jest.fn((field, select) => {
            // Simulate first populate for products
            const populatedOrders = filteredOrders.map(order => ({
              ...order,
              products: order.products.map(productId => {
                const product = products.find(p => p._id === productId);
                if (!product) return productId;
                
                // Simulate field selection (exclude photo with "-photo")
                if (select === "-photo") {
                  const { photo, ...productWithoutPhoto } = product;
                  return productWithoutPhoto;
                }
                return product;
              }),
            }));
            
            return {
              populate: jest.fn((field, select) => {
                // Simulate second populate for buyer
                const fullyPopulated = populatedOrders.map(order => ({
                  ...order,
                  buyer: (() => {
                    const user = users.find(u => u._id === order.buyer);
                    if (!user) return order.buyer;
                    
                    // Simulate field selection (only return "name")
                    if (select === "name") {
                      return { name: user.name };
                    }
                    return user;
                  })(),
                }));
                
                return Promise.resolve(fullyPopulated);
              }),
            };
          });
          
          return {
            populate: firstPopulate,
          };
        }),
      };
      
      return stub;
    };

    describe("Successful Order Retrieval", () => {
      it("should retrieve orders for a user successfully", async () => {
        // Arrange
        req.user = { _id: "userId123" };

        // Define the "database" with separate collections
        const database = {
          users: [
            { _id: "userId123", name: "Test User", email: "test@example.com" },
            { _id: "userId987", name: "Test User 2", email: "test2@example.com" },
          ],
          products: [
            { 
              _id: "product1", 
              name: "Product 1",
              price: 100, 
              description: "Description 1",
              photo: { data: "binary data", contentType: "image/png" }
            },
            { 
              _id: "product2", 
              name: "Product 2",
              price: 200,
              description: "Description 2",
              photo: { data: "binary data", contentType: "image/png" }
            },
          ],
          orders: [
            {
              _id: "order1",
              buyer: "userId123",  // Reference to user ID
              products: ["product1"],  // References to product IDs
              status: "Not Process",
              createdAt: "2024-01-01",
            },
            {
              _id: "order2",
              buyer: "userId123",  // Reference to user ID
              products: ["product2"],  // References to product IDs
              status: "Processing",
              createdAt: "2024-01-02",
            },
            {
              _id: "order3",
              buyer: "userId987",  // Different user
              products: ["product1"],
              status: "Not Process",
              createdAt: "2024-01-01",
            },
          ],
        };

        // Create and apply stub
        const orderModelStub = createOrderModelStub(database);
        orderModel.find = orderModelStub.find;

        // Act
        await getOrdersController(req, res);

        // Assert
        expect(orderModel.find).toHaveBeenCalledWith({ buyer: "userId123" });
        
        const result = res.json.mock.calls[0][0];
        expect(result).toHaveLength(2);  // Only userId123's orders
        
        // Verify products are populated without photo
        expect(result[0].products[0]).toHaveProperty("name");
        expect(result[0].products[0]).not.toHaveProperty("photo");
        
        // Verify buyer is populated with only name
        expect(result[0].buyer).toEqual({ name: "Test User" });
      });

      it("should return empty array when user has no orders", async () => {
        // Arrange
        req.user = { _id: "userId123" };

        // All orders belong to other users
        const database = {
          users: [
            { _id: "userId123", name: "Test User", email: "test@example.com" },
            { _id: "userId987", name: "Test User 2", email: "test2@example.com" },
          ],
          products: [
            { _id: "product1", name: "Product 1", price: 100 },
            { _id: "product2", name: "Product 2", price: 200 },
          ],
          orders: [
            {
              _id: "order1",
              buyer: "userId987",  // Different user
              products: ["product1"],
              status: "Not Process",
              createdAt: "2024-01-01",
            },
            {
              _id: "order2",
              buyer: "userId987",  // Different user
              products: ["product2"],
              status: "Processing",
              createdAt: "2024-01-02",
            },
          ],
        };

        // Create and apply stub
        const orderModelStub = createOrderModelStub(database);
        orderModel.find = orderModelStub.find;

        // Act
        await getOrdersController(req, res);

        // Assert
        expect(orderModel.find).toHaveBeenCalledWith({ buyer: "userId123" });
        expect(res.json).toHaveBeenCalledWith([]);
      });

      it("should populate products without photo field", async () => {
        // Arrange
        req.user = { _id: "userId123" };

        const database = {
          users: [
            { _id: "userId123", name: "Test User", email: "test@example.com" },
          ],
          products: [
            { 
              _id: "product1", 
              name: "Product 1",
              price: 100,
              description: "A test product",
              photo: { data: "binary data", contentType: "image/png" }  // This should be excluded
            },
          ],
          orders: [
            {
              _id: "order1",
              buyer: "userId123",
              products: ["product1"],
              status: "Not Process",
            },
          ],
        };

        // Create and apply stub
        const orderModelStub = createOrderModelStub(database);
        orderModel.find = orderModelStub.find;

        // Act
        await getOrdersController(req, res);

        // Assert
        expect(orderModel.find).toHaveBeenCalledWith({ buyer: "userId123" });
        const populateCall = orderModel.find.mock.results[0].value.populate;
        expect(populateCall).toHaveBeenCalledWith("products", "-photo");
        
        const result = res.json.mock.calls[0][0];
        // Verify photo field is not present in populated products
        expect(result[0].products[0]).toHaveProperty("name", "Product 1");
        expect(result[0].products[0]).toHaveProperty("price", 100);
        expect(result[0].products[0]).not.toHaveProperty("photo");
      });

      it("should populate buyer with only name field", async () => {
        // Arrange
        req.user = { _id: "userId123" };

        const database = {
          users: [
            { 
              _id: "userId123", 
              name: "Test User",
              email: "test@example.com",  // This should be excluded
              password: "hashed",  // This should be excluded
              phone: "1234567890",  // This should be excluded
            },
          ],
          products: [
            { _id: "product1", name: "Product 1", price: 100 },
          ],
          orders: [
            {
              _id: "order1",
              buyer: "userId123",
              products: ["product1"],
              status: "Processing",
            },
          ],
        };

        // Create and apply stub
        const orderModelStub = createOrderModelStub(database);
        orderModel.find = orderModelStub.find;

        // Act
        await getOrdersController(req, res);

        // Assert
        expect(orderModel.find).toHaveBeenCalledWith({ buyer: "userId123" });
        const firstPopulateResult = orderModel.find.mock.results[0].value;
        const secondPopulate = firstPopulateResult.populate.mock.results[0].value.populate;
        expect(secondPopulate).toHaveBeenCalledWith("buyer", "name");
        
        const result = res.json.mock.calls[0][0];
        // Verify buyer only has name field, no email, password, or phone
        expect(result[0].buyer).toEqual({ name: "Test User" });
        expect(result[0].buyer).not.toHaveProperty("email");
        expect(result[0].buyer).not.toHaveProperty("password");
      });
    });

    describe("Error Handling", () => {
      it("should handle database errors and return 500 status", async () => {
        // Arrange
        req.user = { _id: "userId123" };

        const dbError = new Error("Database connection error");
        orderModel.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(dbError),
          }),
        });

        // Act
        await getOrdersController(req, res);

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(dbError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error While Getting Orders",
          error: dbError,
        });
      });

      it("should handle populate errors and return 500 status", async () => {
        // Arrange
        req.user = { _id: "userId123" };

        const populateError = new Error("Populate failed");
        orderModel.find.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(populateError),
          }),
        });

        // Act
        await getOrdersController(req, res);

        // Assert
        expect(consoleErrorSpy).toHaveBeenCalledWith(populateError);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith({
          success: false,
          message: "Error While Getting Orders",
          error: populateError,
        });
      });
    });
  });

  describe("getAllOrdersController", () => {

  });

  describe("orderStatusController", () => {

  });
});
