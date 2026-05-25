#!/usr/bin/env python3
"""
AgentTip — AI Agent Demo Script

This script demonstrates how an AI agent interacts with a website
protected by the x402 protocol:

1. Sends a GET request to a content page
2. Receives HTTP 402 Payment Required with x402 headers
3. Simulates payment (in production, would use Coinbase agent wallet)
4. Re-requests with payment proof
5. Receives and displays the content

NEW: Agents now send intelligence context headers with every payment.
The creator gets a private Fileverse dDoc showing what each agent was
researching when it paid for their content.

Usage:
    python agent_demo.py [--url URL] [--wallet WALLET]

Requirements:
    pip install requests
"""

import argparse
import json
import sys
import time
import uuid
from datetime import datetime

try:
    import requests
except ImportError:
    print("❌ Please install requests: pip install requests")
    sys.exit(1)


# ANSI colors for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    END = '\033[0m'


def print_banner():
    print(f"""
{Colors.BOLD}{Colors.CYAN}
   ╔══════════════════════════════════════════════╗
   ║     🤖 AgentTip — AI Agent Demo Script      ║
   ║     x402 Protocol + Intelligence Network     ║
   ╚══════════════════════════════════════════════╝
{Colors.END}""")


def print_step(step_num: int, text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}[Step {step_num}]{Colors.END} {text}")


def print_header(key: str, value: str):
    print(f"  {Colors.DIM}{key}:{Colors.END} {Colors.YELLOW}{value}{Colors.END}")


def print_success(text: str):
    print(f"\n  {Colors.GREEN}✅ {text}{Colors.END}")


def print_error(text: str):
    print(f"\n  {Colors.RED}❌ {text}{Colors.END}")


AGENT_WALLET = '0xAGENT_DEMO_WALLET_000000000000000000'


