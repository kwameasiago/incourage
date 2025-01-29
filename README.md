# **Running the App Locally Using Docker and Docker Compose**

  

## **1. Install Docker and Docker Compose**

Before running the application, ensure Docker and Docker Compose are installed on your system.

  

### **For Linux (Ubuntu/Debian)**

1. **Update package index and install dependencies**

```bash

sudo apt update

sudo apt install ca-certificates curl gnupg

```

  

2. **Add Docker's official GPG key**

```bash

sudo install -m 0755 -d /etc/apt/keyrings

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc > /dev/null

sudo chmod a+r /etc/apt/keyrings/docker.asc

```

  

3. **Set up the repository**

```bash

echo \

"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \

$(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update

```

  

4. **Install Docker Engine and Docker Compose**

```bash

sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

```

  

5. **Verify installation**

```bash

docker --version

docker compose version

```

  

6. **Add user to the Docker group (optional, allows running Docker without `sudo`)**

```bash

sudo usermod -aG docker $USER

newgrp docker

```

  

### **For macOS (using Homebrew)**

1. **Install Docker**

```bash

brew install --cask docker

```

  

2. **Start Docker**

Open the Docker Desktop application.

  

3. **Verify installation**

```bash

docker --version

docker compose version

```

  

### **For Windows (using WSL 2)**

1. **Download and install Docker Desktop from [Docker’s official website](https://www.docker.com/products/docker-desktop/)**

2. **Enable WSL 2 backend (recommended)**

3. **Restart your system after installation**

4. **Verify installation**

```powershell

docker --version

docker compose version

```

  

---

  

## **2. Clone the Repository**

If you haven't already cloned the project, do so with:

```bash

git clone git@github.com:kwameasiago/incourage.git

cd incourage

```

  

---

  

## **3. Set Up Environment Variables**

Ensure your `.env.local` file is properly set up inside the root project directory. Your `.env.local` should look like this:

  

```plaintext

# For API Service

DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>

  

# For DB Service

POSTGRES_DB=<database>

POSTGRES_USER=<user>

POSTGRES_PASSWORD=<password>

POSTGRES_HOST=<host>

POSTGRES_TYPE=<user>

POSTGRES_PORT=<port>

  
# AWS
AWS_ACCESS_KEY=<aws_access_key>

AWS_SECRET_KEY=<aws_secret_key>

S3_BUCKET_NAME=<bucket_name>

NODE_ENV=<node_env>

```

  

---

  

## **4. Build and Start the Containers**

Run the following command to start your services:

```bash

docker compose -f docker-compose.dev.yml up --build

```

  

This command:

- Builds the API service

- Starts the database service

- Attaches the API service to the `incourage-dev` network

  

---

  

## **5. Verify Running Containers**

Once the containers are running, check their status:

```bash

docker ps

```

You should see both `api` and `db` containers running.

  

---

  

## **6. Access the Running Application**

- The **API Service** should be running on port specified in env file  `http://localhost:<port>

- The **Database (PostgreSQL)** should be available on port specified in env file `localhost:<port>`

  

If using a database client (like **pgAdmin** or **DBeaver**), connect using:

- **Host:** `localhost`

- **Port:** `<port>`

- **User:** `<user>`

- **Password:** `<password>`

- **Database:** `<database>`

  NB: if connecting outside the container reference the port mapping on docker compose file

---

  

## **7. Running Database Migrations (If `NODE_ENV` is not `development`)**

If the environment is set to `production`, you need to manually sync the database schema.

  

### **Step 1: Access the Running Container**

Run the following command to enter the `api` container:

```bash

docker exec -it your_project_api_1 sh

```

Alternatively, if you don’t know the container name, run:

```bash

docker ps

```

Then, use the container ID or name:

```bash

docker exec -it <container_id> sh

```

  

### **Step 2: Run Database Synchronization**

Inside the container, run:

```bash

npx run typeorm:sync -d src/config/data-source.ts

```

  

This will ensure all entities and database migrations are applied.

  

### **Step 3: Exit the Container**

After running the migration, exit the shell:

```bash

exit

```

  

---

  

## **8. Stopping the Containers**

To stop the running containers, use:

```bash

docker compose -f docker-compose.dev.yml down

```

  

If you want to stop and remove the containers, networks, and volumes:

```bash

docker compose -f docker-compose.dev.yml down -v

```

  

---

  

## **9. Restarting the Application**

To restart the application after stopping it:

```bash

docker compose -f docker-compose.dev.yml up

```

  

---

  

## **10. Debugging Issues**

If you face any issues:

- Check container logs:

```bash

docker-compose -f docker-compose.dev.yml logs 

```

- Rebuild containers:

```bash

docker compose -f docker-compose.dev.yml up --build --force-recreate

```

- Ensure the `.env.local` file exists and is correctly formatted.

  

---

  

## **Summary of Commands**

| Task                                      | Command |
|-------------------------------------------|----------------------------------------------|
| Install Docker (Linux)                    | See section 1 |
| Start containers                          | `docker compose -f docker-compose.dev.yml up --build` |
| Check running containers                  | `docker ps` |
| Enter API container                       | `docker exec -it your_project_api_1 sh` |
| Run database sync (if `NODE_ENV` != dev)  | `npm run typeorm:sync` or `npx prisma migrate deploy` |
| Exit the container                        | `exit` |
| Stop containers                           | `docker compose -f docker-compose.dev.yml down` |
| Stop and remove volumes                   | `docker compose -f docker-compose.dev.yml down -v` |
| Restart application                       | `docker compose -f docker-compose.dev.yml up` |
| Check container logs                      | `docker logs your_project_api_1` |



## **CI/CD Workflow**

### **1. Continuous Integration (CI)**

#### **Trigger Conditions**

The CI process runs:

- When a **pull request (PR) is opened or updated** on `main`.
- When **code is pushed to `main`** (for automatic deployment).

#### **Steps in CI**

1. **Checkout the repository** to access the latest code.
2. **Set up Docker** to create a containerized environment.
3. **Build the application** using Docker Compose.
4. **Run the application** inside a Docker container.
5. **Execute unit tests** to verify code correctness.
6. **Execute end-to-end (E2E) tests** to validate full application functionality.
7. If all tests **pass**, the **container is stopped and removed**.

---

### **2. Continuous Deployment (CD)**

#### **Production Deployment Process**

- Once the code is merged into `main`, the deployment process starts.
- The application is hosted on a **DigitalOcean Droplet**.
- **Caddy** acts as a **reverse proxy** and handles **SSL termination**.
- The latest changes are pulled and the application is restarted inside a **Docker container**.

#### **Deployment Steps**

1. **SSH into the production server** (DigitalOcean Droplet).
2. **Pull the latest changes** from the repository.
3. **Rebuild and restart the application** using Docker Compose.
4. **Ensure the app is accessible via Caddy**, which serves as the web server.
