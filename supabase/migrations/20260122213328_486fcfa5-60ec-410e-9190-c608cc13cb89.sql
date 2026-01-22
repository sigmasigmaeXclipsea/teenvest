-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is the owner (hardcoded email for security)
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
      AND email = '2landonl10@gmail.com'
  )
$$;

-- RLS policies for user_roles
-- Only owner can view all roles
CREATE POLICY "Owner can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_owner(auth.uid()));

-- Only owner can insert roles
CREATE POLICY "Owner can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_owner(auth.uid()));

-- Only owner can delete roles
CREATE POLICY "Owner can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_owner(auth.uid()));

-- Create function to get user_id by email (for admin management)
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(_email TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM auth.users WHERE email = _email LIMIT 1
$$;

-- Create function to add admin by email (only owner can call)
CREATE OR REPLACE FUNCTION public.add_admin_by_email(_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_caller_id UUID;
BEGIN
  -- Get the caller's ID
  v_caller_id := auth.uid();
  
  -- Check if caller is owner
  IF NOT public.is_owner(v_caller_id) THEN
    RAISE EXCEPTION 'Only the owner can add admins';
  END IF;
  
  -- Get user_id for the email
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with that email');
  END IF;
  
  -- Insert the admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;

-- Create function to remove admin by email (only owner can call)
CREATE OR REPLACE FUNCTION public.remove_admin_by_email(_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_caller_id UUID;
BEGIN
  -- Get the caller's ID
  v_caller_id := auth.uid();
  
  -- Check if caller is owner
  IF NOT public.is_owner(v_caller_id) THEN
    RAISE EXCEPTION 'Only the owner can remove admins';
  END IF;
  
  -- Get user_id for the email
  SELECT id INTO v_user_id FROM auth.users WHERE email = _email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found with that email');
  END IF;
  
  -- Delete the admin role
  DELETE FROM public.user_roles WHERE user_id = v_user_id AND role = 'admin';
  
  RETURN json_build_object('success', true);
END;
$$;

-- Create function to get all admins (only owner can call)
CREATE OR REPLACE FUNCTION public.get_all_admins()
RETURNS TABLE(user_id UUID, email TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.user_id, u.email, ur.created_at
  FROM public.user_roles ur
  JOIN auth.users u ON ur.user_id = u.id
  WHERE ur.role = 'admin'
    AND public.is_owner(auth.uid())
  ORDER BY ur.created_at DESC
$$;