// InfoTally API Service Gateway
// Centralizes all backend integrations to simplify server communication

const API_BASE_URL = 'http://localhost:5000/api';

export const apiService = {
  /**
   * Submits a request for access to the backend database
   * Maps legacy landing page fields to match the database schema
   */
  async requestAccess(data) {
    // Map fields for backward compatibility with landing page CTA modal (which uses name/role)
    const payload = {
      fullName: data.fullName || data.name,
      institution: data.institution,
      department: data.department || 'General Academic',
      designation: data.designation || data.role || 'Teacher',
      email: data.email,
      phone: data.phone || '',
      purpose: data.purpose || 'Workspace Coordination',
      description: data.description || 'Access requested via InfoTally landing page portal.'
    };

    try {
      const response = await fetch(`${API_BASE_URL}/request-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] requestAccess error:', error);
      return { 
        success: false, 
        message: 'Unable to reach the server. Please verify your internet connection.' 
      };
    }
  },

  /**
   * Authenticate user credentials
   */
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] Login error:', error);
      return { success: false, message: 'Server connection failed.' };
    }
  },

  /**
   * Force update password on first login
   */
  async changePassword(currentPassword, newPassword, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] changePassword error:', error);
      return { success: false, message: 'Server connection failed.' };
    }
  },

  /**
   * Get Google Integration status
   */
  async getGoogleIntegrationStatus(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/status/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getGoogleIntegrationStatus error:', error);
      return { connected: false };
    }
  },

  /**
   * Disconnect Google Integration
   */
  async disconnectGoogleIntegration(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/disconnect/${projectId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] disconnectGoogleIntegration error:', error);
      return { success: false, message: 'Failed to disconnect.' };
    }
  },

  /**
   * Get User Google Connection Status
   */
  async getUserGoogleStatus(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/user-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getUserGoogleStatus error:', error);
      return { connected: false };
    }
  },

  /**
   * Disconnect User Google Integration
   */
  async disconnectUserGoogle(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/disconnect-user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] disconnectUserGoogle error:', error);
      return { success: false, message: 'Failed to disconnect user.' };
    }
  },

  /**
   * Get list of Google Forms
   */
  async getGoogleForms(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/forms/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getGoogleForms error:', error);
      return { success: false, message: 'Failed to fetch forms.' };
    }
  },

  /**
   * Connect a specific Google Form
   */
  async connectGoogleForm(projectId, formId, formTitle, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/forms/connect/${projectId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formId, formTitle })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] connectGoogleForm error:', error);
      return { success: false, message: 'Failed to connect form.' };
    }
  },

  /**
   * Get Google Form Schema Questions
   */
  async getGoogleFormSchema(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/forms/${projectId}/schema`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getGoogleFormSchema error:', error);
      return { success: false, message: 'Failed to retrieve form schema.' };
    }
  },

  /**
   * Set Primary Key for Project
   */
  async setProjectPrimaryKey(projectId, primaryKeyColumn, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/forms/${projectId}/primary-key`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ primaryKeyColumn })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] setProjectPrimaryKey error:', error);
      return { success: false, message: 'Failed to save primary key.' };
    }
  },

  /**
   * Synchronize Google Form Responses
   */
  async syncGoogleFormResponses(projectId, strategy, token) {
    console.log('[Frontend]\nSync Started');
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/forms/${projectId}/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ strategy })
      });
      console.log(`[Frontend] HTTP Status: ${response.status}`);
      const data = await response.json();
      console.log('[Frontend] Returned JSON:', data);
      return data;
    } catch (error) {
      console.log('[Frontend]\nRequest failed', error);
      console.error('[API Service] syncGoogleFormResponses error:', error);
      return { success: false, message: 'Failed to sync responses.' };
    }
  },

  /**
   * Fetch All Extracted Project Records & Columns
   */
  async getProjectRecords(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/google/forms/${projectId}/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getProjectRecords error:', error);
      return { success: false, message: 'Failed to retrieve records.' };
    }
  },

  /**
   * Get Microsoft Integration status
   */
  async getMicrosoftIntegrationStatus(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/status/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getMicrosoftIntegrationStatus error:', error);
      return { connected: false };
    }
  },

  /**
   * Disconnect Microsoft Integration
   */
  async disconnectMicrosoftIntegration(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/disconnect/${projectId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] disconnectMicrosoftIntegration error:', error);
      return { success: false, message: 'Failed to disconnect.' };
    }
  },

  /**
   * Get User Microsoft Connection Status
   */
  async getUserMicrosoftStatus(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/user-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getUserMicrosoftStatus error:', error);
      return { connected: false };
    }
  },

  /**
   * Disconnect User Microsoft Integration
   */
  async disconnectUserMicrosoft(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/disconnect-user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] disconnectUserMicrosoft error:', error);
      return { success: false, message: 'Failed to disconnect user.' };
    }
  },

  /**
   * Get list of Microsoft Forms (Excel Workbooks)
   */
  async getMicrosoftForms(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/forms/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getMicrosoftForms error:', error);
      return { success: false, message: 'Failed to fetch forms.' };
    }
  },

  /**
   * Connect a specific Microsoft Form
   */
  async connectMicrosoftForm(projectId, formId, formTitle, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/forms/connect/${projectId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ formId, formTitle })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] connectMicrosoftForm error:', error);
      return { success: false, message: 'Failed to connect form.' };
    }
  },

  /**
   * Get Microsoft Form Schema Questions
   */
  async getMicrosoftFormSchema(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/forms/${projectId}/schema`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getMicrosoftFormSchema error:', error);
      return { success: false, message: 'Failed to retrieve form schema.' };
    }
  },

  /**
   * Set Microsoft Primary Key for Project
   */
  async setMicrosoftProjectPrimaryKey(projectId, primaryKeyColumn, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/forms/${projectId}/primary-key`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ primaryKeyColumn })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] setMicrosoftProjectPrimaryKey error:', error);
      return { success: false, message: 'Failed to save primary key.' };
    }
  },

  /**
   * Synchronize Microsoft Form Responses
   */
  async syncMicrosoftFormResponses(projectId, strategy, token) {
    console.log('[Frontend]\nMicrosoft Sync Started');
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/forms/${projectId}/sync`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ strategy })
      });
      console.log(`[Frontend] HTTP Status: ${response.status}`);
      const data = await response.json();
      console.log('[Frontend] Returned JSON:', data);
      return data;
    } catch (error) {
      console.log('[Frontend]\nRequest failed', error);
      console.error('[API Service] syncMicrosoftFormResponses error:', error);
      return { success: false, message: 'Failed to sync responses.' };
    }
  },

  /**
   * Fetch All Extracted Project Records & Columns for Microsoft
   */
  async getMicrosoftProjectRecords(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/integrations/microsoft/forms/${projectId}/records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getMicrosoftProjectRecords error:', error);
      return { success: false, message: 'Failed to retrieve records.' };
    }
  },

  /**
   * Fetch admin metrics
   */
  async getMetrics(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/metrics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getMetrics error:', error);
      return { success: false, message: 'Failed to retrieve dashboard metrics.' };
    }
  },

  /**
   * Fetch all access requests
   */
  async getRequests(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getRequests error:', error);
      return { success: false, message: 'Failed to retrieve requests.' };
    }
  },

  /**
   * Fetch all users
   */
  async getUsers(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getUsers error:', error);
      return { success: false, message: 'Failed to retrieve user listing.' };
    }
  },

  /**
   * Fetch all activity logs
   */
  async getLogs(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] getLogs error:', error);
      return { success: false, message: 'Failed to retrieve activity log.' };
    }
  },

  /**
   * Approve pending request
   */
  async approveRequest(id, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] approveRequest error:', error);
      return { success: false, message: 'Failed to approve request.' };
    }
  },

  /**
   * Reject pending request
   */
  async rejectRequest(id, reason, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/requests/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ reason })
      });
      return await response.json();
    } catch (error) {
      console.error('[API Service] rejectRequest error:', error);
      return { success: false, message: 'Failed to reject request.' };
    }
  },

  /**
   * Export project data to Excel
   */
  async exportProjectExcel(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/export/excel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to export Excel.');
      }
      return await response.blob();
    } catch (error) {
      console.error('[API Service] exportProjectExcel error:', error);
      throw error;
    }
  },

  /**
   * Export project data to PDF
   */
  async exportProjectPdf(projectId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/export/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to export PDF.');
      }
      return await response.blob();
    } catch (error) {
      console.error('[API Service] exportProjectPdf error:', error);
      throw error;
    }
  },

  /**
   * Check health of server database
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      return { status: 'offline', error: error.message };
    }
  }
};
