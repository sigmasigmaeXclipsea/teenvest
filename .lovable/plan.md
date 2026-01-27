
# Fix Leaderboard Display Labels

## Problem Identified
The leaderboard is functioning correctly - the `get_leaderboard()` RPC returns accurate `total_value` (cash + holdings). However, there are two issues:

1. **Incorrect Label**: The top 3 cards show the `total_value` but label it as "Cash Balance" (line 135), which is misleading
2. **Description Text**: The card description says "Top 10 performers by cash growth" but should say "by portfolio value"

## Root Cause
The leaderboard database function is correct and returns the proper `total_value`. The issue is purely in the frontend labels.

## Implementation Plan

### Step 1: Fix the Top 3 Cards Label
Update `LeaderboardPage.tsx` line 135:
- Change `<p className="text-xs text-muted-foreground mt-1">Cash Balance</p>` 
- To: `<p className="text-xs text-muted-foreground mt-1">Total Portfolio Value</p>`

### Step 2: Fix the Card Description
Update `LeaderboardPage.tsx` line 157:
- Change `'Top 10 performers by cash growth'`
- To: `'Top 10 performers by portfolio value'`

### Technical Details
No database changes required - the `get_leaderboard()` function is already correctly calculating:
- `total_value` = cash_balance + holdings_value (valued at last trade price)
- `gain_percent` = ((total_value - starting_balance) / starting_balance) * 100

The fix is purely cosmetic - updating two text labels to accurately reflect what the values represent.

### Files to Modify
- `src/pages/LeaderboardPage.tsx` (2 small text changes)
