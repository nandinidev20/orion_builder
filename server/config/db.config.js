import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Database connection options for connection pooling and performance
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for selecting a server
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      // Additional options for connection management
    };

    // Connect to MongoDB using mongoose
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://shrutigdev2_db_user:qp6WanfpkEG4w2zl@cluster0sample.52xtlvj.mongodb.net/sample?retryWrites=true&w=majority&appName=Cluster0sample', options);
    
    console.log('MongoDB connected successfully');

    // Handle database connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown handling
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Function to handle graceful shutdown
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing database connections...');
  
  try {
    // Close Mongoose connection
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

export default connectDB;
