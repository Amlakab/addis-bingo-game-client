// components/ui/HowToPlayModal.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Dialog,
  DialogContent
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Image from 'next/image';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
  language?: 'en' | 'am';
}

// Define the Step type with optional note
interface StepType {
  step: number;
  title: string;
  text: string;
  file: string;
  alt: string;
  note?: string; // Make note optional
}

// Deposit Steps (replaces AccessSteps)
const DepositSteps: { en: StepType[]; am: StepType[] } = {
  en: [
    { 
      step: 1, 
      title: "Start Deposit", 
      text: "Click the 'Deposit' button from the main menu.",
      file: "/register_select.jpg", 
      alt: "Deposit Button" 
    },
     { 
      step: 2, 
      title: "Choose Payment Method", 
      text: "Select your preferred payment method: Telebirr or CBE Birr.",
      file: "/payment_select.jpg", 
      alt: "Payment Method" 
    },
    { 
      step: 3, 
      title: "Enter Amount", 
      text: "Enter the amount you wish to deposit (Minimum: 10 ETB). Deposits above 50 ETB receive a bonus!",
      file: "/amount_select.jpg", 
      alt: "Enter Amount" 
    },
    { 
      step: 4, 
      title: "Transfer Funds", 
      text: "Transfer the exact amount to the provided account details. You'll receive a transaction reference via SMS.",
      file: "/message.jpg", 
      alt: "Transfer Funds" 
    },
    { 
      step: 5, 
      title: "Submit Transaction ID", 
      text: "Copy and paste the transaction ID you received via SMS to complete the deposit process.",
      file: "/transaction_select.jpg", 
      alt: "Submit Transaction" 
    }
  ],
  am: [
    { 
      step: 1, 
      title: "ገንዘብ ማስገባት ይጀምሩ", 
      text: "ከዋና ማውጫ 'ገንዘብ አስገባ' የሚለውን ቁልፍ ይጫኑ።",
      file: "/register_select.jpg", 
      alt: "ገንዘብ ማስገቢያ ቁልፍ" 
    },
    { 
      step: 2, 
      title: "የክፍያ አይነት ይምረጡ", 
      text: "የሚመርጡትን የክፍያ አይነት ይምረጡ: ቴሌብር ወይም ሲቢኢ ብር።",
      file: "/payment_select.jpg", 
      alt: "የክፍያ አይነት" 
    },
    { 
      step: 3, 
      title: "መጠን ያስገቡ", 
      text: "ማስገባት የሚፈልጉትን መጠን ያስገቡ (አነስተኛ: 10 ብር)። ከ 50 ብር በላይ ሲያስገቡ ቦነስ ያገኛሉ!",
      file: "/amount_select.jpg", 
      alt: "መጠን ማስገቢያ" 
    },
    { 
      step: 4, 
      title: "ገንዘብ ያስተላልፉ", 
      text: "በተሰጠው የሂሳብ ዝርዝር ላይ ትክክለኛውን መጠን ያስተላልፉ። የግብይት መለያ ቁጥር በኤስኤምኤስ ይደርስዎታል።",
      file: "/message.jpg", 
      alt: "ገንዘብ ማስተላለፍ" 
    },
    { 
      step: 5, 
      title: "የግብይት መለያ ያስገቡ", 
      text: "በኤስኤምኤስ የደረሰውን የግብይት መለያ ቁጥር ኮፒ አድርገው ያስገቡ።",
      file: "/transaction_select.jpg", 
      alt: "የግብይት መለያ ማስገቢያ" 
    }
  ]
};

