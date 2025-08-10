
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { User, Bell, Shield, Globe, Loader2 } from 'lucide-react';
import { useCustomerSettings } from '@/hooks/useCustomerSettings';
import { useToast } from '@/components/ui/use-toast';

interface CustomerUser {
  id: string;
  email: string;
  full_name: string;
  customer_id: string;
  role: string;
}

interface CustomerPortalSettingsProps {
  user: CustomerUser;
}

export function CustomerPortalSettings({ user }: CustomerPortalSettingsProps) {
  const { data: settings = [], isLoading, updateSetting } = useCustomerSettings(user.customer_id);
  const { toast } = useToast();
  const [savingSettings, setSavingSettings] = useState<string | null>(null);

  // Get settings by key
  const getSettingValue = (key: string, defaultValue: any = {}) => {
    const setting = settings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const notificationSettings = getSettingValue('notification_preferences', {
    email_alerts: true,
    sms_alerts: false,
    report_frequency: 'weekly',
    high_severity: true
  });

  const dashboardSettings = getSettingValue('dashboard_preferences', {
    theme: 'light',
    default_view: 'incidents',
    auto_refresh: true,
    timezone: 'UTC',
    date_format: 'DD/MM/YYYY',
    language: 'en'
  });

  const handleSettingUpdate = async (key: string, value: any) => {
    setSavingSettings(key);
    try {
      await updateSetting.mutateAsync({ key, value });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(null);
    }
  };

  const handleNotificationChange = (field: string, value: any) => {
    const updated = { ...notificationSettings, [field]: value };
    handleSettingUpdate('notification_preferences', updated);
  };

  const handleDashboardChange = (field: string, value: any) => {
    const updated = { ...dashboardSettings, [field]: value };
    handleSettingUpdate('dashboard_preferences', updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" defaultValue={user.full_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={user.email} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Badge variant="outline">{user.role}</Badge>
            </div>
            <div className="space-y-2">
              <Label>Customer ID</Label>
              <code className="block p-2 bg-gray-100 rounded text-sm">{user.customer_id}</code>
            </div>
          </div>
          <Button>Update Profile</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notification Preferences</span>
            </div>
            {savingSettings === 'notification_preferences' && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">High Severity Incidents</h4>
                <p className="text-sm text-gray-600">Get notified immediately for high severity incidents</p>
              </div>
              <Switch 
                checked={notificationSettings.high_severity}
                onCheckedChange={(checked) => handleNotificationChange('high_severity', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Alerts</h4>
                <p className="text-sm text-gray-600">Send notifications to email</p>
              </div>
              <Switch 
                checked={notificationSettings.email_alerts}
                onCheckedChange={(checked) => handleNotificationChange('email_alerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">SMS Alerts</h4>
                <p className="text-sm text-gray-600">Send critical alerts via SMS</p>
              </div>
              <Switch 
                checked={notificationSettings.sms_alerts}
                onCheckedChange={(checked) => handleNotificationChange('sms_alerts', checked)}
              />
            </div>
            <div className="space-y-2">
              <Label>Report Frequency</Label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={notificationSettings.report_frequency}
                onChange={(e) => handleNotificationChange('report_frequency', e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Password Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
              </div>
              <Button className="mt-4" variant="outline">Change Password</Button>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <Badge variant="outline">Not Enabled</Badge>
              </div>
              <Button className="mt-2" variant="outline">Enable 2FA</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>System Preferences</span>
            </div>
            {savingSettings === 'dashboard_preferences' && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select 
                id="timezone" 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={dashboardSettings.timezone}
                onChange={(e) => handleDashboardChange('timezone', e.target.value)}
              >
                <option value="UTC">UTC (GMT+0)</option>
                <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <select 
                id="language" 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={dashboardSettings.language}
                onChange={(e) => handleDashboardChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-format">Date Format</Label>
              <select 
                id="date-format" 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={dashboardSettings.date_format}
                onChange={(e) => handleDashboardChange('date_format', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <select 
                id="theme" 
                className="w-full p-2 border border-gray-300 rounded-md"
                value={dashboardSettings.theme}
                onChange={(e) => handleDashboardChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <h4 className="font-medium">Auto Refresh Dashboard</h4>
              <p className="text-sm text-gray-600">Automatically refresh data every 30 seconds</p>
            </div>
            <Switch 
              checked={dashboardSettings.auto_refresh}
              onCheckedChange={(checked) => handleDashboardChange('auto_refresh', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
