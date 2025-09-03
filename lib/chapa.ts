export interface ChapaPaymentOptions {
  amount: number;
  currency?: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

export const initializeChapaPayment = async (options: ChapaPaymentOptions): Promise<void> => {
  try {
    const response = await fetch('/api/payment/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize payment');
    }

    const data = await response.json();
    window.location.href = data.checkout_url;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

export const verifyChapaPayment = async (tx_ref: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/payment/verify/${tx_ref}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const data = await response.json();
    return data.status === 'success';
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};