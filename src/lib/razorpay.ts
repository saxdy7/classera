import Razorpay from 'razorpay';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_SVkKpvA0gfDTu1',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '2YxWmjow6x17AdLTnyH7g42b',
});
