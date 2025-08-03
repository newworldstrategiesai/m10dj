// Script to get your admin user ID and set it in .env.local
// Run with: node set_admin_user_id.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setAdminUserId() {
  // Make sure to set these environment variables first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file first');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Get all users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching users:', authError);
      return;
    }

    const adminEmails = [
      'djbenmurray@gmail.com',  // Ben Murray - Owner
      'admin@m10djcompany.com',
      'manager@m10djcompany.com'
    ];

    // Find admin user
    const adminUser = authUsers.users.find(user => 
      adminEmails.includes(user.email || '')
    );

    if (!adminUser) {
      console.error('No admin user found with emails:', adminEmails);
      console.log('Available users:');
      authUsers.users.forEach(user => {
        console.log(`- ${user.email} (${user.id})`);
      });
      return;
    }

    console.log(`Found admin user: ${adminUser.email}`);
    console.log(`Admin user ID: ${adminUser.id}`);

    // Read current .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';
    
    try {
      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
      }
    } catch (err) {
      console.log('Creating new .env.local file...');
    }

    // Add or update DEFAULT_ADMIN_USER_ID
    const adminUserIdLine = `DEFAULT_ADMIN_USER_ID=${adminUser.id}`;
    
    if (envContent.includes('DEFAULT_ADMIN_USER_ID=')) {
      // Replace existing line
      envContent = envContent.replace(/DEFAULT_ADMIN_USER_ID=.*/g, adminUserIdLine);
    } else {
      // Add new line
      envContent += `\n${adminUserIdLine}\n`;
    }

    // Write back to file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    console.log('✅ Successfully updated .env.local with DEFAULT_ADMIN_USER_ID');
    console.log('🔄 Please restart your development server for changes to take effect');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

setAdminUserId();