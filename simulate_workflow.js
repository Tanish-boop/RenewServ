const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper to make fetch requests in Node without external dependencies
function makeRequest(path, method, body, cookieHeader = '') {
  return new Promise((resolve, reject) => {
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
        const cookies = res.headers['set-cookie'] || [];
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null,
          cookies: cookies.map(c => c.split(';')[0]).join('; ')
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runSimulation() {
  console.log('=== STARTING RENEWSERV WORKFLOW SIMULATION ===\n');

  try {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const customerEmail = `customer_${randomSuffix}@example.com`;
    const techEmail = `tech_${randomSuffix}@example.com`;
    const adminEmail = `admin_${randomSuffix}@example.com`;
    
    let customerCookie = '';
    let techCookie = '';
    let adminCookie = '';
    let bookingId = '';

    // 1. Register CUSTOMER
    console.log('1. Registering Customer...');
    const regCust = await makeRequest('/api/auth/register', 'POST', {
      name: 'Amit Kumar',
      email: customerEmail,
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      password: 'Password123',
      role: 'CUSTOMER'
    });
    console.log(`   Status: ${regCust.statusCode}, Msg:`, regCust.data);

    // 2. Login CUSTOMER
    console.log('2. Logging in Customer...');
    const loginCust = await makeRequest('/api/auth/login', 'POST', {
      identifier: customerEmail,
      password: 'Password123'
    });
    customerCookie = loginCust.cookies;
    console.log(`   Status: ${loginCust.statusCode}, Cookie: ${customerCookie ? 'Acquired' : 'Failed'}`);

    // 3. Create Booking (pune pincode: 411038)
    console.log('3. Booking a solar panel cleaning service...');
    const booking = await makeRequest('/api/bookings', 'POST', {
      serviceType: 'PANEL_CLEANING',
      scheduledDate: '2026-07-01',
      scheduledTime: '10:00 AM',
      addressLabel: 'Home Installation',
      addressLine: 'Flat 402, Sunshine Towers, Kothrud',
      postalCode: '411038',
      gpsCoords: '18.5204, 73.8567',
      isEmergency: true
    }, customerCookie);
    bookingId = booking.data.bookingId;
    console.log(`   Status: ${booking.statusCode}, Booking ID: ${bookingId}, Assigned Tech ID: ${booking.data.assignedTechnicianId}`);

    // 4. Register TECHNICIAN
    console.log('4. Registering Technician...');
    const regTech = await makeRequest('/api/auth/register', 'POST', {
      name: 'Ramesh Pawar',
      email: techEmail,
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      password: 'Password123',
      role: 'TECHNICIAN'
    });
    console.log(`   Status: ${regTech.statusCode}, Msg:`, regTech.data);

    // 5. Login TECHNICIAN
    console.log('5. Logging in Technician...');
    const loginTech = await makeRequest('/api/auth/login', 'POST', {
      identifier: techEmail,
      password: 'Password123'
    });
    techCookie = loginTech.cookies;
    console.log(`   Status: ${loginTech.statusCode}, Cookie: ${techCookie ? 'Acquired' : 'Failed'}`);

    // 6. Check In Attendance
    console.log('6. Technician checking in (GPS attendance logs)...');
    const attendance = await makeRequest('/api/technician/attendance', 'POST', {
      action: 'CHECK_IN',
      gpsLatitude: '18.5204',
      gpsLongitude: '73.8567'
    }, techCookie);
    console.log(`   Status: ${attendance.statusCode}, Msg:`, attendance.data);

    // 7. Tech Start Travel
    console.log('7. Technician starting travel to site...');
    const travel = await makeRequest('/api/technician/assignments', 'PUT', {
      bookingId: bookingId,
      status: 'TECHNICIAN_ON_THE_WAY'
    }, techCookie);
    console.log(`   Status: ${travel.statusCode}, Msg:`, travel.data);

    // 8. Tech Complete Inspection & Submit Diagnostic values
    console.log('8. Technician submitting site diagnostic values...');
    const inspection = await makeRequest('/api/technician/assignments', 'PUT', {
      bookingId: bookingId,
      status: 'INSPECTION_COMPLETED',
      findings: 'Heavy soot accumulation, panel structural frames stable.',
      panelCondition: 'DIRTY_DEGRADED',
      outputVoltage: '185',
      efficiencyBefore: '55',
      efficiencyAfter: '92'
    }, techCookie);
    console.log(`   Status: ${inspection.statusCode}, Msg:`, inspection.data);

    // 9. Register SUPER_ADMIN
    console.log('9. Registering Admin...');
    const regAdmin = await makeRequest('/api/auth/register', 'POST', {
      name: 'System Admin',
      email: adminEmail,
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      password: 'Password123',
      role: 'SUPER_ADMIN'
    });
    console.log(`   Status: ${regAdmin.statusCode}, Msg:`, regAdmin.data);

    // 10. Login ADMIN
    console.log('10. Logging in Admin...');
    const loginAdmin = await makeRequest('/api/auth/login', 'POST', {
      identifier: adminEmail,
      password: 'Password123'
    });
    adminCookie = loginAdmin.cookies;
    console.log(`   Status: ${loginAdmin.statusCode}, Cookie: ${adminCookie ? 'Acquired' : 'Failed'}`);

    // 11. Admin Generate Quote
    console.log('11. Admin generating pricing quotation for client...');
    const quote = await makeRequest('/api/quotes', 'POST', {
      bookingId: bookingId,
      panelCount: '12',
      systemSizeKw: '3.5',
      cleaningCostInput: '900',
      dismantlingCostInput: '0',
      partsCostInput: '0',
      discountInput: '0',
      notes: 'Standard 12 solar panel cleaning package'
    }, adminCookie);
    console.log(`   Status: ${quote.statusCode}, Msg:`, quote.data);

    // 12. Customer Approve Quote & Pay 50% Advance
    console.log('12. Customer approving quote and paying 50% advance...');
    const approve = await makeRequest('/api/quotes', 'PUT', {
      bookingId: bookingId,
      action: 'APPROVE'
    }, customerCookie);
    console.log(`   Status: ${approve.statusCode}, Msg:`, approve.data);

    // 13. Tech Start Work
    console.log('13. Technician starting actual work...');
    const startWork = await makeRequest('/api/technician/assignments', 'PUT', {
      bookingId: bookingId,
      status: 'WORK_STARTED'
    }, techCookie);
    console.log(`   Status: ${startWork.statusCode}, Msg:`, startWork.data);

    // 14. Tech Complete Work
    console.log('14. Technician marking work completed (escrow release triggers)...');
    const completeWork = await makeRequest('/api/technician/assignments', 'PUT', {
      bookingId: bookingId,
      status: 'COMPLETED'
    }, techCookie);
    console.log(`   Status: ${completeWork.statusCode}, Msg:`, completeWork.data);

    // 15. Admin Check Double Entry Ledger Statement
    console.log('15. Admin fetching Ledger statement and balance sheet audits...');
    const ledger = await makeRequest('/api/admin/ledger', 'GET', null, adminCookie);
    console.log(`   Status: ${ledger.statusCode}`);
    console.log('   --- Balances ---');
    console.log(ledger.data.balances);
    console.log('   --- Ledger Statements ---');
    ledger.data.ledger.forEach((log, index) => {
      console.log(`   [${index + 1}] Src: ${log.sourceAccount} -> Dst: ${log.destinationAccount} | Amount: ₹${log.amount} | Desc: ${log.description}`);
    });

    console.log('\n=== SIMULATION COMPLETED SUCCESSFULLY! ===');
  } catch (error) {
    console.error('Workflow simulation failed:', error);
  }
}

runSimulation();
