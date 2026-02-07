import mongoose from "mongoose";
import colors from "colors";

// Fixes querySrv ECONNREFUSED error by setting custom DNS servers
// Source - https://stackoverflow.com/a/79870831
// Posted by Anderson Goulart
// Retrieved 2026-01-28, License - CC BY-SA 4.0
import dns from 'node:dns';

console.log('Default DNS servers:', dns.getServers());
dns.setServers(['1.1.1.1', '1.0.0.1', '8.8.8.8', '8.8.4.4']);
console.log('Updated DNS servers:', dns.getServers());

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white);
    } catch (error) {
        console.error(`Error in Mongodb ${error}`.bgRed.white);
    }
};

export default connectDB;
