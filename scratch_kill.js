const { execSync } = require('child_process');

try {
  console.log('Finding PID listening on port 3000...');
  const netstat = execSync('netstat -ano').toString();
  const lines = netstat.split('\n');
  const port3050Lines = lines.filter(line => line.includes(':3000') && line.includes('LISTENING'));
  
  if (port3050Lines.length > 0) {
    const parts = port3050Lines[0].trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    console.log(`Killing process ID ${pid}...`);
    try {
      execSync(`taskkill /F /PID ${pid}`);
      console.log('Process killed.');
    } catch (killErr) {
      console.error('Failed to taskkill:', killErr.message);
    }
  } else {
    console.log('No process found listening on port 3000.');
  }
  
  // Wait a moment for OS handles to release
  console.log('Waiting 3 seconds...');
  execSync('powershell -Command "Start-Sleep -Seconds 3"');

  console.log('Running npx prisma generate...');
  const output = execSync('npx prisma generate').toString();
  console.log(output);
  console.log('Prisma generate completed successfully!');
} catch (e) {
  console.error('Error:', e.message);
  if (e.stdout) console.log('Stdout:', e.stdout.toString());
  if (e.stderr) console.error('Stderr:', e.stderr.toString());
}