// Withdrawal Steps (replaces AccessSteps)
const WithdrawalSteps: { en: StepType[]; am: StepType[] } = {
  en: [
    { 
      step: 1, 
      title: "Start Withdrawal", 
      text: "Click the 'Withdraw' button from the main menu.",
      file: "/withdrowal_select.jpg", 
      alt: "Withdraw Button" 
    },
    { 
      step: 2, 
      title: "Choose Payment Method", 
      text: "Select your preferred withdrawal method: Telebirr or CBE Birr.",
      file: "/withdrowal_payment.jpg", 
      alt: "Payment Method" 
    },
    { 
      step: 3, 
      title: "Enter Amount", 
      text: "Enter the amount you wish to withdraw (Minimum: 100 ETB).",
      file: "/withdrowal_amount.jpg", 
      alt: "Enter Amount" 
    },
    { 
      step: 4, 
      title: "Enter Account Details", 
      text: "Enter your Telebirr phone number or bank account number where the funds should be sent.",
      file: "/withdrowal_account.jpg", 
      alt: "Account Details" 
    },
    { 
      step: 5, 
      title: "Enter Account Holder Name", 
      text: "Enter the full name of the account holder to complete the withdrawal request.",
      file: "/withdrowal_holdername.jpg", 
      alt: "Account Holder Name" 
    }
  ],
  am: [
    { 
      step: 1, 
      title: "ገንዘብ ማውጣት ይጀምሩ", 
      text: "ከዋና ማውጫ 'ገንዘብ አውጣ' የሚለውን ቁልፍ ይጫኑ።",
      file: "/withdrowal_select.jpg", 
      alt: "ገንዘብ ማውጫ ቁልፍ" 
    },
    { 
      step: 2, 
      title: "የመቀበያ መንገድ ይምረጡ", 
      text: "የሚመርጡትን የመቀበያ መንገድ ይምረጡ: ቴሌብር ወይም ሲቢኢ ብር።",
      file: "/withdrowal_payment.jpg", 
      alt: "የመቀበያ መንገድ" 
    },
    { 
      step: 3, 
      title: "መጠን ያስገቡ", 
      text: "ማውጣት የሚፈልጉትን መጠን ያስገቡ (አነስተኛ: 100 ብር)።",
      file: "/withdrowal_amount.jpg", 
      alt: "መጠን ማስገቢያ" 
    },
    { 
      step: 4, 
      title: "የሂሳብ ዝርዝር ያስገቡ", 
      text: "ገንዘቡ የሚላክበትን የቴሌብር ስልክ ቁጥር ወይም የባንክ ሂሳብ ቁጥር ያስገቡ።",
      file: "/withdrowal_account.jpg", 
      alt: "የሂሳብ ዝርዝር" 
    },
    { 
      step: 5, 
      title: "የሂሳብ ባለቤት ስም ያስገቡ", 
      text: "የመውጫ ጥያቄውን ለማጠናቀቅ የሂሳቡን ባለቤት ሙሉ ስም ያስገቡ።",
      file: "/withdrowal_holdername.jpg", 
      alt: "የሂሳብ ባለቤት ስም" 
    }
  ]
};

