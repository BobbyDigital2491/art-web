/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';
import { createClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordCallback() {
  const router = useRouter();

  useEffect(() => {
    // This runs when Supabase redirects back with #access_token=...
    const handleHash = async () => {
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        // @ts-ignore - internal method, but safe and documented
        // See: https://supabase.com/docs/guides/auth/auth-email-password#pkce-flow-for-ssr
        (window.location.hash.match(/access_token=([^&]+)/) || [])[1]
      );

      if (error || !data.session) {
        console.error('Exchange failed:', error);
        router.push('/forgot-password?error=invalid_link');
        return;
      }

      // Check if we're in recovery mode
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.app_metadata?.provider === 'email' && user?.recovery_sent_at) {
        router.push('/reset-password/form');
      } else {
        router.push('/');
      }
    };

    if (window.location.hash.includes('access_token')) {
      handleHash();
    } else {
      router.push('/forgot-password?error=invalid_link');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700 mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Processing your reset link...</p>
      </div>
    </div>
  );
}