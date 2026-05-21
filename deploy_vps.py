import pexpect
import sys
import re

def run_ssh():
    print("Connecting to VPS...")
    child = pexpect.spawn('ssh -o StrictHostKeyChecking=no root@194.59.165.179', encoding='utf-8')
    child.logfile = sys.stdout
    
    # Robust prompt pattern to avoid matching '#' in docker/npm output
    prompt_pattern = r'root@.*#\s*|root@srv1558685:.*#\s*'

    try:
        i = child.expect(['assword:', pexpect.EOF, pexpect.TIMEOUT], timeout=15)
        if i == 0:
            child.sendline('SharaSpot-Prod-2026#')
            child.expect(prompt_pattern, timeout=20)
            
            # Reset local changes to prevent pull conflicts
            print("Resetting any local changes on VPS...")
            child.sendline("cd /root/SharaSpot && git reset --hard && git clean -fd")
            child.expect(prompt_pattern, timeout=40)

            # Pull latest changes
            print("Pulling latest changes on VPS...")
            child.sendline("git pull")
            child.expect(prompt_pattern, timeout=60)

            # Rebuild and start via Docker Compose
            print("Rebuilding and starting services via Docker Compose...")
            child.sendline("docker compose up -d --build")
            child.expect(prompt_pattern, timeout=600)
            
            # Show running containers
            print("\n--- Current Docker Status ---")
            child.sendline("docker compose ps -a")
            child.expect(prompt_pattern, timeout=40)
            
            child.sendline("exit")
            child.expect(pexpect.EOF)
            print("Done!")
        else:
            print("Failed to connect or timeout.")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    run_ssh()
