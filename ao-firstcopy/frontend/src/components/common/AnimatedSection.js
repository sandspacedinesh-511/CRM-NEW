import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { Box } from '@mui/material';

const AnimatedSection = ({ 
  children, 
  direction = 'up', 
  delay = 0, 
  duration = 0.6,
  threshold = 0.1,
  ...props 
}) => {
  const { ref, isVisible } = useScrollAnimation(threshold);

  const getAnimationStyles = () => {
    const baseStyles = {
      transition: `all ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
      transitionDelay: `${delay}s`,
    };

    if (isVisible) {
      return {
        ...baseStyles,
        opacity: 1,
        transform: 'translateY(0) translateX(0) scale(1)',
      };
    }

    switch (direction) {
      case 'up':
        return {
          ...baseStyles,
          opacity: 0,
          transform: 'translateY(60px)',
        };
      case 'down':
        return {
          ...baseStyles,
          opacity: 0,
          transform: 'translateY(-60px)',
        };
      case 'left':
        return {
          ...baseStyles,
          opacity: 0,
          transform: 'translateX(60px)',
        };
      case 'right':
        return {
          ...baseStyles,
          opacity: 0,
          transform: 'translateX(-60px)',
        };
      case 'scale':
        return {
          ...baseStyles,
          opacity: 0,
          transform: 'scale(0.8)',
        };
      default:
        return {
          ...baseStyles,
          opacity: 0,
          transform: 'translateY(60px)',
        };
    }
  };

  return (
    <Box
      ref={ref}
      sx={getAnimationStyles()}
      {...props}
    >
      {children}
    </Box>
  );
};

export default AnimatedSection;
