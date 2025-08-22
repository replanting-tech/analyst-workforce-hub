import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, Pie, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useIncidents } from '@/hooks/useIncidents';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { FileText, CheckCircle, AlertTriangle } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const L3Dashboard = () => {
  const { role: userRole } = useAuth();
  const { data: allIncidents = [], isLoading: incidentsLoading } = useIncidents({
    userRole,
    analystCode: null // L3 dashboard shows all incidents
  });

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  const casesMetrics = useMemo(() => {
    return {
      open: 86, // Dummy data from UI
      closed: 31, // Dummy data from UI
      riskAccepted: 0, // Dummy data from UI
      modelReviewed: 0, // Dummy data from UI
    };
  }, []);

  const threatDistributionData = useMemo(() => {
    // Dummy data for Threat Distribution based on UI
    return [
      { name: 'Categories', value: 400 },
      { name: 'Resources', value: 300 },
      { name: 'MITRE', value: 30 },
      { name: 'Compliance', value: 20 },
      { name: 'Kill Chain', value: 50 },
    ];
  }, []);

  const COLORS = ['#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#AF19FF']; // Adjusted colors to match UI legend

  const casesOverTimeData = useMemo(() => {
    // Dummy data for Cases Over Time (detection chart) based on UI
    return [
      { date: '12-22', high: 5, critical: 1 },
      { date: '12-23', high: 8, critical: 0 },
      { date: '12-24', high: 19, critical: 0 },
      { date: '12-25', high: 16, critical: 0 },
      { date: '12-26', high: 19, critical: 0 },
      { date: '12-27', high: 1, critical: 0 },
      { date: '12-28', high: 0, critical: 0 },
      { date: '12-29', high: 0, critical: 0 },
      { date: '12-30', high: 0, critical: 0 },
      { date: '12-31', high: 0, critical: 0 },
      { date: '01-01', high: 0, critical: 0 },
      { date: '01-02', high: 0, critical: 0 },
      { date: '01-03', high: 0, critical: 0 },
      { date: '01-04', high: 0, critical: 0 },
      { date: '01-05', high: 0, critical: 0 },
      { date: '01-06', high: 0, critical: 0 },
      { date: '01-07', high: 0, critical: 0 },
      { date: '01-08', high: 0, critical: 0 },
      { date: '01-09', high: 0, critical: 0 },
      { date: '01-10', high: 0, critical: 0 },
      { date: '01-11', high: 0, critical: 0 },
      { date: '01-12', high: 0, critical: 0 },
      { date: '01-13', high: 0, critical: 0 },
      { date: '01-14', high: 0, critical: 0 },
      { date: '01-15', high: 0, critical: 0 },
      { date: '01-16', high: 0, critical: 0 },
      { date: '01-17', high: 0, critical: 0 },
      { date: '01-18', high: 0, critical: 0 },
      { date: '01-19', high: 0, critical: 0 },
      { date: '01-20', high: 6, critical: 0 },
    ];
  }, []);


  if (incidentsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-900 text-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="text-2xl font-bold">Cases</div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 rounded-full text-sm bg-gray-700 hover:bg-gray-600">PREVIOUS WEEK</button>
            <button className="px-3 py-1 rounded-full text-sm bg-gray-700 hover:bg-gray-600">PREVIOUS MONTH</button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">From 12/21/2023 to 01/19/2024</span>
          <FileText className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Cases Metrics - Directly displayed */}
      <div className="flex items-center space-x-8 mb-8">
        <div>
          <div className="text-5xl font-bold">{casesMetrics.open}</div>
          <div className="text-sm text-gray-400">OPEN</div>
        </div>
        <div>
          <div className="text-5xl font-bold">{casesMetrics.closed}</div>
          <div className="text-sm text-gray-400">CLOSED</div>
        </div>
        <div>
          <div className="text-5xl font-bold">{casesMetrics.riskAccepted}</div>
          <div className="text-sm text-gray-400">RISK ACCEPTED</div>
        </div>
        <div>
          <div className="text-5xl font-bold">{casesMetrics.modelReviewed}</div>
          <div className="text-sm text-gray-400">MODEL REVIEWED</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gray-800 border-none col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              high: {
                label: "High",
                color: "hsl(47.9 95.8% 53.1%)", // Yellow
              },
              critical: {
                label: "Critical",
                color: "hsl(0 84.2% 60.2%)", // Red
              },
            }} className="w-full h-[170px]">
              <BarChart data={casesOverTimeData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => format(new Date(`2024-${value}`), 'MMM dd')}
                  className="text-gray-400"
                />
                <YAxis className="text-gray-400" />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dashed" />}
                />
                <Legend />
                <Bar dataKey="high" fill="var(--color-high)" radius={4} />
                <Bar dataKey="critical" fill="var(--color-critical)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-none">
          <CardHeader>
            <CardTitle className="text-white">Threat Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[170px]">
            <ChartContainer config={{}} className="w-full h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={threatDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Make it a donut chart
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {threatDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend layout="vertical" align="right" verticalAlign="middle" />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card className="bg-gray-800 border-none">
        <CardHeader>
          <CardTitle className="text-white">All Cases</CardTitle>
          <CardDescription className="text-gray-400">Detailed list of all incidents.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-700 hover:bg-gray-700">
                  <TableHead className="text-gray-300">Case ID</TableHead>
                  <TableHead className="text-gray-300">Customer</TableHead>
                  <TableHead className="text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Creation Time</TableHead>
                  <TableHead className="text-gray-300">Last Updated</TableHead>
                  <TableHead className="text-gray-300">Analyst</TableHead>
                  <TableHead className="text-gray-300">Threat Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allIncidents.map((incident) => (
                  <TableRow key={incident.incident_id} className="hover:bg-gray-700">
                    <TableCell className="font-medium text-white">{incident.incident_number}</TableCell>
                    <TableCell className="text-gray-300">{incident.customer_name}</TableCell>
                    <TableCell className="text-gray-300">{incident.priority}</TableCell>
                    <TableCell className="text-gray-300">{incident.status}</TableCell>
                    <TableCell className="text-gray-300">{format(new Date(incident.creation_time), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-gray-300">{format(new Date(incident.updated_at), 'MMM d, yyyy HH:mm')}</TableCell>
                    <TableCell className="text-gray-300">{incident.analyst_name || 'N/A'}</TableCell>
                    <TableCell className="text-gray-300">{incident.threat_type || 'N/A'}</TableCell>
                  </TableRow>
                ))}
                {allIncidents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-gray-400">
                      No incidents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};