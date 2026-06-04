import { config } from '../../config/env.js';

const DOCKER_AUTH_FAILURE_MESSAGE =
  'Authentication failed. Check DB name, login email, and password. The Docker demo expects admin@example.com/admin unless changed during database creation.';

const MODEL_DISCOVERY_TARGETS = [
  { key: 'registrant', label: 'Registrant / beneficiary', configKey: 'openG2PRegistrantModel' },
  { key: 'program', label: 'Program', configKey: 'openG2PProgramModel' },
  { key: 'enrollment', label: 'Enrollment / membership', configKey: 'openG2PEnrollmentModel' },
  { key: 'farm', label: 'Agriculture farm', configKey: 'openG2PFarmModel' },
  { key: 'crop', label: 'Agriculture crop', configKey: 'openG2PCropModel' },
  { key: 'eligibility', label: 'Eligibility check', configKey: 'openG2PEligibilityModel' },
  { key: 'fallback', label: 'Visible fallback', configKey: 'openG2PFallbackModel' },
];

/**
 * Perform a JSON-RPC request to the OpenG2P instance.
 */
async function callOpenG2PRpc(service, method, args) {
  const url = `${config.openG2PUrl}/jsonrpc`;
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
      throw new Error(`OpenG2P RPC Error: ${errorMsg}`);
    }

    return resJson.result;
  } catch (error) {
    throw new Error(`Connection to OpenG2P failed: ${error.message}`);
  }
}

