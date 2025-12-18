import axiosInstance from '../utils/axios';

const rolePathMap = {
  telecaller: 'telecallers',
  marketing: 'marketing-team',
  b2b_marketing: 'b2b-marketing-team'
};

const resolvePath = (role) => {
  const path = rolePathMap[role];
  if (!path) {
    throw new Error(`Unsupported role: ${role}`);
  }
  return path;
};

export const fetchTeamMembers = async (role) => {
  const response = await axiosInstance.get(`/admin/${resolvePath(role)}`);
  return response.data;
};

export const createTeamMember = async (role, payload) => {
  const response = await axiosInstance.post(`/admin/${resolvePath(role)}`, payload);
  return response.data;
};

export const updateTeamMember = async (role, id, payload) => {
  const response = await axiosInstance.put(`/admin/${resolvePath(role)}/${id}`, payload);
  return response.data;
};

export const updateTeamMemberStatus = async (role, id, active) => {
  const response = await axiosInstance.patch(`/admin/${resolvePath(role)}/${id}/status`, { active });
  return response.data;
};

export const deleteTeamMember = async (role, id) => {
  const response = await axiosInstance.delete(`/admin/${resolvePath(role)}/${id}`);
  return response.data;
};

// Admin: fetch all counselors (independent of rolePathMap)
export const fetchCounselors = async () => {
  const response = await axiosInstance.get('/admin/counselors');
  return response.data;
};

// Admin view: telecaller dashboard/queue for a specific telecaller
export const fetchTelecallerDashboardAdmin = async (telecallerId) => {
  const response = await axiosInstance.get(`/admin/telecallers/${telecallerId}/dashboard`);
  return response.data;
};

// Admin view: leads for a specific marketing team member
export const fetchMarketingMemberLeads = async (memberId, params = {}) => {
  const response = await axiosInstance.get(`/admin/marketing-team/leads/${memberId}`, {
    params
  });
  return response.data;
};

// Admin view: leads for a specific B2B marketing team member
export const fetchB2BMarketingMemberLeads = async (memberId, params = {}) => {
  const response = await axiosInstance.get(`/admin/b2b-marketing-team/leads/${memberId}`, {
    params
  });
  return response.data;
};

// Admin: assign a lead to a counselor
export const assignLeadToCounselor = async (leadId, counselorId) => {
  // Lead IDs correspond to Student IDs, so we use the students alias route
  const response = await axiosInstance.patch(`/admin/students/${leadId}/assign-counselor`, {
    counselorId
  });
  return response.data;
};

// Admin: assign a telecaller-imported lead to a counselor
export const assignTelecallerImportedLeadToCounselor = async (telecallerId, leadId, counselorId) => {
  const response = await axiosInstance.post(
    `/admin/telecallers/${telecallerId}/imported-leads/${leadId}/assign-counselor`,
    { counselorId }
  );
  return response.data;
};

