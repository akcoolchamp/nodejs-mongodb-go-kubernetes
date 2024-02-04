# Use the official Go image as a base image
FROM golang:1.19-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the Go worker code into the container
COPY src/worker.go .

# Copy the .env file into the container
COPY .env .

# Copy the go.mod and go.sum files to download dependencies
COPY go.mod .
COPY go.sum .

# Install required dependencies
RUN go mod download

# Build the Go application
RUN go build -o worker

# Run the Go application when the container starts
CMD ["./worker"]
