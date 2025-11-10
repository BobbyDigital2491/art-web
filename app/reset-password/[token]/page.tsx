/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPassword() {
  const router = useRouter();
  const { token } = useParams() as { token: string };
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  // Step 1: Verify the recovery token and get the user's email
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Invalid or missing token');
        setVerifying(false);
        return;
      }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

      if (error) {
        console.error('Token verification failed:', error);
        setError('Invalid or expired reset link. Please request a new one.');
      } else if (data.user) {
        console.log('Token verified, user:', data.user.email);
      }
      setVerifying(false);
    };

    verifyToken();
  }, [token]);

  // Step 2: Update password AND sign in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      // Now sign in the user automatically
      const { data: { user }, error: signInError } = await supabase.auth.getUser();
      if (signInError || !user) throw new Error('Failed to sign in after reset');

      setMessage('Password updated! Logging you in...');
      setTimeout(() => {
        router.push('/'); // Go to dashboard — they’ll see their projects!
      }, 1500);
    } catch (err: any) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-700">Verifying reset link...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Set New Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-yellow-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-yellow-700 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-yellow-800 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password & Log In'}
          </button>
        </form>

        {message && <p className="mt-4 text-green-600 text-center">{message}</p>}
        {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-indigo-600 hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}