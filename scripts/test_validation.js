const http = require('http');
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

async function testAll() {
  console.log('=== STARTING COMPLETE INTEGRATION TESTS ===\n');

  // Test 1: Register with 9-digit phone (Should Fail)
  console.log('Test 1: Registering with 9-digit phone...');
  const res1 = await makeRequest('/api/auth/register', 'POST', {
    name: 'Validation Tester',
    email: `valid_test_${Date.now()}@example.com`,
    phone: '987654321', // 9 digits
    password: 'Password123',
    role: 'CUSTOMER'
  });
  console.log(`Result: Status ${res1.statusCode}, Error: "${res1.data?.error}"`);
  if (res1.statusCode !== 400 || !res1.data.error.includes('10 digits')) {
    console.error('FAIL: Test 1 should have failed validation with 400 and 10 digits msg');
  } else {
    console.log('SUCCESS: Blocked 9-digit phone registration.');
  }
  console.log();

  // Test 2: Register with valid 10-digit phone (Should Pass and auto-login)
  const userEmail = `valid_test_${Date.now()}@example.com`;
  const userPhone = '98765' + Math.floor(10000 + Math.random() * 90000);
  console.log(`Test 2: Registering with valid 10-digit phone (${userPhone})...`);
  const res2 = await makeRequest('/api/auth/register', 'POST', {
    name: 'Validation Tester',
    email: userEmail,
    phone: userPhone,
    password: 'Password123',
    role: 'CUSTOMER'
  });
  console.log(`Result: Status ${res2.statusCode}, Cookies: ${res2.cookies ? 'Acquired (Auto-login)' : 'None'}`);
  if (res2.statusCode !== 200 || !res2.cookies) {
    console.error('FAIL: Test 2 should have succeeded and returned session cookie', res2.data);
    process.exit(1);
  } else {
    console.log('SUCCESS: Registered and automatically logged in.');
  }
  console.log();

  // Test 3: Book service when unverified (Should Fail with 403)
  console.log('Test 3: Booking service as an unverified user...');
  const res3 = await makeRequest('/api/bookings', 'POST', {
    serviceType: 'PANEL_CLEANING',
    scheduledDate: '2026-07-02',
    scheduledTime: '10:00 AM',
    addressLabel: 'Home',
    addressLine: 'Aundh Road, Pune',
    postalCode: '411007',
    gpsCoords: '18.5590, 73.8224'
  }, res2.cookies);
  console.log(`Result: Status ${res3.statusCode}, Error: "${res3.data?.error}"`);
  if (res3.statusCode !== 403 || !res3.data.error.includes('not service-verified')) {
    console.error('FAIL: Unverified user should have been blocked with 403');
  } else {
    console.log('SUCCESS: Blocked booking for unverified user.');
  }
  console.log();

  // Test 4: Retrieve OTP codes from database and perform verification
  console.log('Test 4: Finding OTP verification codes in database...');
  // Find user by email index
  const crypto = require('crypto');
  const BLIND_INDEX_KEY = process.env.BLIND_INDEX_KEY || 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789';
  const blindKeyBuf = Buffer.from(BLIND_INDEX_KEY, 'hex');

  function makeBlindIndex(text) {
    if (!text) return '';
    return crypto
      .createHmac('sha256', blindKeyBuf)
      .update(text.toLowerCase().trim())
      .digest('hex');
  }

  const emailIdx = makeBlindIndex(userEmail);
  const user = await prisma.user.findFirst({
    where: { emailIndex: emailIdx }
  });
  
  if (!user) {
    console.error('FAIL: Could not find user in database');
    process.exit(1);
  }
  console.log(`Email OTP stored in DB: ${user.emailVerificationToken}`);
  console.log(`Phone OTP stored in DB: ${user.phoneOtpCode}`);

  // Test 5: Verify Email OTP
  console.log('Test 5: Verifying Email OTP...');
  const emailVer = await makeRequest('/api/auth/verify-email', 'POST', {
    otpCode: user.emailVerificationToken
  }, res2.cookies);
  console.log(`Result: Status ${emailVer.statusCode}, Msg:`, emailVer.data);
  if (emailVer.statusCode !== 200 || !emailVer.data.success) {
    console.error('FAIL: Email verification failed');
  } else {
    console.log('SUCCESS: Verified email.');
  }
  console.log();

  // Test 6: Verify Phone OTP
  console.log('Test 6: Verifying Phone OTP...');
  const phoneVer = await makeRequest('/api/auth/verify-phone', 'POST', {
    action: 'VERIFY_OTP',
    otpCode: user.phoneOtpCode
  }, res2.cookies);
  console.log(`Result: Status ${phoneVer.statusCode}, Msg:`, phoneVer.data);
  if (phoneVer.statusCode !== 200 || !phoneVer.data.success) {
    console.error('FAIL: Phone verification failed');
  } else {
    console.log('SUCCESS: Verified phone.');
  }
  console.log();

  // Test 7: Book service with surrounding Pune pincode (Should now succeed!)
  console.log('Test 7: Booking with surrounding Pune pincode (412115 - Uruli Kanchan) as verified user...');
  const res7 = await makeRequest('/api/bookings', 'POST', {
    serviceType: 'PANEL_CLEANING',
    scheduledDate: '2026-07-02',
    scheduledTime: '10:00 AM',
    addressLabel: 'Farmhouse',
    addressLine: 'Uruli Kanchan, Near Pune Outskirts',
    postalCode: '412115',
    gpsCoords: '18.4842, 74.1352'
  }, res2.cookies);
  console.log(`Result: Status ${res7.statusCode}, Msg:`, res7.data);
  if (res7.statusCode !== 200 || !res7.data.success) {
    console.error('FAIL: Verified booking failed');
  } else {
    console.log('SUCCESS: Booking created successfully!');
  }
  console.log();

  await prisma.$disconnect();
  console.log('=== INTEGRATION TEST SESSION COMPLETE ===');
}

testAll().catch(err => {
  console.error(err);
  process.exit(1);
});
