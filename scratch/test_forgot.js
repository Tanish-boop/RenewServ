const http = require('http');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method, body, cookieHeader = '') {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (cookieHeader) {
      options.headers['Cookie'] = cookieHeader;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          data: parsed,
          cookies: (res.headers['set-cookie'] || []).map(c => c.split(';')[0]).join('; ')
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, data: { error: err.message } });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function makeBlindIndex(text) {
  if (!text) return '';
  const key = process.env.BLIND_INDEX_KEY || 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
  return crypto
    .createHmac('sha256', Buffer.from(key, 'hex'))
    .update(text.toLowerCase().trim())
    .digest('hex');
}

async function testFlow() {
  const email = 'testreset_prog@example.com';
  const phone = '9876543233';
  const name = 'Programmatic Reset User';
  const oldPassword = 'OldPassword123!';
  const newPassword = 'NewPassword123!';

  console.log('1. Cleaning up existing test user...');
  const emailIndex = makeBlindIndex(email);
  const existing = await prisma.user.findFirst({ where: { emailIndex } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('Cleaned up existing user.');
  }

  // Clear existing OTPs
  await prisma.passwordResetOtp.deleteMany({ where: { email } });
  await prisma.emailVerificationOtp.deleteMany({ where: { email } });
  await prisma.emailLog.deleteMany({ where: { to: email } });

  console.log('2. Registering new user...');
  const regRes = await makeRequest('/api/auth/register', 'POST', {
    name,
    email,
    phone,
    password: oldPassword,
  });
  
  console.log('Registration Response Status:', regRes.statusCode);
  console.log('Registration Response Data:', regRes.data);

  if (regRes.statusCode !== 200) {
    throw new Error('Registration failed: ' + JSON.stringify(regRes.data));
  }

  console.log('3. Triggering forgot password...');
  const forgotRes = await makeRequest('/api/auth/forgot-password', 'POST', { email });

  console.log('Forgot Password Response Status:', forgotRes.statusCode);
  console.log('Forgot Password Response Data:', forgotRes.data);

  if (forgotRes.statusCode !== 200) {
    throw new Error('Forgot password failed: ' + JSON.stringify(forgotRes.data));
  }

  console.log('4. Retrieving OTP from DB/Logs...');
  const otpRecord = await prisma.passwordResetOtp.findFirst({
    where: { email },
    orderBy: { createdAt: 'desc' }
  });

  if (!otpRecord) {
    throw new Error('No password reset OTP record found in DB!');
  }
  console.log('Found OTP record in DB.');

  // Since otpCode is hashed, let's look at the email log to find the plaintext code
  const emailLog = await prisma.emailLog.findFirst({
    where: { to: email, subject: { contains: 'Reset' } },
    orderBy: { createdAt: 'desc' }
  });

  if (!emailLog) {
    throw new Error('No EmailLog record found for reset mail!');
  }

  const otpMatch = emailLog.body.match(/\b\d{6}\b/);
  if (!otpMatch) {
    throw new Error('Could not find 6-digit OTP in email body: ' + emailLog.body);
  }
  const otpCode = otpMatch[0];
  console.log('Retrieved Plaintext OTP from EmailLog:', otpCode);

  console.log('5. Resetting password using retrieved OTP...');
  const resetRes = await makeRequest('/api/auth/reset-password', 'POST', {
    email,
    otpCode,
    newPassword,
  });

  console.log('Reset Password Response Status:', resetRes.statusCode);
  console.log('Reset Password Response Data:', resetRes.data);

  if (resetRes.statusCode !== 200) {
    throw new Error('Reset password failed: ' + JSON.stringify(resetRes.data));
  }

  console.log('6. Attempting login with NEW password...');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {
    identifier: email,
    password: newPassword,
  });

  console.log('Login Response Status:', loginRes.statusCode);
  console.log('Login Response Data:', loginRes.data);

  if (loginRes.statusCode !== 200) {
    throw new Error('Login failed with new password: ' + JSON.stringify(loginRes.data));
  }

  console.log('✅ Forgot password & reset flow programmatic test PASSED!');
}

testFlow()
  .catch(err => {
    console.error('❌ Test Flow FAILED:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