export const openG2PClient = {
  /**
   * Authenticate and return the OpenG2P user ID (uid).
   */
  async authenticate() {
    if (!config.openG2PEnabled) {
      return 1; // Dummy uid for demo mode
    }

    return await callOpenG2PRpc('common', 'authenticate', [
      config.openG2PDb,
      config.openG2PUsername,
      config.openG2PPassword,
      {},
    ]);
  },

  /**
   * Create a registrant or beneficiary in OpenG2P.
   */
  async createRegistrantOrBeneficiary(values) {
    if (!config.openG2PEnabled) {
      return Math.floor(Math.random() * 10000) + 1; // Random ID for demo mode
    }

    const uid = await this.authenticate();
    const model = config.openG2PRegistrantModel;

    return await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      model,
      'create',
      [values],
    ]);
  },

  /**
   * Create or link program in OpenG2P.
   */
  async createProgramEnrollmentMapping(values) {
    if (!config.openG2PEnabled) {
      return Math.floor(Math.random() * 10000) + 1; // Random ID for demo mode
    }

    const uid = await this.authenticate();
    const model = config.openG2PEnrollmentModel;

    return await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      model,
      'create',
      [values],
    ]);
  },

  /**
   * Create entitlement mapping in OpenG2P.
   * This maps the entitlement logic (fertilizer subsidy quantity, status).
   */
  async createEntitlementMapping(values) {
    if (!config.openG2PEnabled) {
      return Math.floor(Math.random() * 10000) + 1; // Random ID for demo mode
    }

    const uid = await this.authenticate();
    // Use program membership model or custom model as available. Default to enrollment model.
    const model = config.openG2PEnrollmentModel;

    return await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      model,
      'create',
      [values],
    ]);
  },

  /**
   * Generic create record method.
   */
  async createRecord(model, values) {
    if (!config.openG2PEnabled) {
      return Math.floor(Math.random() * 10000) + 1; // Random ID for demo mode
    }

    const uid = await this.authenticate();
    return await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      model,
      'create',
      [values],
    ]);
  },

  /**
   * Search and read records from OpenG2P/Odoo.
   */
  async searchRead(model, domain = [], fields = []) {
    if (!config.openG2PEnabled) {
      return [];
    }

    const uid = await this.authenticate();
    if (!uid) {
      throw new Error('Authentication failed');
    }

    return await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      model,
      'search_read',
      [domain],
      { fields },
    ]);
  },

  /**
   * Update records in OpenG2P/Odoo.
   */
  async writeRecord(model, ids, values) {
    if (!config.openG2PEnabled) {
      return true;
    }

    const uid = await this.authenticate();
    if (!uid) {
      throw new Error('Authentication failed');
    }

    const recordIds = Array.isArray(ids) ? ids : [ids];
    return await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      model,
      'write',
      [recordIds, values],
    ]);
  },

  /**
   * Upsert a visible fallback record by ref so repeated demo syncs update instead of duplicate.
   */
  async upsertVisibleFallbackRecord(values, fallbackModel = config.openG2PFallbackModel) {
    const existing = await this.searchRead(fallbackModel, [['ref', '=', values.ref]], ['id', 'name', 'ref']);

    if (existing.length > 0) {
      await this.writeRecord(fallbackModel, existing[0].id, values);
      return {
        action: 'updated',
        id: existing[0].id,
        model: fallbackModel,
        message: 'Updated existing visible OpenG2P fallback record.',
      };
    }

    const id = await this.createRecord(fallbackModel, values);
    return {
      action: 'created',
      id,
      model: fallbackModel,
      message: 'Created new visible OpenG2P fallback record.',
    };
  },

  /**
   * Check if a specific Odoo/OpenG2P model schema exists in the system database.
   */
  async checkModelExists(model) {
    if (!config.openG2PEnabled) {
      return false;
    }
    try {
      const uid = await this.authenticate();
      if (!uid) return false;
      const count = await callOpenG2PRpc('object', 'execute_kw', [
        config.openG2PDb,
        uid,
        config.openG2PPassword,
        'ir.model',
        'search_count',
        [[['model', '=', model]]],
      ]);
      return count > 0;
    } catch (error) {
      return false;
    }
  },

  /**
   * Discover configured OpenG2P/PBMS models and recommend fallback behavior.
   */
  async discoverConfiguredModels() {
    const fallbackModel = config.openG2PFallbackModel;

    if (!config.openG2PEnabled) {
      return {
        enabled: false,
        fallbackModel,
        models: MODEL_DISCOVERY_TARGETS.map((target) => ({
          key: target.key,
          label: target.label,
          modelName: config[target.configKey],
          exists: false,
          fallbackModel: target.key === 'fallback' ? null : fallbackModel,
          recommendedAction: 'Enable OPENG2P_ENABLED=true and rerun discovery against a live OpenG2P/Odoo instance.',
        })),
      };
    }

    const uid = await this.authenticate();
    if (!uid) {
      throw new Error(DOCKER_AUTH_FAILURE_MESSAGE);
    }

    const configuredNames = [...new Set(MODEL_DISCOVERY_TARGETS.map((target) => config[target.configKey]))];
    const rows = await callOpenG2PRpc('object', 'execute_kw', [
      config.openG2PDb,
      uid,
      config.openG2PPassword,
      'ir.model',
      'search_read',
      [[['model', 'in', configuredNames]]],
      { fields: ['model', 'name'] },
    ]);

    const foundModels = new Set(rows.map((row) => row.model));
    const fallbackExists = foundModels.has(fallbackModel);

    return {
      enabled: true,
      fallbackModel,
      models: MODEL_DISCOVERY_TARGETS.map((target) => {
        const modelName = config[target.configKey];
        const exists = foundModels.has(modelName);
        const isFallback = target.key === 'fallback';
        return {
          key: target.key,
          label: target.label,
          modelName,
          exists,
          fallbackModel: isFallback || exists ? null : fallbackModel,
          recommendedAction: exists
            ? 'Use this configured model for live OpenG2P sync.'
            : fallbackExists
              ? `Model not detected. Use visible fallback model ${fallbackModel} for local demo verification.`
              : `Model not detected and fallback model ${fallbackModel} was not detected. Install/configure OpenG2P modules or update env variables.`,
        };
      }),
    };
  },

  /**
   * Check connection to OpenG2P database by trying to authenticate.
   */
  async checkConnection() {
    if (!config.openG2PEnabled) {
      return {
        enabled: false,
        status: 'DISABLED',
        baseUrl: config.openG2PUrl,
        message: 'OpenG2P integration is disabled in configuration',
      };
    }

    try {
      const uid = await callOpenG2PRpc('common', 'authenticate', [
        config.openG2PDb,
        config.openG2PUsername,
        config.openG2PPassword,
        {},
      ]);

      if (uid) {
        return {
          enabled: true,
          status: 'CONNECTED',
          baseUrl: config.openG2PUrl,
          message: 'Connection successful. Authenticated with OpenG2P database.',
        };
      } else {
        return {
          enabled: true,
          status: 'FAILED',
          baseUrl: config.openG2PUrl,
          message: DOCKER_AUTH_FAILURE_MESSAGE,
        };
      }
    } catch (error) {
      const message = error.message?.toLowerCase() || '';
      const isAuthFailure =
        message.includes('authentication') ||
        message.includes('access denied') ||
        message.includes('login failed') ||
        message.includes('invalid credentials');

      return {
        enabled: true,
        status: 'FAILED',
        baseUrl: config.openG2PUrl,
        message: isAuthFailure ? DOCKER_AUTH_FAILURE_MESSAGE : error.message,
      };
    }
  },
};
