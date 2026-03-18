import connectDB from "./db.js";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

describe("connectDB Integration Tests", () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    let mongod = null;

    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(async () => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongod) {
            await mongod.stop();
            mongod = null;
        }
    });

    describe("When connection is successful", () => {
        beforeEach(async () => {
            mongod = await MongoMemoryServer.create();
            process.env.MONGO_URL = mongod.getUri();
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should connect to MongoDB using the MONGO_URL environment variable", async () => {
            await connectDB();

            const host = mongoose.connection.host;

            // A readyState of 1 means mongoose is fully connected to the URI in MONGO_URL
            expect(mongoose.connection.readyState).toBe(1);
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Connected To Mongodb Database ${host}`)
            );
        });
    });

    describe("When connection fails", () => {
        beforeEach(() => {
            // Use an unreachable host with a short serverSelectionTimeoutMS so the test fails fast
            process.env.MONGO_URL = "mongodb://127.0.0.1:27999/?serverSelectionTimeoutMS=500";
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should catch and log the error", async () => {
            await connectDB();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error in Mongodb")
            );
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it("should not establish a connection when the host is unreachable", async () => {
            await connectDB();

            expect(mongoose.connection.readyState).not.toBe(1);
        });
    });
});

