import Razorpay from 'razorpay';
import crypto from 'crypto';

export const getRazorpayInstance = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mockSecretKeyId67890';
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

export const verifyRazorpaySignature = (
  body: string,
  signature: string,
  secret: string
): boolean => {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
  } catch (err) {
    console.error('Error verifying Razorpay signature:', err);
    return false;
  }
};
