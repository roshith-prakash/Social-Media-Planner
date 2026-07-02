import { getAuth } from "firebase/auth";
import { axiosInstance } from "../utils/axiosInstance";

// components/youtube/YouTubeLogin.jsx
import React from "react";
import { EyeIcon, EyeSlashIcon, QrCodeIcon } from "@heroicons/react/24/outline";

const YouTubeLogin = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  const handleConnect = async () => {
    const res = await axiosInstance.get("/youtube/login", {
      params: { firebaseUID: user.uid }, // pass firebaseUID here
    });

    window.location.href = res.data.url; // go to Google OAuth
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Email Step */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Sign in
        </h2>
        <p className="text-center text-gray-600 mb-8">to continue to YouTube</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email or phone
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="email"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Phone number, username, or email"
                />
              </div>
            </div>

            <div>
              <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Next
              </button>
            </div>

            <div className="text-center">
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Forgot email?
              </a>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  New to YouTube?
                </span>
              </div>
            </div>
            <div className="mt-6 text-center">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create account
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Password Step - Static Preview */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-12">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <div className="mt-1 text-sm text-gray-500">user@example.com</div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Enter your password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <EyeSlashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-xs text-yellow-600">Caps Lock is on</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked
                />
                <label
                  htmlFor="remember"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Sign in
              </button>
            </div>

            <div className="text-center">
              <button className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 font-medium">
                <QrCodeIcon className="h-4 w-4 mr-1" />
                Use QR code
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Step - Static Preview */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-12">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Use your recovery phone
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                We sent a text message to your phone. Please enter the 6-digit
                code.
              </p>

              <div className="flex justify-center space-x-2 mb-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={i === 0 ? "1" : i === 1 ? "2" : i === 2 ? "3" : ""}
                    className="w-12 h-12 text-center text-lg font-medium border-2 border-blue-500 rounded-md focus:outline-none bg-blue-50"
                    inputMode="numeric"
                  />
                ))}
              </div>
            </div>

            <div className="text-center text-sm text-gray-500">
              Didn't get the code?{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Resend
              </button>
            </div>

            <div>
              <button className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Verify
              </button>
            </div>

            <div className="text-sm">
              <button className="w-full text-blue-600 hover:text-blue-500 font-medium">
                Try another way
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mt-12 text-center">
        <div className="flex justify-center space-x-2 mb-4">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <p className="text-xs text-gray-500">Email → Password → Verification</p>
      </div>
    </div>
  );
};

export default YouTubeLogin;
