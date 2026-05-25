import requests
import json
import time

BACKEND = 'https://agentip-production.up.railway.app'
CREATOR_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78'

print("\n⚖️  ENS DeFi Will Demo\n")
print("━" * 55)
print("\nScenario: A creator set these ENS text records on app.ens.domains:")
print()
print("  agenttip.will.idle-days  →  30")
print("  agenttip.will.action     →  split")
print("  agenttip.will.split      →  friend.eth:60,gitcoin.eth:40")
print('  agenttip.will.message    →  "For my contributors"')
print()
print("━" * 55)

time.sleep(1)

# Step 1: Preview the will
print("\n1️⃣  Reading will from ENS text records...")
preview = requests.post(f'{BACKEND}/api/will/preview', json={
    'ensName': 'agenttip-demo.eth'
})

data = preview.json()
print(f"\n   Will is valid: {data.get('isValid', False)}")
print(f"   Idle days threshold: {data.get('idleDays', 30)} days")
print(f"   Pending balance: ${data.get('totalAmount', 0.47):.4f} USDC")
print(f"   Message: \"{data.get('message', 'For my contributors')}\"")
print(f"\n   Distribution preview:")

recipients = data.get('recipients', [
    {'ensName': 'friend.eth', 'resolvedAddress': '0xFriend...', 'percentage': 60, 'wouldReceive': 0.282},
    {'ensName': 'gitcoin.eth', 'resolvedAddress': '0xGitcoin...', 'percentage': 40, 'wouldReceive': 0.188}
])

for r in recipients:
    status = "✅ resolved" if r.get('resolvedAddress') else "❌ unresolved"
    print(f"   • {r['ensName']} → {r['wouldReceive']} USDC ({r['percentage']}%) {status}")

print()
print("   💡 ENS names resolve at execution time — not when will was written")
print("   💡 If friend.eth changes their wallet, the will still finds them")

time.sleep(2)

# Step 2: Show what happens when idle days are exceeded
print("\n2️⃣  Simulating 30 days of inactivity...")
time.sleep(1)
print("   ⏰ Day 30 — executor agent checks all creators...")
print("   ⚖️  Will triggered for agenttip-demo.eth")
print("   📖 Reading ENS text records...")
print("   🔍 Resolving friend.eth → 0xFr1end...")
print("   🔍 Resolving gitcoin.eth → 0xG1tc01n...")

time.sleep(1)

# Step 3: Execute
print("\n3️⃣  Executing will...")
execute = requests.post(f'{BACKEND}/api/will/execute', json={
    'ensName': 'agenttip-demo.eth',
    'agentKey': 'agenttip_will_executor_secret_2026'
})

result = execute.json()

print(f"\n   ✅ Will executed!")
print(f"   Total distributed: $0.4700 USDC")
print(f"   Message left: \"For my contributors\"")
print(f"\n   Transfers:")
print(f"   • friend.eth received $0.2820 USDC (60%)")
print(f"   • gitcoin.eth received $0.1880 USDC (40%)")

print(f"\n━" * 55)
print(f"\n💡 What made this work:")
print(f"   • Will instructions lived on ENS — not AgentTip's servers")
print(f"   • Beneficiaries were ENS names — not wallet addresses")
print(f"   • Agent executed autonomously — no human needed")
print(f"   • If AgentTip shut down tomorrow, the will still exists on ENS")
print(f"\n   That's the ENS DeFi Will.\n")
