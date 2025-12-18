import { Box, Typography, Container, Avatar } from '@mui/material';

const testimonials = [
  {
    name: "Dr. Emily Rodriguez",
    role: "Director, Global Education Consultants",
    text: "AO Counsellor HUB has reduced our administrative workload by 40% while improving our application success rates.",
    avatar: "/images/testimonials/emily.jpg"
  },
];

export default function Testimonials() {
  return (
    <Box sx={{ py: 8, backgroundColor: 'background.paper' }}>
      <Container maxWidth="md">
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          What Our Clients Say
        </Typography>
        <Box sx={{ mt: 6 }}>
          {testimonials.map((testimonial, index) => (
            <Box key={index} sx={{ mb: 6, textAlign: 'center' }}>
              <Avatar 
                alt={testimonial.name} 
                src={testimonial.avatar} 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto',
                  mb: 2
                }} 
              />
              <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
                "{testimonial.text}"
              </Typography>
              <Typography variant="h6">
                {testimonial.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {testimonial.role}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}