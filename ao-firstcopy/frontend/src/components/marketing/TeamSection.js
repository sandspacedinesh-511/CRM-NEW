import { Box, Typography, Grid, Avatar } from '@mui/material';

const teamMembers = [
  {
    name: "Alex Johnson",
    role: "Founder & CEO",
    bio: "Former educational consultant with 10+ years experience",
    image: "/images/team/alex.jpg"
  },
  {
    name: "Sarah Williams",
    role: "Lead Developer",
    bio: "Full-stack developer specializing in education tech",
    image: "/images/team/sarah.jpg"
  },
  {
    name: "Michael Chen",
    role: "Product Manager",
    bio: "Passionate about creating intuitive user experiences",
    image: "/images/team/michael.jpg"
  }
];

function TeamSection() {
  return (
    <Box sx={{ my: 8 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Our Team
      </Typography>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        {teamMembers.map((member, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Box textAlign="center">
              <Avatar 
                alt={member.name} 
                src={member.image} 
                sx={{ 
                  width: 150, 
                  height: 150, 
                  mx: 'auto',
                  mb: 2
                }} 
              />
              <Typography variant="h6" gutterBottom>
                {member.name}
              </Typography>
              <Typography color="primary" gutterBottom>
                {member.role}
              </Typography>
              <Typography variant="body2">
                {member.bio}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default TeamSection;