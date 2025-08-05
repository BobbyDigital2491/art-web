/* eslint-disable @next/next/no-html-link-for-pages */
'use client';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// TypeScript interface for profile data
interface Profile {
  display_name: string | null;
  bio: string | null;
  profile_picture: string | null;
}

export default function Profile() {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, profile_picture')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        setError(error.message);
        return;
      }
      if (data) {
        setDisplayName(data.display_name || '');
        setBio(data.bio || '');
        setProfilePictureUrl(data.profile_picture || '');
      }
    };
    fetchProfile();
  }, [router]);

  // Handle file upload with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file (PNG, JPG, etc.).');
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

  // Handle profile update
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('You must be logged in to update your profile.');
      return;
    }

    let profilePicturePath = profilePictureUrl;
    if (profilePicture) {
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('ar-assets')
        .upload(fileName, profilePicture, {
          contentType: profilePicture.type,
        });
      if (uploadError) {
        setError('Failed to upload profile picture: ' + uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage
        .from('ar-assets')
        .getPublicUrl(fileName);
      profilePicturePath = urlData.publicUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        display_name: displayName,
        bio,
        profile_picture: profilePicturePath,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Profile updated successfully!');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <a href="/" className="text-2xl font-bold text-blue-600">ARt Emerged</a>
          <button
            onClick={handleLogout}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Profile Card */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Profile</h1>
          <div className="flex flex-col items-center mb-8">
            {profilePictureUrl ? (
              <Image
                src={profilePictureUrl}
                alt="Profile Picture"
                width={120}
                height={120}
                className="rounded-full object-cover border-2 border-blue-600"
              />
            ) : (
              <Image
                src="https://via.placeholder.com/120?text=Avatar"
                alt="Default Avatar"
                width={120}
                height={120}
                className="rounded-full object-cover border-2 border-gray-300"
              />
            )}
            <h2 className="mt-4 text-xl font-semibold text-gray-700">
              {displayName || 'Set your display name'}
            </h2>
            <p className="mt-2 text-gray-600 text-center">
              {bio || 'Add a bio to tell others about yourself.'}
            </p>
          </div>
          <form onSubmit={handleUpdate} className="space-y-6">
            <div>
              <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                id="display-name"
                className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                placeholder="Enter display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                placeholder="Tell us about yourself"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <label htmlFor="profile-picture" className="block text-sm font-medium text-gray-700">
                Profile Picture
              </label>
              <input
                type="file"
                id="profile-picture"
                accept="image/*"
                className="mt-1 w-full rounded-md border-2 border-gray-300 py-2 px-4 text-gray-700 focus:outline-none focus:border-blue-600 transition"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex justify-center">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-6 py-2 text-base font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Profile
              </button>
            </div>
          </form>
          {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
          {success && <p className="mt-4 text-green-500 text-center">{success}</p>}
        </div>
      </main>
    </div>
  );
}