// components/Dashboard.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

const dashboardData = {
  youtube: [
    { date: "Mon", views: 1200, likes: 300 },
    { date: "Tue", views: 2100, likes: 500 },
    { date: "Wed", views: 800, likes: 200 },
    { date: "Thu", views: 1600, likes: 400 },
    { date: "Fri", views: 900, likes: 250 },
  ],
  linkedin: [
    { date: "Mon", clicks: 100, impressions: 500 },
    { date: "Tue", clicks: 150, impressions: 600 },
    { date: "Wed", clicks: 80, impressions: 400 },
    { date: "Thu", clicks: 200, impressions: 700 },
    { date: "Fri", clicks: 120, impressions: 550 },
  ],
  twitter: [
    { date: "Mon", retweets: 20, likes: 50 },
    { date: "Tue", retweets: 40, likes: 80 },
    { date: "Wed", retweets: 30, likes: 60 },
    { date: "Thu", retweets: 25, likes: 45 },
    { date: "Fri", retweets: 50, likes: 100 },
  ],
};

const DashboardCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 flex-1">
    <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
    {children}
  </div>
);

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Social Media Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* YouTube Card */}
        <DashboardCard title="YouTube Stats">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData.youtube}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#FF0000" />
              <Bar dataKey="likes" fill="#FF6347" />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* LinkedIn Card */}
        <DashboardCard title="LinkedIn Stats">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dashboardData.linkedin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="clicks"
                stroke="#0077B5"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="impressions"
                stroke="#00A0DC"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Twitter Card */}
        <DashboardCard title="Twitter (X) Stats">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dashboardData.twitter}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="retweets" fill="#1DA1F2" />
              <Bar dataKey="likes" fill="#0d8ddb" />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total YouTube Views">
          <p className="text-2xl font-bold text-red-600">6,500</p>
        </DashboardCard>

        <DashboardCard title="Total LinkedIn Impressions">
          <p className="text-2xl font-bold text-blue-700">2,750</p>
        </DashboardCard>

        <DashboardCard title="Total Twitter Likes">
          <p className="text-2xl font-bold text-blue-500">335</p>
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;
