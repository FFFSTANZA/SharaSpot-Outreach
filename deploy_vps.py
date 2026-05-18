import pexpect
import sys

def run_ssh():
    print("Connecting to VPS...")
    child = pexpect.spawn('ssh -o StrictHostKeyChecking=no root@194.59.165.179', encoding='utf-8')
    child.logfile = sys.stdout

    try:
        i = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=10)
        if i == 0:
            child.sendline('SharaSpot-Prod-2026#')
            child.expect('# ', timeout=10)
            
            # Pull latest changes
            print("Pulling latest changes on VPS...")
            child.sendline("cd /root/SharaSpot && git pull")
            child.expect('# ', timeout=30)

            # Build server
            print("Building server...")
            child.sendline("cd /root/SharaSpot/server && npm run build")
            child.expect('# ', timeout=60)

            # Build client
            print("Building client...")
            child.sendline("cd /root/SharaSpot/client && npm run build")
            child.expect('# ', timeout=300)

            # Start via PM2
            print("Restarting processes via PM2 ecosystem...")
            child.sendline("cd /root/SharaSpot && pm2 restart ecosystem.config.vps.js || pm2 start ecosystem.config.vps.js")
            child.expect('# ', timeout=60)
            
            child.sendline("exit")
            print("Done!")
        else:
            print("Failed to connect or timeout.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    run_ssh()
