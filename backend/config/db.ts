import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI ||
        (() => {
          throw new Error('MONGO_URI is not set');
        })(),
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on('error', (err: any) => {
      console.error(`MongoDB connection error: ${err.message || err}`);
    });
  } catch (error: any) {
    console.error(`Error: ${error.message || error}`);
    process.exit(1);
  }
};

module.exports = connectDB;
