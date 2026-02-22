import { getOrdersController, getAllOrdersController, updateOrderStatusController } from "./orderController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

describe("Order Controller Tests", () => {
    let req;
    let res;
    let consoleErrorSpy;

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterAll(() => {
        consoleErrorSpy.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();

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
        describe("Successful Order Retrieval", () => {
            //  Sebastian Tay Yong Xun, A0252864X
            it("should retrieve orders for a user successfully", async () => {
                // Arrange
                req.user = { _id: "userId123" };

                const mockOrders = [
                    {
                        _id: "order1",
                        buyer: { name: "Test User" },
                        products: [{ _id: "product1", name: "Product 1", price: 100 }],
                        status: "Processing",
                    },
                    {
                        _id: "order2",
                        buyer: { name: "Test User" },
                        products: [{ _id: "product2", name: "Product 2", price: 200 }],
                        status: "Shipped",
                    },
                ];

                orderModel.find.mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockResolvedValue(mockOrders),
                    }),
                });

                // Act
                await getOrdersController(req, res);

                // Assert
                expect(orderModel.find).toHaveBeenCalledWith({ buyer: "userId123" });
                expect(res.json).toHaveBeenCalledWith(mockOrders);
            });
        });

        describe("Error Handling", () => {
            //  Sebastian Tay Yong Xun, A0252864X
            it("should log the errors", async () => {
                // Arrange
                req.user = { _id: "userId123" };

                const dbError = new Error("Test error");
                orderModel.find.mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockRejectedValue(dbError),
                    }),
                });

                //Act
                await getOrdersController(req, res);

                // Assert
                expect(consoleErrorSpy).toHaveBeenCalledWith(dbError);
            });

            //  Sebastian Tay Yong Xun, A0252864X
            it("should return 500 status", async () => {
                // Arrange
                req.user = { _id: "userId123" };

                const dbError = new Error("Test error");
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
        });
    });

    describe("getAllOrdersController", () => {
        describe("Successful Order Retrieval", () => {
            //  Sebastian Tay Yong Xun, A0252864X
            it("should retrieve all orders successfully", async () => {
                // Arrange
                const mockOrders = [
                    {
                        _id: "order1",
                        buyer: { name: "User 1" },
                        products: [{ _id: "product1", name: "Product 1", price: 100 }],
                        status: "Processing",
                        createdAt: "2024-01-02",
                    },
                    {
                        _id: "order2",
                        buyer: { name: "User 2" },
                        products: [{ _id: "product2", name: "Product 2", price: 200 }],
                        status: "Shipped",
                        createdAt: "2024-01-01",
                    },
                ];

                orderModel.find.mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockResolvedValue(mockOrders),
                        }),
                    }),
                });

                // Act
                await getAllOrdersController(req, res);

                // Assert
                expect(orderModel.find).toHaveBeenCalledWith({});
                expect(res.json).toHaveBeenCalledWith(mockOrders);
            });
        });

        describe("Error Handling", () => {
            //  Sebastian Tay Yong Xun, A0252864X
            it("should log the errors", async () => {
                // Arrange
                const error = new Error("Database error");
                orderModel.find.mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockRejectedValue(error)
                        })
                    })
                });

                //Act
                await getAllOrdersController(req, res);

                // Assert
                expect(consoleErrorSpy).toHaveBeenCalledWith(error);
            });

            //  Sebastian Tay Yong Xun, A0252864X
            it("should return 500 status", async () => {
                // Arrange
                const error = new Error("Database error");
                orderModel.find.mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        populate: jest.fn().mockReturnValue({
                            sort: jest.fn().mockRejectedValue(error)
                        })
                    })
                });

                // Act
                await getAllOrdersController(req, res);

                // Assert
                expect(consoleErrorSpy).toHaveBeenCalledWith(error);
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.send).toHaveBeenCalledWith({
                    success: false,
                    message: "Error While Getting Orders",
                    error: error,
                });
            });
        });
    });

    describe("updateOrderStatusController", () => {
        describe("Successful Order Status Update", () => {
            //  Sebastian Tay Yong Xun, A0252864X
            it("should update order status successfully", async () => {
                // Arrange
                req.params = { orderId: "orderId123" };
                req.body = { status: "Shipped" };

                const updatedOrder = {
                    _id: "orderId123",
                    buyer: { name: "Test User" },
                    products: [{ _id: "product1", name: "Product 1" }],
                    status: "Shipped",
                };

                orderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);

                // Act
                await updateOrderStatusController(req, res);

                // Assert
                expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
                    "orderId123",
                    { status: "Shipped" },
                    { new: true }
                );
                expect(res.json).toHaveBeenCalledWith(updatedOrder);
            });
        });

        describe("Error Handling", () => {
            //  Sebastian Tay Yong Xun, A0252864X
            it("should log the errors", async () => {
                // Arrange
                req.params = { orderId: "orderId123" };
                req.body = { status: "Processing" };

                const statusUpdateError = new Error("Test error");

                orderModel.findByIdAndUpdate.mockRejectedValue(statusUpdateError);

                // Act
                await updateOrderStatusController(req, res);

                // Assert
                expect(consoleErrorSpy).toHaveBeenCalledWith(statusUpdateError);
            });

            //  Sebastian Tay Yong Xun, A0252864X
            it("should return 500 status", async () => {
                // Arrange
                req.params = { orderId: "orderId123" };
                req.body = { status: "Processing" };

                const statusUpdateError = new Error("Test error");
                orderModel.findByIdAndUpdate.mockRejectedValue(statusUpdateError);
                
                // Act
                await updateOrderStatusController(req, res);

                // Assert
                expect(res.status).toHaveBeenCalledWith(500);
                expect(res.send).toHaveBeenCalledWith({
                    success: false,
                    message: "Error While Updating Order",
                    error: statusUpdateError,
                });
            });
        });
    });
});
