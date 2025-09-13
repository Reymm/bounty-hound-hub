-- Fix the messages table UPDATE policy to allow users to mark their received messages as read
DROP POLICY IF EXISTS "Users can mark received messages as read" ON public.messages;

-- Create proper policy to allow users to mark their received messages as read
CREATE POLICY "Users can mark received messages as read" 
ON public.messages 
FOR UPDATE 
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());