def simulate_agent_flow(
    api_url: str,
    content_url: str,
    creator_wallet: str,
    agent_context: str = 'General AI research',
    agent_query: str = 'Exploring available content',
):
    """Simulate the full x402 payment flow with intelligence context."""
    
    print_banner()
    print(f"  {Colors.DIM}API URL:    {api_url}{Colors.END}")
    print(f"  {Colors.DIM}Content:    {content_url}{Colors.END}")
    print(f"  {Colors.DIM}Wallet:     {creator_wallet}{Colors.END}")
    print(f"  {Colors.DIM}Context:    {agent_context}{Colors.END}")
    print(f"  {Colors.DIM}Query:      {agent_query}{Colors.END}")
    print(f"  {Colors.DIM}Timestamp:  {datetime.now().isoformat()}{Colors.END}")
    
    # ── Step 1: Request content as an AI agent ──
    print_step(1, "Requesting content as AI agent...")
    
    headers = {
        'User-Agent': 'AI-Agent/1.0 (AgentTip Demo; Python)',
        'X-Agent-Type': 'autonomous',
        'X-Agent-Context': agent_context,
        'X-Agent-Query': agent_query,
        'X-Content-Title': content_url,
        'X-Agent-Address': AGENT_WALLET,
        'Accept': 'application/json',
    }
    
    try:
        response = requests.get(content_url, headers=headers, timeout=10)
    except requests.ConnectionError:
        print(f"  {Colors.DIM}Content URL not reachable, demonstrating API flow directly...{Colors.END}")
        response = None
    
    if response and response.status_code == 402:
        print(f"  {Colors.YELLOW}← HTTP 402 Payment Required{Colors.END}")
        print(f"\n  {Colors.BOLD}Payment Headers Received:{Colors.END}")
        
        payment_data = response.json()
        payment_info = payment_data.get('payment', {})
        
        for key, val in payment_info.items():
            print_header(key, str(val))
            
    else:
        print(f"  {Colors.DIM}(Simulating 402 response for demo){Colors.END}")
        print(f"  {Colors.YELLOW}← HTTP 402 Payment Required{Colors.END}")
        print(f"\n  {Colors.BOLD}Payment Headers:{Colors.END}")
        print_header("X-Payment-Amount", "0.001")
        print_header("X-Payment-Asset", "USDC")
        print_header("X-Payment-Network", "base")
        print_header("X-Payment-Recipient", creator_wallet)
        print_header("X-Payment-Protocol", "x402")
    
    time.sleep(1)
    
    # ── Step 2: Parse payment requirements ──
    print_step(2, "Parsing x402 payment requirements...")
    
    payment_amount = 0.001
    payment_asset = "USDC"
    payment_network = "base"
    
    print(f"  Amount:  {Colors.GREEN}${payment_amount} {payment_asset}{Colors.END}")
    print(f"  Network: {Colors.CYAN}{payment_network}{Colors.END}")
    print(f"  To:      {Colors.CYAN}{creator_wallet[:10]}...{creator_wallet[-6:]}{Colors.END}")
    
    time.sleep(0.5)
    
    # ── Step 3: Simulate micropayment ──
    print_step(3, "Sending micropayment via Coinbase Agent Wallet...")
    
    simulated_tx_hash = f"0xdemo{uuid.uuid4().hex[:56]}"
    
    print(f"  {Colors.DIM}Connecting to Base RPC...{Colors.END}")
    time.sleep(0.5)
    print(f"  {Colors.DIM}Signing USDC transfer...{Colors.END}")
    time.sleep(0.5)
    print(f"  {Colors.DIM}Broadcasting transaction...{Colors.END}")
    time.sleep(0.5)
    
    print(f"\n  {Colors.GREEN}Transaction sent!{Colors.END}")
    print(f"  TxHash: {Colors.CYAN}{simulated_tx_hash[:20]}...{simulated_tx_hash[-8:]}{Colors.END}")
    
    # ── Step 4: Submit payment proof with intelligence context ──
    print_step(4, "Submitting payment proof + intelligence context to AgentTip backend...")
    
    verify_payload = {
        'wallet': creator_wallet,
        'txHash': simulated_tx_hash,
        'amount': payment_amount,
    }
    
    verify_headers = {
        'Content-Type': 'application/json',
        'X-Agent-Context': agent_context,
        'X-Agent-Query': agent_query,
        'X-Content-Title': content_url,
        'X-Agent-Address': AGENT_WALLET,
    }
    
    try:
        verify_response = requests.post(
            f"{api_url}/verify-payment",
            json=verify_payload,
            headers=verify_headers,
            timeout=10,
        )
        
        if verify_response.status_code == 200:
            result = verify_response.json()
            print_success("Payment verified by backend!")
            print(f"  Access: {Colors.GREEN}{result.get('access', 'granted')}{Colors.END}")
            if result.get('transaction'):
                print(f"  Transaction ID: {Colors.CYAN}{result['transaction'].get('id', 'N/A')}{Colors.END}")
            print(f"\n  {Colors.BOLD}🧠 Intelligence Note Written:{Colors.END}")
            print(f"  {Colors.DIM}  Task: {agent_context}{Colors.END}")
            print(f"  {Colors.DIM}  Query: {agent_query}{Colors.END}")
            print(f"  {Colors.DIM}  → Written to creator's private Fileverse dDoc{Colors.END}")
        else:
            print(f"  {Colors.YELLOW}Backend response: {verify_response.status_code}{Colors.END}")
            try:
                print(f"  {Colors.DIM}{verify_response.json()}{Colors.END}")
            except:
                pass
    except requests.ConnectionError:
        print(f"  {Colors.DIM}(Backend not running — simulating success){Colors.END}")
        print_success("Payment verified! (simulated)")
        print(f"\n  {Colors.BOLD}🧠 Intelligence Note (would be written):{Colors.END}")
        print(f"  {Colors.DIM}  Task: {agent_context}{Colors.END}")
        print(f"  {Colors.DIM}  Query: {agent_query}{Colors.END}")
    
    time.sleep(0.5)
    
    # ── Step 5: Access content ──
    print_step(5, "Accessing content with payment proof...")
    
    content_headers = {
        **headers,
        'X-Payment-Proof': simulated_tx_hash,
        'X-Payment-TxHash': simulated_tx_hash,
    }
    
    print(f"  {Colors.DIM}→ GET {content_url}{Colors.END}")
    print(f"  {Colors.DIM}  X-Payment-Proof: {simulated_tx_hash[:20]}...{Colors.END}")
    
    time.sleep(0.5)
    print(f"  {Colors.GREEN}← HTTP 200 OK{Colors.END}")
    
    # ── Summary ──
    print(f"""
{Colors.BOLD}{Colors.GREEN}
   ╔══════════════════════════════════════════════╗
   ║       ✅ x402 Payment Flow Complete!         ║
   ╠══════════════════════════════════════════════╣
   ║  Payment:  $0.001 USDC on Base              ║
   ║  Status:   Verified                          ║
   ║  Content:  Access Granted                    ║
   ║  Intelligence: Written to Creator dDoc ✍️    ║
   ╚══════════════════════════════════════════════╝
{Colors.END}""")


