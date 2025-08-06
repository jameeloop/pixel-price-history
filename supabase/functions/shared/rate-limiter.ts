
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitEntry {
  id: string;
  ip_address: string;
  endpoint: string;
  request_count: number;
  window_start: string;
  penalty_until?: string;
  created_at: string;
  updated_at: string;
}

export class DatabaseRateLimiter {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async checkRateLimit(
    ipAddress: string, 
    endpoint: string, 
    windowMs: number = 60000, 
    maxRequests: number = 10
  ): Promise<{ allowed: boolean; resetTime?: Date; penaltyUntil?: Date }> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    try {
      // Check for existing penalty
      const { data: penaltyCheck } = await this.supabase
        .from('rate_limits')
        .select('penalty_until')
        .eq('ip_address', ipAddress)
        .eq('endpoint', endpoint)
        .not('penalty_until', 'is', null)
        .gte('penalty_until', now.toISOString())
        .single();

      if (penaltyCheck?.penalty_until) {
        return { 
          allowed: false, 
          penaltyUntil: new Date(penaltyCheck.penalty_until) 
        };
      }

      // Get or create rate limit entry
      const { data: existing } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq('ip_address', ipAddress)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .single();

      if (existing) {
        if (existing.request_count >= maxRequests) {
          // Apply progressive penalty
          const penaltyMinutes = Math.min(existing.request_count - maxRequests + 1, 60);
          const penaltyUntil = new Date(now.getTime() + penaltyMinutes * 60000);
          
          await this.supabase
            .from('rate_limits')
            .update({ 
              penalty_until: penaltyUntil.toISOString(),
              updated_at: now.toISOString()
            })
            .eq('id', existing.id);

          return { 
            allowed: false, 
            penaltyUntil,
            resetTime: new Date(existing.window_start).getTime() + windowMs > now.getTime() 
              ? new Date(new Date(existing.window_start).getTime() + windowMs)
              : undefined
          };
        }

        // Increment counter
        await this.supabase
          .from('rate_limits')
          .update({ 
            request_count: existing.request_count + 1,
            updated_at: now.toISOString()
          })
          .eq('id', existing.id);

        return { allowed: true };
      } else {
        // Create new entry
        await this.supabase
          .from('rate_limits')
          .insert({
            ip_address: ipAddress,
            endpoint: endpoint,
            request_count: 1,
            window_start: now.toISOString()
          });

        return { allowed: true };
      }
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return { allowed: true };
    }
  }

  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    try {
      await this.supabase
        .from('rate_limits')
        .delete()
        .lt('updated_at', cutoff.toISOString());
    } catch (error) {
      console.error('Rate limit cleanup error:', error);
    }
  }
}

// Legacy in-memory fallback for backwards compatibility
const rateLimitStore = new Map<string, { count: number; resetTime: number; penalty?: number }>();

export function checkRateLimit(
  key: string, 
  windowMs: number = 60000, 
  maxRequests: number = 10
): { allowed: boolean; resetTime?: Date } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return { allowed: true };
  }

  if (existing.penalty && now < existing.penalty) {
    return { 
      allowed: false, 
      resetTime: new Date(existing.penalty) 
    };
  }

  if (existing.count >= maxRequests) {
    const penaltyDuration = Math.min((existing.count - maxRequests + 1) * 60000, 3600000);
    existing.penalty = now + penaltyDuration;
    return { 
      allowed: false, 
      resetTime: new Date(existing.penalty) 
    };
  }

  existing.count++;
  return { allowed: true };
}
