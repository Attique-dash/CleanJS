'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Package, Search, BarChart3, Users, FileText, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      window.location.href = `/dashboard/tracking/${encodeURIComponent(trackingNumber.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Tasoko Package Management</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Complete Package
            <span className="text-blue-600"> Management Solution</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your shipping operations with our comprehensive package management system. 
            Track packages, manage customers, and integrate seamlessly with Tasoko.
          </p>

          {/* Quick Track Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto mb-16">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Package Tracking</h3>
            <form onSubmit={handleTrackingSubmit} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter tracking number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Track
              </button>
            </form>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Package Management</h3>
            <p className="text-gray-600">Complete package lifecycle management from receipt to delivery.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Reports</h3>
            <p className="text-gray-600">Comprehensive reporting and analytics for business insights.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Management</h3>
            <p className="text-gray-600">Manage customer profiles and service preferences efficiently.</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-orange-100 rounded-lg p-3 w-fit mb-4">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Manifest Management</h3>
            <p className="text-gray-600">Create and manage shipping manifests with full tracking.</p>
          </div>
        </div>

        {/* Tasoko Integration Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Seamless Tasoko Integration
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Our system integrates perfectly with Tasoko's API requirements, providing real-time 
                synchronization of packages, customers, and manifests.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Customer endpoint compliance</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Package webhook handling</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Manifest synchronization</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Real-time status updates</span>
                </div>
              </div>

              <Link 
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border">
                  <span className="text-green-600 font-mono">GET</span>
                  <span className="ml-2 text-gray-600">/api/tasoko/customers</span>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-blue-600 font-mono">POST</span>
                  <span className="ml-2 text-gray-600">/api/tasoko/packages</span>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-blue-600 font-mono">POST</span>
                  <span className="ml-2 text-gray-600">/api/tasoko/manifest</span>
                </div>
                <div className="bg-white p-3 rounded border">
                  <span className="text-orange-600 font-mono">PUT</span>
                  <span className="ml-2 text-gray-600">/api/tasoko/packages/update</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6" />
              <span className="text-lg font-semibold">Tasoko Package Management</span>
            </div>
            <p className="text-gray-400">© 2024 All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
