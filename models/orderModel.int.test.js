import { MongoMemoryServer } from "mongodb-memory-server";
import { cleanupAndSeedDb, disconnectDb } from "../test/utils.js";
import Order from "./orderModel.js";
import User from "./userModel.js";
import Product from "./productModel.js";
import connectDB from "../config/db.js";

describe("Order Model Integration Tests", () => {
    let mongod;
    let user;
    let products;

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
        await cleanupAndSeedDb();
        // Fetch seeded data for use in tests
        user = await User.findOne({});
        products = await Product.find({}).limit(5);
    });

    describe("Schema Validation", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should create an order with all valid fields", async () => {
            const product = products[0];

            const orderData = {
                products: [product._id],
                payment: {
                    transaction: { amount: "100.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
                status: "Not Process",
            };

            const order = await Order.create(orderData);

            expect(order._id).toBeDefined();
            expect(order.products).toHaveLength(1);
            expect(order.products[0].toString()).toBe(product._id.toString());
            expect(order.buyer.toString()).toBe(user._id.toString());
            expect(order.status).toBe("Not Process");
            expect(order.payment).toEqual({
                transaction: { amount: "100.00", method: "credit_card", status: "submitted_for_settlement" },
                success: true,
            });
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should not allow empty payment object", async () => {
            const product = products[0];
            const invalidOrder = new Order({
                products: [product._id],
                payment: {},
                buyer: user._id,
            });

            await expect(invalidOrder.save()).rejects.toThrow("payment must be a non-empty object");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should not allow empty products array", async () => {
            const invalidOrder = new Order({
                products: [],
                payment: {
                    transaction: { amount: "100.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            await expect(invalidOrder.save()).rejects.toThrow("products must contain at least one product");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should not allow missing buyer", async () => {
            const product = products[0];
            const invalidOrder = new Order({
                products: [product._id],
                payment: {
                    transaction: { amount: "100.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
            });

            await expect(invalidOrder.save()).rejects.toThrow("buyer is required");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should allow multiple products in an order", async () => {
            const product1 = products[0];
            const product2 = products[1];

            const order = await Order.create({
                products: [product1._id, product2._id],
                payment: {
                    transaction: { amount: "250.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            expect(order.products).toHaveLength(2);
            expect(order.products[0].toString()).toBe(product1._id.toString());
            expect(order.products[1].toString()).toBe(product2._id.toString());
        });
    });

    describe("Default Values", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should set default status to 'Not Process'", async () => {
            const order = await Order.create({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "99.99", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            expect(order.status).toBe("Not Process");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should create createdAt and updatedAt timestamps", async () => {
            const order = await Order.create({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "99.99", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            expect(order.createdAt).toBeDefined();
            expect(order.updatedAt).toBeDefined();
            expect(order.createdAt).toBeInstanceOf(Date);
            expect(order.updatedAt).toBeInstanceOf(Date);
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should have equal createdAt and updatedAt on creation", async () => {
            const order = await Order.create({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "99.99", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            expect(order.createdAt.getTime()).toBe(order.updatedAt.getTime());
        });
    });

    describe("Enum Validation", () => {
        const validStatuses = ["Not Process", "Processing", "Shipped", "Delivered", "Cancelled"];

        //  Sebastian Tay Yong Xun, A0252864X
        it("should accept all valid status values", async () => {
            for (const status of validStatuses) {
                const order = await Order.create({
                    products: [products[0]._id],
                    payment: {
                        transaction: { amount: "99.99", method: "credit_card", status: "submitted_for_settlement" },
                        success: true,
                    },
                    buyer: user._id,
                    status,
                });

                expect(order.status).toBe(status);
            }
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should reject invalid status values", async () => {
            const invalidOrder = new Order({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "99.99", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
                status: "InvalidStatus",
            });

            await expect(invalidOrder.save()).rejects.toThrow();
        });
    });

    describe("References and Relationships", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should populate product references correctly", async () => {
            const product = products[0];

            const order = await Order.create({
                products: [product._id],
                payment: {
                    transaction: { amount: "80.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            const populatedOrder = await Order.findById(order._id).populate("products");

            expect(populatedOrder.products[0].name).toBeDefined();
            expect(populatedOrder.products[0].price).toBeDefined();
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should populate buyer reference correctly", async () => {
            const order = await Order.create({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "80.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            const populatedOrder = await Order.findById(order._id).populate("buyer");

            expect(populatedOrder.buyer.name).toBe(user.name);
            expect(populatedOrder.buyer.email).toBe(user.email);
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should handle references when referenced documents are deleted", async () => {
            const product = products[0];

            const order = await Order.create({
                products: [product._id],
                payment: {
                    transaction: { amount: "80.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            // Delete the product
            await Product.deleteOne({ _id: product._id });

            // Order should still exist with the product ID (orphaned reference)
            const foundOrder = await Order.findById(order._id);
            expect(foundOrder).toBeDefined();
            expect(foundOrder.products).toHaveLength(1);
            expect(foundOrder.products[0].toString()).toBe(product._id.toString());

            // But when populating, the product should be null
            const populatedOrder = await Order.findById(order._id).populate({
                path: "products",
                retainNullValues: true,
            });
            expect(populatedOrder.products[0]).toBeNull();
        });
    });

    describe("Database Persistence", () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it("should persist order data in the database", async () => {
            const orderData = {
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "50.00", method: "bank_transfer", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
                status: "Shipped",
            };

            const createdOrder = await Order.create(orderData);
            const retrievedOrder = await Order.findById(createdOrder._id);

            expect(retrievedOrder).toBeDefined();
            expect(retrievedOrder.payment.transaction.method).toBe("bank_transfer");
            expect(retrievedOrder.status).toBe("Shipped");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should update order status in the database", async () => {
            const order = await Order.create({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "50.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
                status: "Not Process",
            });

            order.status = "Processing";
            await order.save();

            const updatedOrder = await Order.findById(order._id);
            expect(updatedOrder.status).toBe("Processing");
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should update timestamps when modifying an order", async () => {
            const order = await Order.create({
                products: [products[0]._id],
                payment: {
                    transaction: { amount: "10.00", method: "credit_card", status: "submitted_for_settlement" },
                    success: true,
                },
                buyer: user._id,
            });

            const originalUpdatedAt = order.updatedAt;
            const originalCreatedAt = order.createdAt;

            // Wait a small amount of time and update
            await new Promise((resolve) => setTimeout(resolve, 100));

            order.status = "Delivered";
            await order.save();

            const updatedOrder = await Order.findById(order._id);
            expect(updatedOrder.createdAt.getTime()).toBe(originalCreatedAt.getTime());
            expect(updatedOrder.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        });

         //  Sebastian Tay Yong Xun, A0252864X
        it("should create multiple orders and retrieve them all", async () => {
            const orders = [];
            for (let i = 0; i < 3; i++) {
                const order = await Order.create({
                    products: [products[0]._id],
                    payment: {
                        transaction: {
                            amount: `${(20 + i).toFixed(2)}`,
                            method: "credit_card",
                            status: "submitted_for_settlement",
                            orderId: `${i}`,
                        },
                        success: true,
                    },
                    buyer: user._id,
                    status: ["Not Process", "Processing", "Shipped"][i],
                });
                orders.push(order);
            }

            const allOrders = await Order.find({ buyer: user._id });
            expect(allOrders.length).toBeGreaterThanOrEqual(3);
        });
    });
});
