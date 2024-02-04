# Problem statement

1. Write a NodeJS + MongoDB app which will create, read, update, and delete user data via REST APIs
2. Implement a worker in Go that periodically processes and logs summary statistics (like count of users) from the database.
3. Implement redis based caching which will ensure that read operations first hits the database, then caches in Redis for subsequent requests.
4. Build a Docker image and deploy it using Kubernetes; verify scalability and access.

# Tech stack

1. NodeJS
2. MongoDB(hosted on Atlas)
3. Redis(hosted on Cloud)
4. Docker
5. Dockerhub(to store images)
6. Kubernetes
7. Swagger

## Libraries/Packages used

### 1. NodeJS

1. [Mongoose](https://www.npmjs.com/package/mongoose) - Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment. Used this to connect and query mongodb from NodeJS.
2. [Redis](https://www.npmjs.com/package/redis) - Redis is a modern, high performance Redis client for Node.js. Used this for connecting redis on cloud.
3. [Express](https://www.npmjs.com/package/express) - Fast, unopinionated, minimalist web framework for Node.js. Used this to create server.
4. [Joi](https://www.npmjs.com/package/joi) - Schema description language and data validator for JavaScript. Used this to validate the incoming input.
5. [Dotenv](https://www.npmjs.com/package/dotenv) - Dotenv is a zero-dependency module that loads environment variables from a .env file into process.env. Used this for fetching the env variables from .env file.

## 2. Go

1. [Dotenv](https://github.com/joho/godotenv) - A Go (golang) port of the Ruby dotenv project (which loads env vars from a .env file). Used this to connect & query mongodb database from Go.
2. [Mongo Driver](https://pkg.go.dev/go.mongodb.org/mongo-driver#section-readme) - The MongoDB supported driver for Go. Used this for fetching the env variables from .env file.

## 3. Deployment

1. [Docker](https://www.docker.com/) - Docker is a platform designed to help developers build, share, and run container applications.
2. [Dockerhub](https://hub.docker.com/) - Docker Hub is a container registry built for developers and open source contributors to find, use, and share container images.
3. [Kubectl] (https://kubernetes.io/docs/reference/kubectl/) - Kubectl is command line tool for communicating with a Kubernetes cluster's control plane, using the Kubernetes API.

# User CRUD Application

The API is written in NodeJS + MongoDB + Redis. It creates, reads, updates, delete users in database. Also caching is implemented in APIs. The application is dockerised. All the setup and run steps are written in Dockerfile. To run it you need to build the container and then run it. You have to navigate to "api" folder and run following commands.

Build:

```
docker build -t akshaylamkhade/api:latest .
```

Run:

```
docker run -d --name node-api -p 3000:3000 akshaylamkhade/api:latest .
```

I have used this commands you can change the configurations. I have referenced the same further.

# Go worker

Go worker runs every minutes and logs the user count from MongoDB database. The worker is also dockerised. All the setup and run steps are written in Dockerfile. To run it you need to build the container and then run it. You have to navigate to "worker" folder and run following commands

Build:

```
docker build -t akshaylamkhade/worker:latest .
```

Run:

```
docker run -d --name go-worker  akshaylamkhade/worker:latest .
```

I have used this commands you can change the configurations. I have referenced the same further.

# Deployment

I have used Dockerhub to store the images build in previous steps. To push an image on Dockerhub, you need to create an account on [Dockerhub](https://hub.docker.com). Below are the commands to push an image on dockerhub,

Dockerhub login:

```
docker login -u <your_user_name>
```

Add your username. After that a prompt will ask for you password. Type the password and hit enter.

Push API image:

```
docker push akshaylamkhade/api:latest

```

Push worker image:

```
docker push akshaylamkhade/worker:latest

```

Now the images are pushed. I enable kubernetes option from the Docker Desktop and installed [kubectl](https://kubernetes.io/docs/reference/kubectl/) command line tool for Kubernetes.
I have implemented the autoscaling for API using HPA(Horizontal Pod Autoscaler). Lets take a look in details

**API deployment configurations**:

```
apiVersion: apps/v1
kind: Deployment
metadata:
 name: api-deployment
 namespace: app-namespace
spec:
 replicas: 3
 selector:
   matchLabels:
     app: api
 template:
   metadata:
     labels:
       app: api
   spec:
     containers:
       - name: nodejs-api
         image: akshaylamkhade/api:latest
         ports:
           - containerPort: 3000
         resources:
           limits:
             cpu: "1"
           requests:
             cpu: "0.5"
```

Pod details:

-   Replicas: 3
-   Container per pod: 1

Description

-   This deployment sets up API with 3 replicas
-   Each pod conatains one container named 'nodejs-api'.
-   This container runs the image 'akshaylamkhade/api:latest' image which is hosted on dockerhub.

**HPA configurations**:

```
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
 name: api-hpa
 namespace: app-namespace
spec:
 scaleTargetRef:
   apiVersion: apps/v1
   kind: Deployment
   name: api-deployment
 minReplicas: 2
 maxReplicas: 6
 metrics:
   - type: Resource
     resource:
       name: cpu
       target:
         type: Utilization
         averageUtilization: 50
```

Description:

-   This HPA dyanmically adjusts the no of replicas for the API deployment based on CPU utilization.
-   It scales between min 2 replicas and max 6 replicas.

**Load Balancing**

```
apiVersion: v1
kind: Service
metadata:
 name: api-service
 namespace: app-namespace
spec:
 selector:
   app: api
 ports:
   - protocol: TCP
     port: 80
     targetPort: 3000
 type: LoadBalancer
```

Description:

-   This acts as a endpoint for accessing the API pods.
-   It routes the incoming traffic on port 80 to port 3000 of pods.

Now to deploy this, navigate to root directory and run the following command

```
kubectl apply -f kubernetes-deployment.yml
```

It will deploy the API with load balancing & auto scaling and go worker.
