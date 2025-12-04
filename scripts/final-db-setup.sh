#!/bin/bash
# Final database setup script
# This will create the database user and database if they don't exist

echo "Setting up PostgreSQL database for ChatApp..."
echo ""

# Try to create user and database
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'aaa') THEN
    CREATE USER aaa WITH PASSWORD 'aaa' CREATEDB;
    RAISE NOTICE 'User aaa created';
  ELSE
    RAISE NOTICE 'User aaa already exists';
  END IF;
END
\$\$;

-- Create database if not exists  
SELECT 'CREATE DATABASE chatapp OWNER aaa'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'chatapp')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chatapp TO aaa;

\q
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup complete!"
    echo "DATABASE_URL=\"postgresql://aaa:aaa@localhost:5432/chatapp?schema=public\""
else
    echo ""
    echo "❌ Setup failed. You may need to run this manually:"
    echo "sudo -u postgres psql"
    echo "Then run the SQL commands from this script."
fi

