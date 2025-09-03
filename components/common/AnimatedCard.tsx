import { motion } from 'framer-motion';
import { Card, CardContent, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  title: string;
  value: string | number;
  gradient: string;
  children?: ReactNode;
}

const AnimatedCard = ({ title, value, gradient, children }: AnimatedCardProps) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }}>
      <Card sx={{ 
        background: gradient,
        color: 'white',
        height: '100%',
        minHeight: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h3">
            {value}
          </Typography>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnimatedCard;