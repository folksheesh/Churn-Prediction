import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-[#fafafa]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
