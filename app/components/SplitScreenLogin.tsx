'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function SplitScreenLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.replace('/');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT: Your IPFS Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://peach-informal-llama-875.mypinata.cloud/ipfs/bafybeigzf6vg6cjkv4e52czwgacp26ntvhm2qb7u7r3xbrhinxavgd3qou"
          alt="AR Emerged"
          fill
          className="object-cover"
          unoptimized
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 " />
        
        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white text-center max-w-2xl ">
            <h1 className="text-7xl bg-white/20 backdrop-blur-md rounded-2xl px-8 py-4 font-bold mb-6 tracking-tight  drop-shadow-2xl">
              ARt Emerged
            </h1>
            <p className="text-3xl bg-white/20 backdrop-blur-md rounded-2xl px-8 py-4 font-light leading-relaxed drop-shadow-lg">
              Create immersive AR experiences in minutes. No code. No limits.
            </p>
            <div className="mt-12 flex justify-center">
              <div className="bg-white/20 backdrop-blur-md rounded-2xl px-8 py-4">
                <p className="text-xl font-medium">Powered by ARt Emerged • Works on any phone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-10">
            <div className="text-center mb-10">
              
              <h2 className="text-4xl font-bold text-gray-900 mt-6">Welcome Back</h2>
              <p className="text-gray-600 mt-2">Sign in to your AR empire</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-purple-600 transition text-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-purple-600 transition text-lg"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xl py-5 rounded-2xl transition transform hover:scale-105 shadow-xl disabled:opacity-70"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center mt-10 text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-purple-600 font-bold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}