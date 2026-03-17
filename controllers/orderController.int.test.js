import { MongoMemoryServer } from "mongodb-memory-server";
import orderModel from "../models/orderModel.js";
import { cleanupAndSeedDb, disconnectDb } from "../test/utils.js";
import connectDB from "../config/db.js";
import {
    getOrdersController,
    getAllOrdersController,
    updateOrderStatusController,
} from "./orderController.js";

describe("Order Controller Integration Tests", () => {
    let req;
    let res;
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

        // Mock console.error to suppress output and allow assertions
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Setup default request object
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

        // Seed the database with initial data before each test
        await cleanupAndSeedDb();
    });

    afterEach(async () => {
        consoleErrorSpy.mockRestore();
    });

    describe("getOrdersController", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should retrieve orders for a valid user successfully", async () => {
            //Seeded data
            req.user = { _id: "67136d5416c8949aec627dd3" };

            await getOrdersController(req, res);

            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();

            const orders = res.json.mock.calls[0][0];
            expect(Array.isArray(orders)).toBe(true);
            expect(orders.length).toBeGreaterThan(0);
            expect(orders[0].buyer).toHaveProperty("name", "Test 3");
            expect(orders[0].products.length).toBeGreaterThan(0);
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should not retrieve any orders for valid user without orders saved", async () => {
            //Seeded data
            req.user = { _id: "6714c2a30e8ea8335e4104ff" };

            await getOrdersController(req, res);

            expect(res.json).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();

            const orders = res.json.mock.calls[0][0];
            expect(Array.isArray(orders)).toBe(true);
            expect(orders.length).toBe(0);
        });        

        //  Sebastian Tay Yong Xun, A0252864X
        it("should return status 500 for invalid buyer id", async () => {
            req.user = { _id: "invalid-object-id" };

            await getOrdersController(req, res);

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error While Getting Orders",
                }),
            );
        });
    });

    describe("getAllOrdersController", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should retrieve all orders successfully", async () => {
            await getAllOrdersController(req, res);

            expect(res.json).toHaveBeenCalledTimes(1);

            const orders = res.json.mock.calls[0][0];
            expect(Array.isArray(orders)).toBe(true); //Seeded data has multiple orders from various users
            expect(orders.length).toBeGreaterThan(0);
            expect(orders[0]).toHaveProperty("status");
            expect(orders[0].buyer).toHaveProperty("name");
            expect(orders.map((order) => order.buyer._id).length).toBeGreaterThan(1); //Multiple buyers in seeded data
        });
    });

    describe("updateOrderStatusController", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should update order status successfully for a valid existing order", async () => {
            const orderId = "67a21938cf4efddf1e5358d1";
            req.params = { orderId };
            req.body = { status: "Processing" }; // Initial status of "Not Process"

            await updateOrderStatusController(req, res);

            expect(res.json).toHaveBeenCalledTimes(1);
            const updatedOrder = res.json.mock.calls[0][0];
            expect(updatedOrder).not.toBeNull();
            expect(updatedOrder._id.toString()).toBe(orderId);
            expect(updatedOrder.status).toBe("Processing");

            const orderInDb = await orderModel.findById(orderId);
            expect(orderInDb.status).toBe("Processing");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should return 404 when order does not exist", async () => {
            req.params = { orderId: "000000000000000000000000" }; //Valid but non-existent ID
            req.body = { status: "Delivered" };

            await updateOrderStatusController(req, res);

            expect(res.json).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(404);
        });
    });
});