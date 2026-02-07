import fakeIndexedDB from "fake-indexeddb";
import FDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";

// Set up fake IndexedDB globally
globalThis.indexedDB = fakeIndexedDB;
globalThis.IDBKeyRange = FDBKeyRange;
