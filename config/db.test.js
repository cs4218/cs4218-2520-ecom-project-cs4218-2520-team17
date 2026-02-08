import connectDB from "./db.js";
import mongoose from "mongoose";


jest.mock('mongoose');

// Mock colors by extending String.prototype
jest.mock('colors', () => {
    Object.defineProperty(String.prototype, 'bgMagenta', {
        get() { return this; },
        configurable: true
    });
    Object.defineProperty(String.prototype, 'bgRed', {
        get() { return this; },
        configurable: true
    });
    Object.defineProperty(String.prototype, 'white', {
        get() { return this.toString(); },
        configurable: true
    });
    return {};
});

describe('Connect to mongoose db', () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    
    beforeEach(() => {
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    describe('When connection is successful', () => {
        const mockConnection = {
            connection: {
                host: 'testhost:27017'
            }
        };
        
        beforeEach(() => {
            mongoose.connect.mockResolvedValue(mockConnection);
        });

        it('should connect to MongoDB using the MONGO_URL environment variable', async () => {
            process.env.MONGO_URL = `mongodb://${mockConnection.connection.host}/testdb`;
            
            await connectDB();

            expect(mongoose.connect).toHaveBeenCalledWith(`mongodb://${mockConnection.connection.host}/testdb`);
        });

        it('should log success message with connection host', async () => {
            await connectDB();

            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining(`Connected To Mongodb Database ${mockConnection.connection.host}`)
            );
        });

        it('should call mongoose.connect once', async () => {
            await connectDB();

            expect(mongoose.connect).toHaveBeenCalledTimes(1);
        });
    });

    describe('When connection fails', () => {
        const mockError = new Error('Connection failed');

        beforeEach(() => {
            mongoose.connect.mockRejectedValue(mockError);
        });

        it('should catch and log the error', async () => {
            await connectDB();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in Mongodb')
            );
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining(mockError.toString())
            );
        });

        it('should not throw an error when connection fails', async () => {
            await expect(connectDB()).resolves.toBeUndefined();
        });

        it('should still attempt to connect even if connection fails', async () => {
            await connectDB();

            expect(mongoose.connect).toHaveBeenCalledTimes(1);
        });
    });
});

