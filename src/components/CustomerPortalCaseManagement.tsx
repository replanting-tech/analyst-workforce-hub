
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, MoreHorizontal, RefreshCw, Download, Settings } from 'lucide-react';

export function CustomerPortalCaseManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);

  const incidents = [
    {
      id: '8815',
      createdTime: '07/08/25 12:10',
      severity: 'High',
      title: 'SERVER-OTHER Sophos Web Appliance and-any command execution at...',
      status: 'New',
      tags: ''
    },
    {
      id: '8811',
      createdTime: '07/08/25 16:47',
      severity: 'High', 
      title: 'Deep Instinct Static Analysis - BraveSoul.exe network tool',
      status: 'New',
      tags: ''
    },
    {
      id: '8810',
      createdTime: '07/08/25 15:29',
      severity: 'High',
      title: 'PROTOCOL-DNS DNS query amplification attempt - High',
      status: 'New',
      tags: ''
    },
    {
      id: '8809',
      createdTime: '07/08/25 12:47',
      severity: 'High',
      title: 'Deep Instinct Static Analysis - BraveSoul.exe network domain tool',
      status: 'New',
      tags: ''
    },
    {
      id: '8805',
      createdTime: '07/08/25 12:29',
      severity: 'High',
      title: 'INDICATOR-SCAN DNS version.bind string information disclosure attem...',
      status: 'New',
      tags: ''
    }
  ];

  const handleSelectIncident = (incidentId: string) => {
    setSelectedIncidents(prev => 
      prev.includes(incidentId)
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIncidents(
      selectedIncidents.length === incidents.length ? [] : incidents.map(i => i.id)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="font-medium">18</span>
              <span className="text-gray-600">Open incidents</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span className="font-medium">18</span>
              <span className="text-gray-600">New incidents</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="font-medium">0</span>
              <span className="text-gray-600">Active incidents</span>
            </div>
            <div className="text-gray-600">Open incidents by severity</div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="font-medium">High (18)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="font-medium">Medium (0)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="font-medium">Low (0)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-600 rounded"></div>
              <span className="font-medium">Informational (0)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by ID, title, tags, owner or product"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Severity:</span>
          <Select defaultValue="all">
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant="secondary">{selectedIncidents.length} selected</Badge>
        </div>

      </div>

      {/* Incidents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIncidents.length === incidents.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>Incident number</TableHead>
                <TableHead>Created time</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIncidents.includes(incident.id)}
                      onChange={() => handleSelectIncident(incident.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-blue-600">
                    {incident.id}
                  </TableCell>
                  <TableCell>{incident.createdTime}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="destructive"
                      className="bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {incident.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.tags || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
