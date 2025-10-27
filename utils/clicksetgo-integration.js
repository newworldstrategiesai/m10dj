/**
 * ClickSetGo Integration Utilities
 * 
 * Provides functions to sync data between M10 DJ Company website
 * and the ClickSetGo event planning app
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

/**
 * Configuration for integration
 */
export const IntegrationConfig = {
  // M10 DJ Company (this site)
  m10: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  
  // ClickSetGo App (sister project)
  clicksetgo: {
    url: process.env.CLICKSETGO_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, // Same DB by default
    key: process.env.CLICKSETGO_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    apiUrl: process.env.CLICKSETGO_API_URL || 'https://clicksetgo.app/api',
    apiSecret: process.env.CLICKSETGO_API_SECRET
  },
  
  // Integration settings
  mode: process.env.INTEGRATION_MODE || 'shared_db', // 'shared_db', 'api', 'webhook'
  autoSync: process.env.AUTO_SYNC_ENABLED === 'true'
};

/**
 * Main Integration Class
 */
export class ClickSetGoIntegration {
  constructor(config = IntegrationConfig) {
    this.config = config;
    this.mode = config.mode;
    
    // Initialize Supabase clients
    this.m10Client = createClient(config.m10.url, config.m10.key);
    
    // If using shared database, both clients are the same
    if (this.mode === 'shared_db') {
      this.clickSetGoClient = this.m10Client;
    } else {
      this.clickSetGoClient = createClient(config.clicksetgo.url, config.clicksetgo.key);
    }
  }
  
