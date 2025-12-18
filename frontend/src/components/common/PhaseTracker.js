// src/components/common/PhaseTracker.js
import { Box, Stepper, Step, StepLabel, Typography } from '@mui/material';

const phases = [
  'Document Collection',
  'University Shortlisting',
  'Application Submission',
  'Offer Received',
  'Initial Payment',
  'Interview',
  'Financial/TB Test',
  'CAS Process'
];

function PhaseTracker({ currentPhase }) {
  const activeStep = phases.indexOf(currentPhase);

  return (
    <Box sx={{ width: '100%', my: 4 }}>
      <Typography variant="h6" gutterBottom>Application Progress</Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {phases.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default PhaseTracker;