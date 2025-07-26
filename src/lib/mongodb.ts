import { MongoClient, Db, GridFSBucket } from 'mongodb';
import * as Grid from 'gridfs-stream';

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/your-db";

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let gfs: Grid.Grid;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
    global._mongoClientPromise.then(client => {
      const db = client.db();
      gfs = Grid(db, require('mongodb'));
      gfs.collection('uploads');
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
  clientPromise.then(client => {
    const db = client.db();
    gfs = Grid(db, require('mongodb'));
    gfs.collection('uploads');
  });
}

export { clientPromise, gfs };
