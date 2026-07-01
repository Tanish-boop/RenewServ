async function testApi() {
  console.log('Sending public POST /api/leads request to dev server...');
  try {
    const res = await fetch('http://127.0.0.1:3000/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Api Test Lead',
        email: 'api@example.com',
        phone: '9999999999',
        serviceInterested: 'Solar Health Check',
        notes: 'API check'
      })
    });
    console.log('Status code:', res.status);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testApi();
