// Test Supabase PostgreSQL Connection
// Run with: node test-db-connection.js

const { Client } = require('pg');

// IMPORTANT: Replace [YOUR-PASSWORD] with your actual password from Supabase Dashboard
// If password contains @, URL-encode it as %40
const connectionString = 'postgresql://postgres:[YOUR-PASSWORD]@db.zjcutguakjavahdrytxc.supabase.co:5432/postgres?schema=public';

const client = new Client({
  connectionString: connectionString,
});

console.log('Attempting to connect to Supabase...');
console.log('Host: db.zjcutguakjavahdrytxc.supabase.co');
console.log('Port: 5432');
console.log('Database: postgres');
console.log('User: postgres');
console.log('');

client.connect()
  .then(() => {
    console.log('✅ Connection successful!');
    return client.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✅ Query successful!');
    console.log('Current time:', result.rows[0].now);
    client.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('');
    console.error('Possible causes:');
    console.error('1. Supabase project is paused - Check dashboard and resume');
    console.error('2. Network/firewall blocking port 5432');
    console.error('3. Password encoding issue - Try URL-encoded password');
    console.error('4. IP restrictions in Supabase settings');
    client.end();
    process.exit(1);
  });
