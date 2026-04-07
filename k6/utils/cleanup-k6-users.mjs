import { MongoClient } from "mongodb";

function escapeRegExp(text) {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function parseDateEnv(value, name) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError(`Invalid ${name} value: ${value}`);
  }

  return parsed;
}

function resolveDbName(mongoUrl) {
  const dbNameFromEnv = process.env.DB_NAME?.trim();
  if (dbNameFromEnv) {
    return dbNameFromEnv;
  }

  const parsed = new URL(mongoUrl);
  const pathname = parsed.pathname.replace(/^\//, "").trim();
  return pathname || "test";
}

async function main() {
  const mongoUrl = process.env.MONGO_URL?.trim();
  if (!mongoUrl) {
    throw new Error("MONGO_URL is required.");
  }

  const dbName = resolveDbName(mongoUrl);
  const emailPrefix = process.env.K6_EMAIL_PREFIX?.trim() || "k6-user-";
  const dryRun = process.argv.includes("--dry-run");

  const fromDate = parseDateEnv(process.env.K6_CREATED_FROM, "K6_CREATED_FROM");
  const toDate = parseDateEnv(process.env.K6_CREATED_TO, "K6_CREATED_TO");

  const filter = {
    email: {
      $regex: `^${escapeRegExp(emailPrefix)}`,
    },
  };

  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) {
      filter.createdAt.$gte = fromDate;
    }
    if (toDate) {
      filter.createdAt.$lt = toDate;
    }
  }

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();

    const collection = client.db(dbName).collection("users");
    const totalMatches = await collection.countDocuments(filter);

    console.log(`Database: ${dbName}`);
    console.log(`Email prefix: ${emailPrefix}`);
    console.log(`Matching users: ${totalMatches}`);

    if (dryRun) {
      console.log("Preview mode only. No records deleted.");
      return;
    }

    if (totalMatches === 0) {
      console.log("No matching users found. Nothing deleted.");
      return;
    }

    const result = await collection.deleteMany(filter);
    console.log(`Deleted users: ${result.deletedCount}`);
  } finally {
    await client.close();
  }
}

try {
  await main();
} catch (error) {
  console.error("Cleanup failed:", error.message);
  process.exit(1);
}
