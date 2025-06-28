"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useUpdateProfile } from "@/lib/hooks/use-auth-mutations";
import { supabase } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Email preferences state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [preferencesMessage, setPreferencesMessage] = useState({
    type: "",
    text: "",
  });

  const queryClient = useQueryClient();

  // Email preferences hooks
  const { data: emailPrefs, isLoading: prefsLoading } = useQuery({
    queryKey: ["emailPreferences", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("email_notifications")
        .eq("id", user.id)
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user?.id,
  });

  const updateEmailPreferences = useMutation({
    mutationFn: async (preferences: { email_notifications?: boolean }) => {
      if (!user?.id) throw new Error("User not found");

      const { error } = await supabase
        .from("profiles")
        .update(preferences)
        .eq("id", user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["emailPreferences", user?.id],
      });
      setPreferencesMessage({
        type: "success",
        text: "Email preferences updated successfully",
      });
      setTimeout(() => setPreferencesMessage({ type: "", text: "" }), 3000);
    },
    onError: (error) => {
      setPreferencesMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update preferences",
      });
    },
  });

  useEffect(() => {
    if (user) {
      // Get user metadata
      const metadata = user.user_metadata || {};
      setFullName(metadata.full_name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (emailPrefs) {
      setEmailNotifications(emailPrefs.email_notifications ?? true);
    }
  }, [emailPrefs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      // Update user profile with new full name
      await updateProfile.mutateAsync({ full_name: fullName });

      setMessage({ type: "success", text: "Profile updated successfully" });
      setIsEditing(false);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to update profile",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h1 className="text-lg leading-6 font-medium text-gray-900">Profile</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Your personal information
        </p>
      </div>

      <div className="border-t border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          {message.text && (
            <div
              className={`mb-4 p-3 rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={email}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Email cannot be changed
                </p>
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full name
                </label>
                <input
                  type="text"
                  name="fullName"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={!isEditing}
                  className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 sm:text-sm ${
                    isEditing
                      ? "focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      : "bg-gray-50 text-gray-500"
                  }`}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updateProfile.isPending}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {updateProfile.isPending ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Email Preferences Section */}
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Email Preferences
        </h2>

        {preferencesMessage.text && (
          <div
            className={`mb-4 p-3 rounded ${
              preferencesMessage.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {preferencesMessage.text}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-sm text-gray-500">
                Receive email notifications for simulation completion and other
                important updates
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email-notifications"
                checked={emailNotifications}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  setEmailNotifications(enabled);
                  updateEmailPreferences.mutate({
                    email_notifications: enabled,
                  });
                }}
                disabled={prefsLoading || updateEmailPreferences.isPending}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          {!emailNotifications && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              <p>
                Email notifications are disabled. You won't receive emails when
                your simulations complete.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Account Security
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Password</h3>
              <p className="text-sm text-gray-500">Update your password</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
