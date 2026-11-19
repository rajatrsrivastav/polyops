import * as os from 'node:os';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
let replica: MongoMemoryReplSet;
beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: { version: '7.0.14' },
  });
  await mongoose.connect(replica.getUri(), {
    runtimeAdapters: { os },
    serverSelectionTimeoutMS: 5000,
  });
});
afterEach(async () => {
  if (mongoose.connection.readyState !== 1) return;
  await Promise.all(
    Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})),
  );
});
afterAll(async () => {
  await mongoose.disconnect();
  await replica?.stop();
});

export async function reconnectTestDatabase() {
  await mongoose.connect(replica.getUri(), {
    runtimeAdapters: { os },
    serverSelectionTimeoutMS: 5000,
  });
}
export function testDatabaseUri() {
  return replica.getUri();
}
