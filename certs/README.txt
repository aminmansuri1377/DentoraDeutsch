Download your project's CA certificate from Supabase Database Settings > SSL Configuration.
Save it here as supabase-ca.crt (PEM format).
Set DATABASE_SSL_CA_FILE="./certs/supabase-ca.crt" in .env.
Do not put a private key in this directory.
