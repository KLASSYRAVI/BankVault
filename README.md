# Banking Transaction Management System

## Setup Instructions

### 1. Prerequisites check
- Docker and Docker Compose installed
- JDK 21 (if running backend locally without Docker)
- Node.js 20+ (if running frontend locally without Docker)
- Maven 3.9+ (if running backend locally)

### 2. RSA key generation command for JWT
To generate a secure RSA keypair for JWT signing:
```bash
# Generate private key
openssl genpkey -algorithm RSA -out private.key -pkeyopt rsa_keygen_bits:2048

# Generate public key
openssl rsa -pubout -in private.key -out public.key
```
*(Note: The current backend implementation dynamically generates its own KeyPair in memory via `JwtTokenProvider` to simplify initial startup without file mount configurations, but in production, you would mount the `private.key` file.)*

### 3. Docker-Compose Setup
From the project root (`c:\BankingSystem`):
```bash
docker-compose up --build -d
```
This will start:
- PostgreSQL on port 5432
- Spring Boot Backend on port 8080
- React Frontend on port 3000

### 4. Seed Data Credentials
The database automatically seeds with Flyway migrations (`V2__seed.sql`).
- **Admin**: `admin` / `Admin@123`
- **Customer 1**: `customer1` / `Customer@123`
- **Customer 2**: `customer2` / `Customer@123`

### 5. API Endpoint Reference Table

| Method | Path | Auth Required | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login to get JWT access and refresh tokens |
| POST | `/api/auth/refresh-token` | No (Cookie) | Re-issue tokens using refresh cookie |
| POST | `/api/auth/logout` | No | Clears the refresh token cookie |
| GET | `/api/accounts/my` | CUSTOMER | Retrieve accounts for logged-in user |
| GET | `/api/accounts/{id}/balance` | CUSTOMER | Get current balance of an account |
| DELETE | `/api/accounts/{id}` | ADMIN | Soft-delete/deactivate an account |
| POST | `/api/transactions/transfer` | CUSTOMER | Initate a fund transfer between accounts |
| GET | `/api/transactions/account/{id}` | CUSTOMER | Get paginated/filtered transaction history |
| GET | `/api/transactions/account/{id}/export` | CUSTOMER | Export account transactions as CSV |
| GET | `/api/admin/users` | ADMIN | View all users |
| PUT | `/api/admin/users/{id}/status` | ADMIN | Update active status of a user |
| GET | `/api/admin/transactions` | ADMIN | View all transactions across system |
| GET | `/api/admin/dashboard/stats` | ADMIN | Dashboard stats (system metrics) |

### 6. Running Tests
**Backend Tests:**
```bash
cd backend
mvn test
```

**Frontend Tests:**
```bash
cd frontend
npm install
npm test
```
*(Requires creating standard basic component tests with Vitest inside the frontend package.)*
