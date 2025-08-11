
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, BarChart3, Loader2 } from 'lucide-react';
import { useCustomerReports } from '@/hooks/useCustomerReports';

interface CustomerPortalReportProps {
  customerId: string;
}

export function CustomerPortalReport({ customerId }: CustomerPortalReportProps) {
  const { data: reports = [], isLoading, error } = useCustomerReports(customerId);
  const [generatingReport, setGeneratingReport] = useState(false);

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'incident_summary':
        return 'Incident Summary Report';
      case 'security_metrics':
        return 'Security Metrics Dashboard';
      case 'threat_analysis':
        return 'Threat Analysis Report';
      case 'compliance':
        return 'Compliance Report';
      default:
        return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReport(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading reports: {error.message}</p>
      </div>
    );
  }

  // Calculate stats from reports
  const totalReports = reports.length;
  const thisMonthReports = reports.filter(r => 
    new Date(r.generated_at).getMonth() === new Date().getMonth()
  ).length;
  const completedReports = reports.filter(r => r.status === 'completed').length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalReports}</p>
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
                <p className="text-3xl font-bold text-gray-900 mt-2">{thisMonthReports}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{completedReports}</p>
              </div>
              <Download className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Report Types</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">4</p>
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
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No reports available yet.</p>
              <p className="text-sm text-gray-400">Generate your first report below.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((report) => (
                <Card key={report.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{report.report_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getReportTypeLabel(report.report_type)}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-xs text-gray-500">
                            Generated: {new Date(report.generated_at).toLocaleDateString()}
                          </span>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        {report.report_data && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <p>Data: {JSON.stringify(report.report_data, null, 2)}</p>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="outline" disabled={report.status !== 'completed'}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                  <option value="incident_summary">Incident Summary</option>
                  <option value="security_metrics">Security Metrics</option>
                  <option value="threat_analysis">Threat Analysis</option>
                  <option value="compliance">Compliance</option>
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
            <Button 
              className="w-full md:w-auto" 
              onClick={handleGenerateReport}
              disabled={generatingReport}
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Report'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}