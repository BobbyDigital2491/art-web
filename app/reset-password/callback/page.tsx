/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/lib/supabase/client';

export default function ResetPasswordCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          router.push('/reset-password/form');
        } else if (event === 'SIGNED_IN') {
          router.push('/');
        }
      });

      // Cleanup
      return () => {
        listener.subscription.unsubscribe();
      };
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-600 mx-auto mb-4"></div>
        <p className="text-xl text-gray-700">Verifying your reset link...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait</p>
      </div>
    </div>
  );
}