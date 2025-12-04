# Chat App MVP

A real-time chat application built with Next.js, WebSockets, Prisma, and PostgreSQL.

## Features

- JWT authentication (email/password)
- Real-time messaging via WebSocket
- Online/offline user status
- Persistent chat history
- User list with online status indicators

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **WebSocket**: ws library (separate server)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken + bcryptjs)

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/chatapp?schema=public"
   JWT_SECRET="your-secret-key-change-in-production"
   WS_PORT=3001
   NEXT_PUBLIC_WS_URL="ws://localhost:3001"
   ```

3. **Set up the database:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development servers:**

   Terminal 1 - Next.js app:

   ```bash
   npm run dev
   ```

   Terminal 2 - WebSocket server:

   ```bash
   npm run ws:dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ChatApp/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes
│   ├── chat/              # Chat pages
│   ├── api/               # API routes
│   └── layout.tsx
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities
├── server/                # WebSocket server
└── prisma/                # Prisma schema
```

## Usage

1. Sign up with email and password (or login if you already have an account)
2. View the list of users (online/offline status shown)
3. Click on a user to start a chat session
4. Send and receive messages in real-time
5. Chat history is saved in the database

## Development

- `npm run dev` - Start Next.js dev server
- `npm run ws:dev` - Start WebSocket server in watch mode
- `npm run build` - Build for production
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio

## Notes

- The WebSocket server runs on port 3001 by default
- The Next.js app runs on port 3000 by default
- Make sure both servers are running for full functionality
# ChatApp