  /**
   * Sync contact from M10 DJ to ClickSetGo
   */
  async syncContactToClickSetGo(contactId) {
    try {
      console.log(`🔄 Syncing contact ${contactId} to ClickSetGo...`);
      
      // Get contact from M10 DJ database
      const { data: contact, error: fetchError } = await this.m10Client
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!contact) throw new Error('Contact not found');
      
      // Transform M10 contact to ClickSetGo format
      const clickSetGoData = this.transformContactForClickSetGo(contact);
      
      if (this.mode === 'shared_db') {
        // If shared database, just update the record with integration metadata
        const { error: updateError } = await this.m10Client
          .from('contacts')
          .update({
            integration_source: 'm10_dj',
            last_synced_at: new Date().toISOString()
          })
          .eq('id', contactId);
        
        if (updateError) throw updateError;
        
        console.log(`✅ Contact ${contactId} marked as synced (shared DB mode)`);
        return { success: true, method: 'shared_db', contact_id: contactId };
      } else if (this.mode === 'api') {
        // Use API integration
        return await this.syncViaAPI('contact', clickSetGoData);
      } else {
        throw new Error(`Unsupported integration mode: ${this.mode}`);
      }
    } catch (error) {
      console.error(`❌ Error syncing contact ${contactId}:`, error);
      await this.logIntegration({
        source_system: 'm10_dj',
        target_system: 'clicksetgo',
        entity_type: 'contact',
        entity_id: contactId,
        action: 'sync',
        status: 'error',
        error_message: error.message
      });
      throw error;
    }
  }
  
  /**
   * Create event in ClickSetGo when DJ booking is confirmed
   */
  async createEventFromBooking(contactId) {
    try {
      console.log(`🎉 Creating ClickSetGo event for booking ${contactId}...`);
      
      const { data: contact, error: fetchError } = await this.m10Client
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Check if event already exists
      if (contact.clicksetgo_event_id) {
        console.log(`⚠️  Event already exists for contact ${contactId}`);
        return { 
          success: true, 
          event_id: contact.clicksetgo_event_id,
          message: 'Event already exists'
        };
      }
      
      // Create event data
      const eventData = {
        client_name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        client_email: contact.email_address,
        client_phone: contact.phone,
        event_date: contact.event_date,
        event_type: contact.event_type,
        venue_name: contact.venue_name,
        venue_address: contact.venue_address,
        guest_count: contact.guest_count,
        budget: contact.final_price || contact.quoted_price,
        services_booked: ['DJ Services'],
        vendors: {
          dj: {
            company: 'M10 DJ Company',
            contact: 'Ben Murray',
            phone: '(901) 410-2020',
            email: 'm10djcompany@gmail.com',
            confirmed: true,
            price: contact.final_price,
            deposit_paid: contact.deposit_paid,
            payment_status: contact.payment_status
          }
        },
        special_requests: contact.special_requests,
        music_preferences: {
          genres: contact.music_genres,
          first_dance_song: contact.first_dance_song,
          do_not_play: contact.do_not_play_list
        },
        m10_contact_id: contactId,
        source: 'dj_booking',
        created_at: new Date().toISOString()
      };
      
      if (this.mode === 'shared_db') {
        // In shared DB mode, create in a clicksetgo_events table
        const { data: event, error: insertError } = await this.clickSetGoClient
          .from('clicksetgo_events')
          .insert([eventData])
          .select()
          .single();
        
        if (insertError) {
          // If table doesn't exist, just log it
          if (insertError.code === '42P01') {
            console.log('⚠️  clicksetgo_events table not yet created. Skipping event creation.');
            return { success: false, message: 'ClickSetGo events table not configured' };
          }
          throw insertError;
        }
        
        // Link event back to contact
        await this.m10Client
          .from('contacts')
          .update({ 
            clicksetgo_event_id: event.id,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', contactId);
        
        console.log(`✅ Created ClickSetGo event ${event.id} for contact ${contactId}`);
        return { success: true, event_id: event.id, event };
      } else if (this.mode === 'api') {
        return await this.syncViaAPI('event', eventData);
      }
    } catch (error) {
      console.error(`❌ Error creating event for contact ${contactId}:`, error);
      await this.logIntegration({
        source_system: 'm10_dj',
        target_system: 'clicksetgo',
        entity_type: 'event',
        entity_id: contactId,
        action: 'create',
        status: 'error',
        error_message: error.message
      });
      throw error;
    }
  }
  
  /**
   * Sync via API (when using separate databases)
   */
  async syncViaAPI(entityType, data) {
    const url = `${this.config.clicksetgo.apiUrl}/integration/${entityType}`;
    const signature = this.generateSignature(data);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Integration-Signature': signature,
        'X-Integration-Source': 'm10_dj'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API sync failed: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Transform M10 contact to ClickSetGo format
   */
  transformContactForClickSetGo(contact) {
    return {
      m10_contact_id: contact.id,
      name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      email: contact.email_address,
      phone: contact.phone,
      address: contact.address,
      city: contact.city,
      state: contact.state,
      event_date: contact.event_date,
      event_type: contact.event_type,
      venue: contact.venue_name,
      budget: contact.final_price || contact.quoted_price,
      status: this.mapLeadStatusToClickSetGo(contact.lead_status),
      source: 'dj_booking',
      created_at: contact.created_at,
      synced_at: new Date().toISOString()
    };
  }
  
  /**
   * Map M10 lead status to ClickSetGo status
   */
  mapLeadStatusToClickSetGo(leadStatus) {
    const statusMap = {
      'New': 'inquiry',
      'Contacted': 'contacted',
      'Qualified': 'qualified',
      'Proposal Sent': 'proposal',
      'Negotiating': 'negotiating',
      'Booked': 'confirmed',
      'Lost': 'lost',
      'Completed': 'completed'
    };
    return statusMap[leadStatus] || 'inquiry';
  }
  
  /**
   * Generate HMAC signature for API requests
   */
  generateSignature(payload) {
    const secret = this.config.clicksetgo.apiSecret;
    if (!secret) return '';
    
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
  
  /**
   * Log integration activity
   */
  async logIntegration(logData) {
    try {
      await this.m10Client
        .from('integration_logs')
        .insert([{
          ...logData,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      // If integration_logs table doesn't exist, just log to console
      console.error('Integration log error (table may not exist):', error);
    }
  }
  
  /**
   * Get integration statistics
   */
  async getIntegrationStats(hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await this.m10Client
        .from('integration_logs')
        .select('status, action, entity_type')
        .gte('created_at', since);
      
      if (error) throw error;
      
      const stats = {
        total: data.length,
        successful: data.filter(l => l.status === 'success').length,
        failed: data.filter(l => l.status === 'error').length,
        by_entity: {},
        by_action: {}
      };
      
      data.forEach(log => {
        stats.by_entity[log.entity_type] = (stats.by_entity[log.entity_type] || 0) + 1;
        stats.by_action[log.action] = (stats.by_action[log.action] || 0) + 1;
      });
      
      return stats;
    } catch (error) {
      console.error('Error fetching integration stats:', error);
      return null;
    }
  }
}

/**
 * Convenience functions for quick access
 */

// Singleton instance
let integrationInstance = null;

export function getIntegration() {
  if (!integrationInstance) {
    integrationInstance = new ClickSetGoIntegration();
  }
  return integrationInstance;
}

export async function syncContactToClickSetGo(contactId) {
  return await getIntegration().syncContactToClickSetGo(contactId);
}

export async function createClickSetGoEvent(contactId) {
  return await getIntegration().createEventFromBooking(contactId);
}

export async function getIntegrationStats(hours = 24) {
  return await getIntegration().getIntegrationStats(hours);
}

/**
 * Webhook handler for ClickSetGo → M10 DJ sync
 */
export async function handleClickSetGoWebhook(req) {
  const { event_type, data, signature } = req.body;
  
  // Verify signature
  const integration = getIntegration();
  const expectedSignature = integration.generateSignature({ event_type, data });
  
  if (signature !== expectedSignature) {
    throw new Error('Invalid webhook signature');
  }
  
  // Handle different event types
  switch (event_type) {
    case 'event.updated':
      // Update contact with latest event info from ClickSetGo
      if (data.m10_contact_id) {
        await integration.m10Client
          .from('contacts')
          .update({
            notes: `${data.notes || ''}\n\nUpdated from ClickSetGo at ${new Date().toLocaleString()}`,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', data.m10_contact_id);
      }
      break;
    
    case 'event.completed':
      // Mark contact as completed
      if (data.m10_contact_id) {
        await integration.m10Client
          .from('contacts')
          .update({
            lead_status: 'Completed',
            last_synced_at: new Date().toISOString()
          })
          .eq('id', data.m10_contact_id);
      }
      break;
    
    default:
      console.log(`Unknown webhook event type: ${event_type}`);
  }
  
  return { success: true };
}

export default {
  ClickSetGoIntegration,
  getIntegration,
  syncContactToClickSetGo,
  createClickSetGoEvent,
  getIntegrationStats,
  handleClickSetGoWebhook,
  IntegrationConfig
};

