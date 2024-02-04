// worker.go

package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Load environment variables from a .env file in development
	if err := godotenv.Load(); err != nil {
		fmt.Println("Error loading .env file")
	}

	// Replace the hardcoded connection URI with an environment variable
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		fmt.Println("MONGO_URI environment variable not set")
		return
	}

	// Set up MongoDB client
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(mongoURI))
	if err != nil {
		fmt.Println("Error creating MongoDB client:", err)
		return
	}

	// Check MongoDB connection
	err = client.Ping(context.Background(), nil)
	if err != nil {
		fmt.Println("Error pinging MongoDB:", err)
		return
	}
	fmt.Println("Connected to MongoDB")

	// Start background worker using a range loop
	ticker := time.NewTicker(1 * time.Second) // Adjust interval as needed
	defer ticker.Stop()

	for range ticker.C {
		// Fetch and log summary statistics
		count, err := client.Database("backend-test").Collection("users").CountDocuments(context.Background(), bson.D{})
		if err != nil {
			fmt.Println("Error counting documents:", err)
			continue // Continue to the next iteration of the loop
		}
		fmt.Println("Total users:", count)
	}
}
