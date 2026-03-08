
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/insert/update/delete notifications
CREATE POLICY "Allow read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update notifications" ON public.notifications FOR UPDATE USING (true);
CREATE POLICY "Allow delete notifications" ON public.notifications FOR DELETE USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
