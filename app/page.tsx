import { createSupabaseServerClient } from './lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!session || !user) {
    redirect('/login');
  }

  const { data: projects } = await supabase
    .from('ar_assets')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return <DashboardClient initialProjects={projects || []} />;
}