// How to Play Bingo Steps (Game Instructions - KEEP THIS)
const HowToPlaySteps: { en: StepType[]; am: StepType[] } = {
  en: [
    { 
      step: 1, 
      title: "Select a Game", 
      text: 'Click "Play Bingo" from the main menu to see available game options. Select a game that matches your preferred bet amount.',
      file: "/game_select.jpg", 
      alt: "Select a Game" 
    },
    { 
      step: 2, 
      title: "Select Your Cards", 
      text: "For the selected game, choose your bingo cards. You can select up to 2 cards and change your selection until the timer reaches 0 seconds or the game starts.",
      note: "Note: You can clear selected cards before the game starts for a refund. After the game starts, you cannot clear your selected cards.", 
      file: "/card_select.jpg", 
      alt: "Select Your Cards" 
    },
    { 
      step: 3, 
      title: "Game Play", 
      text: "When the game starts (after the timer reaches 0), numbers will be called automatically. Mark the called numbers on your card as they appear.",
      file: "/playing.jpg", 
      alt: "Game Play" 
    },
    { 
      step: 4, 
      title: "Winning", 
      text: 'If you complete a winning pattern (Row, Column, Diagonal, or Corners), click the "BINGO" button. The system will verify your win.',
      note: "Important: Never click the Bingo button if you haven't actually won, as the system will block your cards for false claims.", 
      file: "/winn.jpg", 
      alt: "Winning" 
    },
  ],
  am: [
    { 
      step: 1, 
      title: "ጨዋታ መምረጥ", 
      text: 'ከዋና ማውጫ "ቢንጎ ተጫወት" የሚለውን ተጭነው የሚገኙ ጨዋታዎችን ይመልከቱ እና በሚመርጡት የውርርድ መጠን የሚስማማ ይምረጡ።',
      file: "/game_select.jpg", 
      alt: "ጨዋታ መምረጥ" 
    },
    { 
      step: 2, 
      title: "ካርዶችን መምረጥ", 
      text: "ለተመረጠው ጨዋታ የቢንጎ ካርዶችዎን ይምረጡ። እስከ 2 ካርዶች መምረጥ ይችላሉ እና ሰዓት ቆጣሪው 0 ሰከንድ እስኪደርስ ወይም ጨዋታው እስኪጀመር ድረስ ምርጫዎን መለወጥ ይችላሉ።",
      note: "ማስታወሻ: ጨዋታው ከመጀመሩ በፊት የተመረጡ ካርዶችን ማጽዳት እና ገንዘብ መመለስ ይችላሉ። ጨዋታው ከተጀመረ በኋላ የተመረጡ ካርዶችን ማጽዳት አይችሉም።", 
      file: "/card_select.jpg", 
      alt: "ካርዶችን መምረጥ" 
    },
    { 
      step: 3, 
      title: "ጨዋታ መጫወት", 
      text: "ጨዋታው ሲጀመር (ሰዓት ቆጣሪው 0 ሲደርስ) ቁጥሮች በራስ-ሰር ይጠራሉ። በካርድዎ ላይ የተጠሩትን ቁጥሮች ሲታዩ ምልክት ያድርጉባቸው።",
      file: "/playing.jpg", 
      alt: "ጨዋታ መጫወት" 
    },
    { 
      step: 4, 
      title: "ማሸነፍ", 
      text: 'የማሸነፊያ ቅደም ተከተል (ረድፍ፣ አምድ፣ ዲያግናል፣ ወይም ማእዘኖች) ካጠናቀቁ "BINGO" የሚለውን ቁልፍ ይጫኑ። ስርዓቱ ድልዎን ያረጋግጣል።',
      note: "አስፈላጊ: በእውነት ካላሸነፉ በስተቀር የቢንጎ ቁልፍን በጭራሽ አይጫኑ፣ ምክንያቱም ስርዓቱ ለሐሰት የይገባኛል ጥያቄ ካርዶችዎን ያግዳል።", 
      file: "/winn.jpg", 
      alt: "ማሸነፍ" 
    },
  ]
};

// Important Notes configurations
const ImportantNotes = {
  howToPlay: {
    en: [
      'You can clear selected cards before the game starts and receive a refund',
      'After the game starts, you cannot clear your selected cards',
      'Never click the Bingo button unless you have a valid winning pattern',
      'False Bingo claims will result in your cards being blocked for that game',
      'Winnings are automatically credited to your wallet after verification'
    ],
    am: [
      'ጨዋታው ከመጀመሩ በፊት የተመረጡ ካርዶችን ማጽዳት እና ገንዘብ መመለስ ይችላሉ',
      'ጨዋታው ከተጀመረ በኋላ የተመረጡ ካርዶችን ማጽዳት አይችሉም',
      'ትክክለኛ የማሸነፊያ ቅደም ተከተል ከሌለዎት በስተቀር የቢንጎ ቁልፍን በጭራሽ አይጫኑ',
      'የሐሰት የቢንጎ የይገባኛል ጥያቄ ካርዶችዎ ለዚያ ጨዋታ እንዲታገዱ ያደርጋል',
      'ድሎች ከተረጋገጡ በኋላ በራስ-ሰር ወደ ቦርሳዎ ይጨመራሉ'
    ]
  },
  deposit: {
    en: [
      'Minimum deposit amount: 10 ETB',
      'Have bonus on deposits above 50 ETB',
      'Bonus is automatically credited after successful deposit',
      'Transaction ID must be submitted within 5 minutes',
      'Deposits are processed 24/7'
    ],
    am: [
      'አነስተኛ ገቢ: 10 ብር',
      'ከ 50 ብር በላይ ሲያስገቡ ቦነስ ያገኛሉ',
      'ቦነስ ገንዘቡ ከገባ በኋላ በራስ-ሰር ይጨመራል',
      'የግብይት መለያ ቁጥር በ5 ደቂቃ ውስጥ ማስገባት አለብዎት',
      'ገቢዎች በ24/7 ይሰራሉ'
    ]
  },
  withdrawal: {
    en: [
      'Minimum withdrawal amount: 100 ETB',
      'Maximum withdrawal amount: 10,000 ETB per day',
      'Withdrawals are processed within 24/7 hours',
      'Account holder name must match the registered name on the account',
      'Withdrawals are verified before processing'
    ],
    am: [
      'አነስተኛ ወጪ: 100 ብር',
      'ከፍተኛ ወጪ: በቀን 10,000 ብር',
      'ወጪዎች በ24/7 ሰአት ውስጥ ይሰራሉ',
      'የሂሳብ ባለቤት ስም ከተመዘገበው የባንካ ወይም የቴሌብርአካውንት ስም ጋር መዛመድ አለበት',
      'ወጪዎች ከመሰራታቸው በፊት ይረጋገጣሉ'
    ]
  }
};

