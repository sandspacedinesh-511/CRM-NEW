import TeamManagementPage from './TeamManagementPage';

const TelecallerManagement = () => (
  <TeamManagementPage
    role="telecaller"
    title="Telecaller Team"
    description="Manage telecalling team accounts, access levels, and availability."
    addButtonLabel="Add Telecaller"
    emptyStateMessage="No telecallers found yet."
  />
);

export default TelecallerManagement;

