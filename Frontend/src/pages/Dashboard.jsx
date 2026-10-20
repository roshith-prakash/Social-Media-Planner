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
  instagram: [
    { date: "Mon", plays: 1500, saves: 120 },
    { date: "Tue", plays: 2800, saves: 340 },
    { date: "Wed", plays: 1900, saves: 210 },
    { date: "Thu", plays: 3200, saves: 490 },
    { date: "Fri", plays: 2400, saves: 310 },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-pink-50 to-red-50 p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Social Media Dashboard (YouTube & Instagram)
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* YouTube Card */}
        <DashboardCard title="YouTube Video Views">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dashboardData.youtube}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="views" fill="#FF0000" radius={[6, 6, 0, 0]} />
              <Bar dataKey="likes" fill="#FF6347" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Instagram Card */}
        <DashboardCard title="Instagram Reels Plays & Saves">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dashboardData.instagram}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="plays"
                stroke="#E1306C"
                strokeWidth={3}
              />
              <Line
                type="monotone"
                dataKey="saves"
                stroke="#833AB4"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard title="Total YouTube Views">
          <p className="text-3xl font-bold text-red-600">6,600</p>
        </DashboardCard>

        <DashboardCard title="Total Instagram Reels Reach">
          <p className="text-3xl font-bold" style={{ color: "#E1306C" }}>11,800</p>
        </DashboardCard>
      </div>
    </div>
  );
};

export default Dashboard;