export default function HowToPlayModal({ open, onClose, language = 'am' }: HowToPlayModalProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenAlt, setFullscreenAlt] = useState<string>('');

  // Get the appropriate steps based on language and tab
  const howToPlaySteps = language === 'am' ? HowToPlaySteps.am : HowToPlaySteps.en;
  const depositSteps = language === 'am' ? DepositSteps.am : DepositSteps.en;
  const withdrawalSteps = language === 'am' ? WithdrawalSteps.am : WithdrawalSteps.en;

  const getCurrentSteps = (): StepType[] => {
    switch(activeTab) {
      case 0: return howToPlaySteps;
      case 1: return depositSteps;
      case 2: return withdrawalSteps;
      default: return howToPlaySteps;
    }
  };

  const currentSteps = getCurrentSteps();

  // Get the important notes based on active tab and language
  const getImportantNotes = (): string[] => {
    switch(activeTab) {
      case 0: return language === 'am' ? ImportantNotes.howToPlay.am : ImportantNotes.howToPlay.en;
      case 1: return language === 'am' ? ImportantNotes.deposit.am : ImportantNotes.deposit.en;
      case 2: return language === 'am' ? ImportantNotes.withdrawal.am : ImportantNotes.withdrawal.en;
      default: return language === 'am' ? ImportantNotes.howToPlay.am : ImportantNotes.howToPlay.en;
    }
  };

  const currentNotes = getImportantNotes();

  // Reset active step when modal opens or tab changes
  useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open, activeTab]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepChange = (step: number) => {
    setActiveStep(step);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setActiveStep(0);
  };

  const handleImageClick = (imageSrc: string, imageAlt: string) => {
    setFullscreenImage(imageSrc);
    setFullscreenAlt(imageAlt);
  };

  const handleCloseFullscreen = () => {
    setFullscreenImage(null);
    setFullscreenAlt('');
  };

  const totalSteps = currentSteps.length;

  const getTabLabel = (index: number) => {
    if (language === 'am') {
      switch(index) {
        case 0: return '🎮 እንዴት መጫወት እንደሚቻል';
        case 1: return '💰 ገንዘብ ማስገባት';
        case 2: return '💸 ገንዘብ ማውጣት';
        default: return '';
      }
    } else {
      switch(index) {
        case 0: return '🎮 How to Play';
        case 1: return '💰 Deposit';
        case 2: return '💸 Withdraw';
        default: return '';
      }
    }
  };

  const getTabColor = (index: number) => {
    switch(index) {
      case 0: return '#2e7d32';
      case 1: return '#d32f2f';
      case 2: return '#1976d2';
      default: return '#1976d2';
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="how-to-play-modal"
        aria-describedby="how-to-play-instructions"
      >
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'background.paper',
          borderRadius: 0,
          boxShadow: 24,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <Box sx={{
            p: 2,
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#f8f9fa',
            flexShrink: 0
          }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              {language === 'am' ? 'እንዴት መጫወት እንደሚቻል' : 'How to Play Gasha Bingo'}
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto', 
            p: 3,
            pb: 4
          }}>
            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                mb: 3,
                borderBottom: '2px solid #e0e0e0',
                '& .MuiTab-root': {
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  minWidth: 'auto',
                  px: 2
                }
              }}
            >
              <Tab label={getTabLabel(0)} />
              <Tab label={getTabLabel(1)} />
              <Tab label={getTabLabel(2)} />
            </Tabs>

            {/* Section Title */}
            <Typography variant="h6" sx={{ 
              fontWeight: 'bold', 
              color: getTabColor(activeTab),
              mb: 2,
              borderBottom: `2px solid ${getTabColor(activeTab)}`,
              pb: 1
            }}>
              {activeTab === 0 && (language === 'am' ? '📝 የጨዋታ መመሪያ' : '📝 Game Instructions')}
              {activeTab === 1 && (language === 'am' ? '📝 ገንዘብ ማስገባት ደረጃዎች' : '📝 Deposit Steps')}
              {activeTab === 2 && (language === 'am' ? '📝 ገንዘብ ማውጣት ደረጃዎች' : '📝 Withdrawal Steps')}
            </Typography>

            {/* Stepper */}
            <Stepper activeStep={activeStep} orientation="vertical">
              {currentSteps.map((step, index) => (
                <Step key={step.step}>
                  <StepLabel 
                    onClick={() => handleStepChange(index)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {step.title}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ color: '#424242', mb: 1 }}>
                      {step.text}
                    </Typography>
                    {/* Only show note if it exists */}
                    {step.note && (
                      <Typography variant="body2" sx={{ 
                        color: '#ed6c02', 
                        mb: 1,
                        fontStyle: 'italic',
                        bgcolor: '#fff3e0',
                        p: 1,
                        borderRadius: 1
                      }}>
                        {step.note}
                      </Typography>
                    )}
                    <Box 
                      sx={{ 
                        position: 'relative',
                        width: '100%',
                        maxWidth: 400,
                        height: 200,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid #e0e0e0',
                        mb: 2,
                        bgcolor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => handleImageClick(step.file, step.alt)}
                    >
                      <Image
                        src={step.file}
                        alt={step.alt}
                        fill
                        style={{ objectFit: 'contain' }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          bgcolor: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          p: 1,
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                          '&:hover': {
                            opacity: 1
                          }
                        }}
                      >
                        🔍 {language === 'am' ? 'ለማስፋት ጠቅ ያድርጉ' : 'Click to enlarge'}
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        sx={{ mr: 1 }}
                        disabled={index === totalSteps - 1}
                      >
                        {language === 'am' ? 'ቀጥል' : 'Continue'}
                      </Button>
                      <Button
                        disabled={index === 0}
                        onClick={handleBack}
                      >
                        {language === 'am' ? 'ተመለስ' : 'Back'}
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {activeStep === totalSteps - 1 && (
              <Paper square elevation={0} sx={{ p: 3, bgcolor: '#f5f5f5', mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 1 }}>
                  {language === 'am' 
                    ? '✅ ጠቅላላ! አሁን ወደ ጨዋታው መመለስ ይችላሉ!'
                    : '✅ All set! You can now return to the game!'}
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  onClick={onClose}
                  fullWidth
                >
                  {language === 'am' ? '🎮 ወደ ጨዋታ ተመለስ' : '🎮 Return to Game'}
                </Button>
              </Paper>
            )}

            {/* Dynamic Important Notes based on active tab */}
            <Box sx={{ 
              mt: 3,
              p: 2,
              bgcolor: '#fff8e1',
              borderRadius: 2,
              borderLeft: `4px solid ${getTabColor(activeTab)}`
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: getTabColor(activeTab), mb: 1 }}>
                {language === 'am' ? '⭐ አስፈላጊ ማስታወሻዎች' : '⭐ Important Notes'}
              </Typography>
              <Box sx={{ pl: 2 }}>
                {currentNotes.map((note, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography component="span" sx={{ mr: 1, color: getTabColor(activeTab) }}>•</Typography>
                    <Typography variant="body2" sx={{ color: '#424242' }}>
                      {note}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Fullscreen Image Dialog */}
      <Dialog
        open={!!fullscreenImage}
        onClose={handleCloseFullscreen}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.92)',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: '100vw',
            height: '100vh',
            margin: 0,
            borderRadius: 0,
            position: 'relative'
          }
        }}
        BackdropProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.95)'
          }
        }}
      >
        <IconButton
          onClick={handleCloseFullscreen}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': {
              bgcolor: 'rgba(0,0,0,0.8)'
            }
          }}
        >
          <CloseIcon sx={{ fontSize: 32 }} />
        </IconButton>
        <DialogContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0,
            height: '100vh',
            width: '100vw'
          }}
        >
          {fullscreenImage && (
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Image
                src={fullscreenImage}
                alt={fullscreenAlt}
                fill
                style={{ 
                  objectFit: 'contain',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
                sizes="100vw"
                priority
              />
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}