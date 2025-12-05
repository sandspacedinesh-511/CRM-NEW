import TeamManagementPage from './TeamManagementPage';

const MarketingTeamManagement = () => (
  <TeamManagementPage
    role="marketing"
    title="Marketing Team"
    description="Manage marketing team accounts and permissions."
    addButtonLabel="Add Marketing Member"
    emptyStateMessage="No marketing team members found yet."
  />
);

export default MarketingTeamManagement;

