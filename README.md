# Personal Finance Management App

A Next.js application for managing personal finances, budgets, and expenses.

## Features

- User registration and authentication
- Create and manage households
- Create monthly budgets with categories and expense items
- Track expenses against budgets
- Record income by categories
- Dashboard with financial overview and insights
- Multi-currency support (currently GTQ with planned expansion)
- Budget duplication from previous months
- Invite household members to share budgets

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Authentication**: NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Charting**: Recharts (for dashboard visualizations)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Docker and Docker Compose (for local development services)
- PostgreSQL (optional for production)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd finance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   > Note: The Prisma Client will be automatically generated during the installation process via the postinstall script.

3. Start the Docker services (including PostgreSQL):
   ```bash
   npm run services:up
   ```

4. Set up your environment variables:
   Copy the `.env.example` file to `.env.local` and update the values if needed:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/financeapp?schema=public"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

5. Set up the database:
   ```bash
   npm run prisma:migrate
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) with your browser.

### Managing Docker Services

- Start all services:
  ```bash
  npm run services:up
  ```

- View service logs:
  ```bash
  npm run services:logs
  ```

- Stop all services:
  ```bash
  npm run services:down
  ```

- Reset all services (removes data volumes and restarts):
  ```bash
  npm run services:reset
  ```

### Database Management with Prisma

- View and manage database with Prisma Studio:
  ```bash
  npm run prisma:studio
  ```

- Apply database migrations:
  ```bash
  npm run prisma:migrate
  ```

- Generate Prisma Client after schema changes:
  ```bash
  npm run prisma:generate
  ```

- Create a new migration after schema changes:
  ```bash
  npm run prisma:migrate -- --name <migration_name>
  ```

## Project Structure

- `/src/app/(auth)` - Authentication pages (login, register)
- `/src/app/(dashboard)` - Protected dashboard pages
- `/src/app/api` - API routes for data operations
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and libraries
- `/prisma` - Database schema and migrations

## License

This project is licensed under the MIT License.

## Acknowledgements

- Next.js team for the amazing framework
- Prisma team for the ORM
- All open-source libraries and tools used in this project
