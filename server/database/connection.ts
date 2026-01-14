// MongoDB connection manager
import mongoose from 'mongoose';

export interface DatabaseConfig {
    uri: string;
    dbName: string;
    maxRetries?: number;
    retryDelay?: number;
}

class DatabaseConnection {
    private static instance: DatabaseConnection;
    private isConnected: boolean = false;
    private config: DatabaseConfig | null = null;

    private constructor() {}

    static getInstance(): DatabaseConnection {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }

    /**
     * Connect to MongoDB
     */
    async connect(config: DatabaseConfig): Promise<void> {
        if (this.isConnected) {
            console.log('🔌 Already connected to MongoDB');
            return;
        }

        this.config = config;
        const maxRetries = config.maxRetries || 3;
        const retryDelay = config.retryDelay || 5000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔌 Connecting to MongoDB (attempt ${attempt}/${maxRetries})...`);
                
                await mongoose.connect(config.uri, {
                    dbName: config.dbName,
                    maxPoolSize: 10,
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                });

                this.isConnected = true;
                console.log('✅ Connected to MongoDB successfully');
                
                // Set up connection event handlers
                this.setupEventHandlers();
                return;

            } catch (error) {
                console.error(`❌ MongoDB connection attempt ${attempt} failed:`, error);
                
                if (attempt < maxRetries) {
                    console.log(`⏳ Retrying in ${retryDelay / 1000}s...`);
                    await this.delay(retryDelay);
                } else {
                    throw new Error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
                }
            }
        }
    }

    /**
     * Disconnect from MongoDB
     */
    async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            console.log('🔌 Disconnected from MongoDB');
        } catch (error) {
            console.error('❌ Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    /**
     * Check if connected
     */
    getConnectionStatus(): boolean {
        return this.isConnected && mongoose.connection.readyState === 1;
    }

    /**
     * Get the mongoose connection
     */
    getConnection(): mongoose.Connection {
        return mongoose.connection;
    }

    /**
     * Setup connection event handlers
     */
    private setupEventHandlers(): void {
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
            this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
            this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            this.isConnected = true;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const database = DatabaseConnection.getInstance();
export default database;
