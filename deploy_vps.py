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
            
            # Reset local changes to prevent pull conflicts
            print("Resetting any local changes on VPS...")
            child.sendline("cd /root/SharaSpot && git reset --hard && git clean -fd")
            child.expect('# ', timeout=30)

            # Pull latest changes
            print("Pulling latest changes on VPS...")
            child.sendline("git pull")
            child.expect('# ', timeout=30)

            # Rebuild and start via Docker Compose
            print("Rebuilding and starting services via Docker Compose...")
            child.sendline("docker compose up -d --build || docker-compose up -d --build")
            child.expect('# ', timeout=400)
            
            # Show running containers
            print("\n--- Current Docker Status ---")
            child.sendline("docker ps")
            child.expect('# ', timeout=30)
            
            child.sendline("exit")
            print("Done!")
        else:
            print("Failed to connect or timeout.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    run_ssh()
