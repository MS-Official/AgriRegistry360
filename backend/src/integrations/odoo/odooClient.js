import { config } from '../../config/env.js';

/**
 * Perform a JSON-RPC request to the Odoo instance.
 */
async function callOdooRpc(service, method, args) {
  const url = `${config.odooUrl}/jsonrpc`;
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service,
      method,
      args,
    },
    id: Math.floor(Math.random() * 1000000),
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    const resJson = await response.json();
    if (resJson.error) {
      const errorMsg = resJson.error.data?.message || resJson.error.message || JSON.stringify(resJson.error);
      throw new Error(`Odoo RPC Error: ${errorMsg}`);
    }

    return resJson.result;
  } catch (error) {
    throw new Error(`Connection to Odoo failed: ${error.message}`);
  }
}

export const odooClient = {
  /**
   * Authenticate and return the user ID (uid).
   */
  async authenticate() {
    if (!config.odooEnabled) {
      return 1; // Dummy uid for demo mode
    }

    return await callOdooRpc('common', 'authenticate', [
      config.odooDb,
      config.odooUsername,
      config.odooPassword,
      {},
    ]);
  },

  /**
   * Search and read records from Odoo.
   */
  async searchRead(model, domain = [], fields = []) {
    if (!config.odooEnabled) {
      return []; // Return empty array or mock data for demo mode
    }

    const uid = await this.authenticate();
    if (!uid) {
      throw new Error('Authentication failed');
    }

    return await callOdooRpc('object', 'execute_kw', [
      config.odooDb,
      uid,
      config.odooPassword,
      model,
      'search_read',
      [domain],
      { fields },
    ]);
  },

  /**
   * Create a new record in Odoo.
   */
  async create(model, values) {
    if (!config.odooEnabled) {
      return Math.floor(Math.random() * 10000) + 1; // Random ID for demo mode
    }

    const uid = await this.authenticate();
    if (!uid) {
      throw new Error('Authentication failed');
    }

    return await callOdooRpc('object', 'execute_kw', [
      config.odooDb,
      uid,
      config.odooPassword,
      model,
      'create',
      [values],
    ]);
  },

  /**
   * Update an existing record in Odoo.
   */
  async write(model, ids, values) {
    if (!config.odooEnabled) {
      return true; // Success for demo mode
    }

    const uid = await this.authenticate();
    if (!uid) {
      throw new Error('Authentication failed');
    }

    const recordIds = Array.isArray(ids) ? ids : [ids];

    return await callOdooRpc('object', 'execute_kw', [
      config.odooDb,
      uid,
      config.odooPassword,
      model,
      'write',
      [recordIds, values],
    ]);
  },

  /**
   * Check connection to Odoo database by trying to authenticate.
   */
  async checkConnection() {
    if (!config.odooEnabled) {
      return {
        enabled: false,
        status: 'DISABLED',
        message: 'Odoo integration is disabled in configuration',
      };
    }

    try {
      const uid = await callOdooRpc('common', 'authenticate', [
        config.odooDb,
        config.odooUsername,
        config.odooPassword,
        {},
      ]);

      if (uid) {
        return {
          enabled: true,
          status: 'CONNECTED',
          message: 'Connection successful. Authenticated with Odoo database.',
        };
      } else {
        return {
          enabled: true,
          status: 'FAILED',
          message: 'Authentication failed: Invalid credentials or database name.',
        };
      }
    } catch (error) {
      return {
        enabled: true,
        status: 'FAILED',
        message: error.message,
      };
    }
  },
};