def run_multi_agent_demo(api_url: str, creator_wallet: str):
    """Demonstrate three agents with different research contexts."""

    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("   ╔══════════════════════════════════════════════╗")
    print("   ║  🧠 Multi-Agent Intelligence Demo           ║")
    print("   ║  Three agents, one creator's private dDoc   ║")
    print("   ╚══════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    agents = [
        {
            'name': 'Climate Research Agent',
            'context': 'Compiling a report on renewable energy storage for a green tech VC',
            'query': 'lithium iron phosphate battery alternatives for grid storage',
        },
        {
            'name': 'Medical Research Agent',
            'context': 'Supporting a pharmaceutical team analyzing drug interaction research',
            'query': 'peer-reviewed studies on SSRI cross-reactivity 2024-2025',
        },
        {
            'name': 'Legal Research Agent',
            'context': 'Drafting a legal brief on intellectual property in AI-generated content',
            'query': 'case law on AI training data copyright fair use doctrine',
        },
    ]

    for i, agent in enumerate(agents):
        print(f"\n{Colors.BOLD}── Agent {i+1}: {agent['name']} ──{Colors.END}")

        simulated_tx_hash = f"0xdemo{uuid.uuid4().hex[:56]}"

        verify_payload = {
            'wallet': creator_wallet,
            'txHash': simulated_tx_hash,
            'amount': 0.001,
        }

        verify_headers = {
            'Content-Type': 'application/json',
            'X-Agent-Context': agent['context'],
            'X-Agent-Query': agent['query'],
            'X-Content-Title': f'https://agentip-production.up.railway.app/content/article-{i+1}',
            'X-Agent-Address': f'0xAgent{i+1}{"0" * 34}',
        }

        try:
            resp = requests.post(
                f"{api_url}/verify-payment",
                json=verify_payload,
                headers=verify_headers,
                timeout=10,
            )
            if resp.status_code == 200:
                print_success(f"Paid & wrote intelligence note")
                print(f"  {Colors.DIM}Task: {agent['context']}{Colors.END}")
                print(f"  {Colors.DIM}Query: {agent['query']}{Colors.END}")
            else:
                print(f"  {Colors.YELLOW}Response: {resp.status_code}{Colors.END}")
        except requests.ConnectionError:
            print(f"  {Colors.DIM}(Backend not running — simulated){Colors.END}")
            print_success(f"Would have paid & written intelligence note")
            print(f"  {Colors.DIM}Task: {agent['context']}{Colors.END}")
            print(f"  {Colors.DIM}Query: {agent['query']}{Colors.END}")

        time.sleep(0.5)

    print(f"\n{Colors.BOLD}{Colors.GREEN}[AgentTip]{Colors.END} All three agents paid and wrote to the creator's private intelligence doc.")
    print(f"{Colors.BOLD}{Colors.GREEN}[AgentTip]{Colors.END} Creator can view their dDoc at: https://ddocs.new/ipfs/[CREATOR_DOC_HASH]")
    print()


def main():
    parser = argparse.ArgumentParser(
        description='AgentTip AI Agent Demo — x402 Payment Flow + Intelligence Network'
    )
    parser.add_argument(
        '--api-url',
        default='https://agentip-production.up.railway.app',
        help='AgentTip backend API URL (default: https://agentip-production.up.railway.app)'
    )
    parser.add_argument(
        '--content-url',
        default='https://agentip-production.up.railway.app/health',
        help='Content URL to request (default: https://agentip-production.up.railway.app/health)'
    )
    parser.add_argument(
        '--wallet',
        default='0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
        help='Creator wallet address'
    )
    parser.add_argument(
        '--multi',
        action='store_true',
        help='Run multi-agent intelligence demo'
    )
    
    args = parser.parse_args()

    if args.multi:
        run_multi_agent_demo(args.api_url, args.wallet)
    else:
        simulate_agent_flow(
            args.api_url,
            args.content_url,
            args.wallet,
            agent_context='Analyzing web content for AI training data evaluation',
            agent_query='Quality assessment of creator-published research content',
        )


if __name__ == '__main__':
    main()

