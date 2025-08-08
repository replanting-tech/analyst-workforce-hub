
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, BarChart3 } from 'lucide-react';

export function CustomerPortalReport() {
  const reportTypes = [
    {
      title: 'Incident Summary Report',
      description: 'Weekly summary of all security incidents',
      lastGenerated: '2025-08-07',
      format: 'PDF'
    },
    {
      title: 'Security Metrics Dashboard',
      description: 'Monthly security performance metrics',
      lastGenerated: '2025-08-01',
      format: 'PDF'
    },
    {
      title: 'Threat Analysis Report',
      description: 'Detailed analysis of detected threats',
      lastGenerated: '2025-08-06',
      format: 'PDF'
    },
    {
      title: 'Compliance Report',
      description: 'Security compliance status report',
      lastGenerated: '2025-07-31',
      format: 'PDF'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">24</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">8</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Downloads</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">156</p>
              </div>
              <Download className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Analytics</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((report, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span>Last generated: {report.lastGenerated}</span>
                        <span>Format: {report.format}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Custom Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Incident Summary</option>
                  <option>Security Metrics</option>
                  <option>Threat Analysis</option>
                  <option>Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Custom range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
              </div>
            </div>
            <Button className="w-full md:w-auto">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
