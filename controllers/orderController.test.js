import { getOrdersController, getAllOrdersController, orderStatusController } from "./orderController.js";
import orderModel from "../models/orderModel.js";

jest.mock("../models/orderModel.js");

describe("Order Controller Tests", () => {
    let req;
    let res;
    let consoleErrorSpy;

    beforeAll(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
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
        };
    });

    // getOrdersController Tests
    describe("getOrdersController", () => {
        describe("Error Handling", () => {
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
        describe("Error Handling", () => {
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

    describe("orderStatusController", () => {
        describe("Error Handling", () => {
            it("should log the errors", async () => {
                // Arrange
                req.params = { orderId: "orderId123" };
                req.body = { status: "Processing" };

                const statusUpdateError = new Error("Test error");

                orderModel.findByIdAndUpdate.mockRejectedValue(statusUpdateError);

                // Act
                await orderStatusController(req, res);

                // Assert
                expect(consoleErrorSpy).toHaveBeenCalledWith(statusUpdateError);
            });

            it("should return 500 status", async () => {
                // Arrange
                req.params = { orderId: "orderId123" };
                req.body = { status: "Processing" };

                const statusUpdateError = new Error("Test error");
                orderModel.findByIdAndUpdate.mockRejectedValue(statusUpdateError);
                
                // Act
                await orderStatusController(req, res);

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
