/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import { HiCheckCircle, HiXCircle, HiExternalLink, HiShieldCheck, HiMail, HiGlobe } from 'react-icons/hi';
import { FaTwitter, FaInstagram, FaYoutube } from 'react-icons/fa'; // ← FIXED: Social icons from fa

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  profile_picture: string | null;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  email_public?: boolean;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
  subscription_ends?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [twitter, setTwitter] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  const [emailPublic, setEmailPublic] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        setError(error.message);
      } else if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setTwitter(data.twitter || '');
        setInstagram(data.instagram || '');
        setYoutube(data.youtube || '');
        setWebsite(data.website || '');
        setEmailPublic(data.email_public || false);
        setProfilePictureUrl(data.profile_picture || '');
      }

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5MB.');
        return;
      }
      setProfilePicture(file);
      setError(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setSaving(false);
      return;
    }

    let newPictureUrl = profilePictureUrl;
    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${user.id}/profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ar-assets')
        .upload(fileName, profilePicture, {
          upsert: true,
        });

      if (uploadError) {
        setError('Failed to upload image: ' + uploadError.message);
        setSaving(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('ar-assets')
        .getPublicUrl(fileName);

      newPictureUrl = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        bio,
        profile_picture: newPictureUrl,
        twitter,
        instagram,
        youtube,
        website,
        email_public: emailPublic,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Profile updated!');
      setProfilePicture(null);
      setProfilePictureUrl(newPictureUrl);
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const subscriptionInfo = {
    free: { name: 'Free', projects: 5, storage: '100MB', price: '$0' },
    pro: { name: 'Pro', projects: 50, storage: '10GB', price: '$9/mo' },
    enterprise: { name: 'Enterprise', projects: 'Unlimited', storage: 'Unlimited', price: 'Custom' },
  };

  const currentTier = profile?.subscription_tier || 'free';
  const tier = subscriptionInfo[currentTier];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-yellow-600 mb-6"></div>
          <p className="text-2xl font-bold text-gray-800">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50">
      <Sidebar onToggle={setSidebarCollapsed} />

      <div className={`flex-1 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'} transition-all duration-300`}>
        {/* Header */}
        <header className="bg-white shadow-lg border-b border-gray-200">
          <div className="px-8 py-6 flex justify-between items-center">
            <Link href="/" className="text-4xl font-bold text-yellow-600">
              ARt Emerged
            </Link>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Profile Content */}
        <main className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Your Profile</h1>

              <div className="flex flex-col items-center mb-12">
                <div className="relative">
                  <Image
                    src={profilePictureUrl || '/default-avatar.png'}
                    alt="Profile"
                    width={160}
                    height={160}
                    className="rounded-full ring-8 ring-yellow-200 shadow-2xl"
                    unoptimized
                  />
                  <div className="absolute bottom-3 right-3 w-7 h-7 bg-green-500 rounded-full border-4 border-white"></div>
                </div>
                <h2 className="mt-6 text-3xl font-bold text-gray-900">
                  {displayName || 'Set your name'}
                </h2>
                <p className="mt-3 text-lg text-gray-600 text-center max-w-md">
                  {bio || 'Add a bio to tell the world about your AR creations.'}
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-yellow-600 transition text-lg"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">
                      Website
                    </label>
                    <div className="flex items-center w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus-within:border-yellow-600 transition">
                      <HiGlobe className="h-6 w-6 text-yellow-600 mr-3" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="flex-1 outline-none text-lg"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-yellow-600 transition text-lg"
                    placeholder="Tell us about your AR journey..."
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Social Media
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus-within:border-yellow-600 transition">
                      <FaTwitter className="h-6 w-6 text-blue-400 mr-3" />
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        className="flex-1 outline-none text-lg"
                        placeholder="X @username"
                      />
                    </div>
                    <div className="flex items-center w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus-within:border-yellow-600 transition">
                      <FaInstagram className="h-6 w-6 text-pink-500 mr-3" />
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="flex-1 outline-none text-lg"
                        placeholder="Instagram @username"
                      />
                    </div>
                    <div className="flex items-center w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus-within:border-yellow-600 transition">
                      <FaYoutube className="h-6 w-6 text-red-600 mr-3" />
                      <input
                        type="text"
                        value={youtube}
                        onChange={(e) => setYoutube(e.target.value)}
                        className="flex-1 outline-none text-lg"
                        placeholder="Youtube URL"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-3">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-2xl file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-white file:bg-gradient-to-r file:from-yellow-600 file:to-orange-600 hover:file:from-yellow-700 hover:file:to-orange-700 transition"
                  />
                  <p className="text-sm text-gray-500 mt-2">Max 5MB • PNG, JPG, GIF</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HiShieldCheck className="h-6 w-6 text-yellow-600" />
                    Privacy Settings
                  </h3>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700">Show email on profile</span>
                    <input
                      type="checkbox"
                      checked={emailPublic}
                      onChange={(e) => setEmailPublic(e.target.checked)}
                      className="w-6 h-6 text-yellow-600 rounded focus:ring-yellow-500"
                    />
                  </label>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription</h3>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{tier.name}</p>
                      <p className="text-gray-600">{tier.projects} projects • {tier.storage} storage</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-gray-900">{tier.price}</p>
                      {currentTier !== 'enterprise' && <p className="text-sm text-gray-500">per month</p>}
                    </div>
                  </div>
                  {currentTier === 'free' && (
                    <button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold text-lg py-4 rounded-xl transition transform hover:scale-105">
                      Upgrade to Pro
                    </button>
                  )}
                </div>

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-12 py-5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold text-xl rounded-2xl transition transform hover:scale-105 shadow-2xl disabled:opacity-70"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>

              {success && (
                <div className="mt-8 bg-green-100 text-green-800 px-8 py-4 rounded-2xl text-center font-medium flex items-center justify-center gap-2">
                  <HiCheckCircle className="h-6 w-6" />
                  {success}
                </div>
              )}
              {error && (
                <div className="mt-8 bg-red-100 text-red-800 px-8 py-4 rounded-2xl text-center font-medium flex items-center justify-center gap-2">
                  <HiXCircle className="h-6 w-6" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}