# RPC Error Fix - Complete Guide

## Problem Summary
After changing the RPC URL in Vercel environment variables, the app still showed "chain is not available on free plan, please upgrade to paid plan" error from `https://sepolia.drpc.org` after 1-2 successful transactions.

## Root Causes Found

### **Issue 1: Three Different RPC Endpoints in Three Places**
Your app had conflicting RPC configurations:

1. **`app/providers.tsx`** (Wagmi config)
   - RPC: `process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.gateway.tenderly.co"`
   - Used for: Wallet transactions (primary)

2. **`lib/viem.ts`** (Public client)
   - RPC: `process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia.publicnode.com"` ❌ DIFFERENT FALLBACK
   - Used for: Transaction receipts, block data

3. **`components/WalletInfo.tsx`** (Balance fetching)
   - RPC: `http()` with NO URL ❌ DEFAULTS TO FREE ENDPOINT
   - Used for: Balance checks (triggers after ~1-2 txns when component re-renders)

### **Issue 2: No Centralized RPC Configuration**
Each component recreated the public client independently, leading to inconsistency and the wrong fallback being used when `NEXT_PUBLIC_RPC_URL` wasn't set.

## Fixes Applied

### **Fix 1: Centralized RPC Configuration** ✅
Created a single source of truth in `lib/viem.ts`:

```typescript
// ✅ CENTRALIZED RPC CONFIG
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.gateway.tenderly.co";

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});
```

### **Fix 2: Updated WalletInfo Component** ✅
Imported and used the centralized `RPC_URL`:

```typescript
import { RPC_URL } from "@/lib/viem";

// In balance fetch:
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),  // ✅ Now uses centralized config
});
```

### **Fix 3: Standardized Fallback RPCs** ✅
All files now use `https://sepolia.gateway.tenderly.co` as fallback (Tenderly free tier is reliable for Sepolia).

## Why This Works

1. **No More Conflicts**: Only ONE RPC endpoint per environment
2. **Consistent Fallback**: All components use Tenderly when `NEXT_PUBLIC_RPC_URL` is missing
3. **Easy to Update**: Change the RPC once in `lib/viem.ts` and it propagates everywhere
4. **Balance Check Fixed**: Wallet balance fetches now use the correct RPC instead of the free DRPC endpoint

## Testing the Fix

After deploying these changes:

1. Connect your wallet
2. Create an appointment (transaction 1)
3. Wait for confirmation
4. Create another appointment (transaction 2)
5. ✅ Balance should display correctly without DRPC errors

## Environment Variables

Ensure your Vercel project has:
```
NEXT_PUBLIC_RPC_URL = https://your-paid-rpc-endpoint.com
```

If not set, the app will use Tenderly's free tier as fallback.

## Files Changed

- ✅ `lib/viem.ts` - Added centralized `RPC_URL` export
- ✅ `components/WalletInfo.tsx` - Now imports and uses `RPC_URL`
- ✅ `app/providers.tsx` - Already correct (uses Tenderly fallback)

## RPC Endpoints Reference

| Endpoint | Free Tier | Rate Limit | Best For |
|----------|-----------|-----------|----------|
| Tenderly | ✅ 10,000/day | Good | General use (recommended) |
| PublicNode | ✅ Limited | Low | Backup only |
| DRPC.org | ✅ Limited | Very Low | ❌ Not recommended (paid plan required after free quota) |
| Infura | ❌ Need API key | High | Professional use |
| Alchemy | ❌ Need API key | High | Professional use |

## Prevention Going Forward

When adding new components that fetch data:
1. **Always import `RPC_URL`** from `lib/viem.ts`
2. **Never create a public client without specifying the RPC URL**
3. **Never rely on default `http()` behavior** - it can switch to random endpoints

Example template for new components:
```typescript
import { RPC_URL } from "@/lib/viem";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

// ✅ Correct way
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});
```
