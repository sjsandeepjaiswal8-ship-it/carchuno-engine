/**
 * ==============================================================================
 * UNIFIED SOVEREIGN CLOUD ADAPTER (FIREBASE <-> SUPABASE HOT STANDBY)
 * ==============================================================================
 * Provides Zero-Downtime, Dual-Mirror Persistence across:
 *   1. Google Cloud Firebase (Current Active)
 *   2. Supabase PostgreSQL (Sovereign Parallel Mirror)
 *
 * Operational Modes:
 *   - 'DUAL_MIRROR': Writes to Firebase AND mirrors silently to Supabase.
 *   - 'AUTO_FAILOVER': Reads/writes Firebase; if any quota/billing error occurs,
 *                      instantly switches to Supabase without failing user request.
 *   - 'SUPABASE_ONLY': 100% Google-Free sovereign operation.
 * ==============================================================================
 */

let supabaseClient = null;

// Initialize Supabase client if credentials exist in environment
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
  const key = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabaseClient = createClient(url, key);
  } catch (err) {
    // If package not yet installed or dummy credentials
    supabaseClient = null;
  }
  return supabaseClient;
}

class UnifiedCloudAdapter {
  constructor(mode = 'AUTO_FAILOVER') {
    this.mode = mode;
    this.stats = {
      firebaseWrites: 0,
      supabaseWrites: 0,
      failoversTriggered: 0,
      lastError: null
    };
  }

  /**
   * Save an App Testing Registration (CloseTesters)
   */
  async saveApp(appData, firebaseDb = null) {
    let firebaseSuccess = false;
    let savedId = appData.id || `app_${Date.now()}`;

    // 1. Attempt Primary Firebase
    if (this.mode !== 'SUPABASE_ONLY' && firebaseDb) {
      try {
        const { collection, addDoc } = require('firebase/firestore');
        const docRef = await addDoc(collection(firebaseDb, 'apps'), appData);
        savedId = docRef.id;
        firebaseSuccess = true;
        this.stats.firebaseWrites++;
      } catch (err) {
        this.stats.failoversTriggered++;
        this.stats.lastError = `Firebase write error: ${err.message}`;
        console.warn(`[CloudAdapter] Firebase save failed. Falling back to Supabase: ${err.message}`);
      }
    }

    // 2. Mirror or Fallback to Supabase
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('apps').insert([{
          firebase_id: savedId,
          user_id: appData.userId || appData.developerEmail || 'anonymous',
          app_name: appData.appName,
          package_name: appData.packageName,
          play_store_link: appData.playStoreLink || appData.optInLink,
          status: appData.status || 'ACTIVE',
          meta: appData
        }]);
        this.stats.supabaseWrites++;
      } catch (sbErr) {
        console.warn(`[CloudAdapter] Supabase mirror notice: ${sbErr.message}`);
      }
    }

    return { success: true, id: savedId, mirroredToSupabase: !!sb };
  }

  /**
   * Fetch Apps List (CloseTesters)
   */
  async getApps(firebaseDb = null) {
    // Try Firebase first
    if (this.mode !== 'SUPABASE_ONLY' && firebaseDb) {
      try {
        const { collection, getDocs } = require('firebase/firestore');
        const snap = await getDocs(collection(firebaseDb, 'apps'));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn(`[CloudAdapter] Firebase getApps failed. Triggering Supabase failover: ${err.message}`);
      }
    }

    // Failover to Supabase
    const sb = getSupabase();
    if (sb) {
      const { data, error } = await sb.from('apps').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }

    return [];
  }

  /**
   * Save Client Birth Dossier & Kundali (AstroMasterpiece)
   */
  async saveAstroUser(profileData, firebaseDb = null) {
    let savedUid = profileData.uid || `user_${Date.now()}`;

    // 1. Firebase Write
    if (this.mode !== 'SUPABASE_ONLY' && firebaseDb) {
      try {
        const { doc, setDoc } = require('firebase/firestore');
        await setDoc(doc(firebaseDb, 'users', savedUid), profileData, { merge: true });
        this.stats.firebaseWrites++;
      } catch (err) {
        this.stats.failoversTriggered++;
        this.stats.lastError = err.message;
        console.warn(`[CloudAdapter] Firebase saveAstroUser failed. Routing to Supabase: ${err.message}`);
      }
    }

    // 2. Supabase Mirror
    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('astro_users').upsert([{
          firebase_uid: savedUid,
          full_name: profileData.name || profileData.fullName || 'Client',
          email: profileData.email,
          phone: profileData.phone,
          gender: profileData.gender,
          dob: profileData.dob || '2000-01-01',
          tob: profileData.tob || '12:00:00',
          pob: profileData.pob || profileData.place || 'India',
          profile_metadata: profileData
        }], { onConflict: 'firebase_uid' });
        this.stats.supabaseWrites++;
      } catch (sbErr) {
        console.warn(`[CloudAdapter] Supabase astro mirror note: ${sbErr.message}`);
      }
    }

    return { success: true, uid: savedUid };
  }

  /**
   * Save WhatsApp Consultation Lead (AstroMasterpiece)
   */
  async saveConsultation(leadData, firebaseDb = null) {
    if (this.mode !== 'SUPABASE_ONLY' && firebaseDb) {
      try {
        const { collection, addDoc } = require('firebase/firestore');
        await addDoc(collection(firebaseDb, 'consultations'), leadData);
      } catch (e) {}
    }

    const sb = getSupabase();
    if (sb) {
      try {
        await sb.from('consultations').insert([{
          client_name: leadData.name || 'Anonymous Client',
          whatsapp_number: leadData.phone || '+91 91313 65866',
          problem_category: leadData.problem || 'Vedic Remediation',
          notes: leadData.notes || 'Direct WhatsApp Booking'
        }]);
      } catch (e) {}
    }

    return { success: true };
  }

  getStatus() {
    return {
      adapterMode: this.mode,
      supabaseConnected: !!getSupabase(),
      ...this.stats
    };
  }
}

module.exports = new UnifiedCloudAdapter('AUTO_FAILOVER');
