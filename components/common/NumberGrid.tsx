import { Box } from '@mui/material';
import { motion } from 'framer-motion';

interface NumberGridProps {
  numbers: number[];
  calledNumbers: string[];
  currentNumber: string;
}

const NumberGrid = ({ numbers, calledNumbers, currentNumber }: NumberGridProps) => {
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
      gap: 1,
      mb: 4,
      p: 2,
      background: 'rgba(0,0,0,0.05)',
      borderRadius: 2
    }}>
      {numbers.map(num => {
        const isCalled = calledNumbers.some(n => n.endsWith(`-${num}`));
        return (
          <motion.div
            key={num}
            animate={{
              scale: isCalled && currentNumber.endsWith(`-${num}`) ? [1, 1.2, 1] : 1,
              backgroundColor: isCalled ? '#4CAF50' : '#f5f5f5'
            }}
            transition={{ duration: 0.5 }}
          >
            <Box
              sx={{
                p: 1,
                textAlign: 'center',
                borderRadius: 1,
                color: isCalled ? 'white' : 'text.primary',
                fontWeight: isCalled ? 'bold' : 'normal'
              }}
            >
              {num}
            </Box>
          </motion.div>
        );
      })}
    </Box>
  );
};

export default NumberGrid;