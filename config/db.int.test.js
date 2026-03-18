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
});

