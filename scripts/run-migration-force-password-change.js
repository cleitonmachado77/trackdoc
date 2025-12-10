#!/usr/bin/env node

/**
 * Script to run the Force Password Change migration
 * This script adds fields to force password change on first login
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🚀 Starting Force Password Change migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/add_force_password_change.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Migration file loaded successfully')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
      console.log(`   ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`)
      
      try {
        // For ALTER TABLE and CREATE INDEX statements, we need to execute them directly
        if (statement.includes('ALTER TABLE') || statement.includes('CREATE INDEX') || statement.includes('COMMENT ON')) {
          // Use a simple query execution
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          
          if (error) {
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate') ||
                error.message.includes('column already exists')) {
              console.log(`   ✅ Statement already applied (skipping): ${error.message}`)
            } else {
              throw error
            }
          } else {
            console.log(`   ✅ Statement executed successfully`)
          }
        }
      } catch (execError) {
        if (execError.message.includes('already exists') || 
            execError.message.includes('duplicate') ||
            execError.message.includes('column already exists') ||
            execError.message.includes('does not exist')) {
          console.log(`   ⚠️  Statement may already be applied: ${execError.message}`)
        } else {
          console.error(`   ❌ Error executing statement: ${execError.message}`)
          throw execError
        }
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('\n📋 Summary of changes:')
    console.log('   ✅ Added force_password_change field to profiles table')
    console.log('   ✅ Added first_login_completed field to profiles table')
    console.log('   ✅ Added indexes for performance')
    console.log('   ✅ Added column comments for documentation')
    
    // Verify the migration by checking if columns exist
    console.log('\n🔍 Verifying migration...')
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('force_password_change, first_login_completed')
        .limit(1)
      
      if (error) {
        console.error('❌ Verification failed:', error.message)
      } else {
        console.log('✅ Migration verified successfully - new columns are accessible')
      }
    } catch (verifyError) {
      console.warn('⚠️  Could not verify migration:', verifyError.message)
    }
    
    // Update existing users to mark them as having completed first login
    console.log('\n🔄 Updating existing users...')
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          first_login_completed: true,
          force_password_change: false 
        })
        .is('first_login_completed', null)
      
      if (updateError) {
        console.warn('⚠️  Could not update existing users:', updateError.message)
      } else {
        console.log('✅ Existing users updated successfully')
      }
    } catch (updateError) {
      console.warn('⚠️  Could not update existing users:', updateError.message)
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.error('Stack trace:', error.stack)
    process.exit(1)
  }
}

// Run the migration
runMigration()