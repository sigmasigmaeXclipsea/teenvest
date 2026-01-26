
# Admin Panel Fix: Money and XP Management

## Overview
The admin panel currently has broken functionality for updating user cash balances and garden XP. The database functions were never created, and the garden system uses localStorage instead of a database. I'll fix this by:
1. Creating the missing database function for cash balance updates
2. Making the "My Garden State" admin tool work properly with localStorage
3. Keeping the architecture simple since the Garden is localStorage-based

---

## Current Issues

### Cash Balance Update
- The frontend calls `admin_update_cash_balance` but this function doesn't exist in the database
- The mutation code incorrectly passes `_user_id` instead of `_email`

### Garden XP/Money Update
- No `garden_state` table exists in the database
- Garden system uses localStorage only (`garden-state-v4`)
- The admin functions for garden state don't exist in the database
- The "My Garden State" tool only works if you're on the `/garden` page (using custom events)

---

## Solution

### 1. Create Missing Database Function
Create `admin_update_cash_balance` function that accepts email and new balance, updates the user's portfolio, and returns success/failure.

### 2. Fix Cash Balance Mutation
Update the `updateCashBalanceMutation` to pass the correct parameters (`_email` instead of `_user_id`).

### 3. Fix "My Garden State" Admin Tool
Since the Garden uses localStorage, the admin tool needs to directly update localStorage and work without requiring navigation to the garden page:
- Update localStorage directly with the new money/XP values
- Refresh the admin's current garden state display after updating

### 4. Remove Broken "Set User Garden Money/XP" Cards
Since garden data is stored in localStorage (per-browser, not per-user in database), these tools cannot work for other users. Remove them to avoid confusion.

---

## Technical Implementation

### Database Migration
```sql
CREATE OR REPLACE FUNCTION public.admin_update_cash_balance(
    _email TEXT, 
    _new_balance NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Check if caller is admin or owner
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.is_owner(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Get user id from email
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;
  
  -- Update cash balance
  UPDATE public.portfolios 
  SET cash_balance = _new_balance, updated_at = now()
  WHERE user_id = v_user_id;
  
  -- Handle case where portfolio doesn't exist
  IF NOT FOUND THEN
    INSERT INTO public.portfolios (user_id, cash_balance)
    VALUES (v_user_id, _new_balance)
    ON CONFLICT (user_id) DO UPDATE
    SET cash_balance = _new_balance, updated_at = now();
  END IF;
  
  RETURN json_build_object('success', true, 'new_balance', _new_balance);
END;
$$;
```

### Frontend Changes (AdminPage.tsx)

**Fix 1: Update Cash Balance Mutation (lines 342-365)**
- Remove the unnecessary `get_user_id_by_email` lookup
- Pass `_email` directly to the RPC function

**Fix 2: Update "My Garden State" Tool (lines 417-436)**
- Directly update localStorage instead of just dispatching events
- Works regardless of which page you're on
- Refresh the displayed current values after update

**Fix 3: Remove Broken Garden Tools**
- Remove "Set User Garden Money" card (lines 1035-1073)
- Remove "Set User Garden XP" card (lines 1075-1113)
- Remove unused state variables and mutations for other users' garden

---

## Files to Modify

1. **Database**: Create `admin_update_cash_balance` function
2. **src/pages/AdminPage.tsx**: 
   - Fix `updateCashBalanceMutation` to use `_email` parameter
   - Fix `updateCurrentUserGardenMutation` to update localStorage directly
   - Remove broken "Set User Garden Money/XP" cards for other users
   - Clean up unused state variables

---

## Result After Fix
- You can update your own cash balance (My Cash Balance tool)
- You can update any user's cash balance (User Lookup section)
- You can update your own garden money and XP (My Garden State tool)
- The garden XP/money updates will persist in your browser's localStorage
