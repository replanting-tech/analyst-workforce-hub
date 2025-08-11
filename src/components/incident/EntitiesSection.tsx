
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Monitor, Hash, Globe } from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  kind: string;
  properties: any;
}

interface EntitiesSectionProps {
  entities?: string[];
}

const EntitiesSection: React.FC<EntitiesSectionProps> = ({ entities }) => {
  const parseEntities = (entitiesArray?: string[]): Entity[] => {
    if (!entitiesArray || entitiesArray.length === 0) return [];
    
    return entitiesArray.map(entityStr => {
      try {
        return JSON.parse(entityStr);
      } catch (error) {
        console.error('Error parsing entity:', error);
        return null;
      }
    }).filter(Boolean);
  };

  const parsedEntities = parseEntities(entities);

  const getEntityIcon = (kind: string) => {
    switch (kind.toLowerCase()) {
      case 'account':
        return <Users className="w-4 h-4" />;
      case 'file':
      case 'filehash':
        return <FileText className="w-4 h-4" />;
      case 'host':
        return <Monitor className="w-4 h-4" />;
      case 'ip':
        return <Globe className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  const getEntityColor = (kind: string) => {
    switch (kind.toLowerCase()) {
      case 'account':
        return 'bg-blue-100 text-blue-800';
      case 'file':
      case 'filehash':
        return 'bg-purple-100 text-purple-800';
      case 'host':
        return 'bg-green-100 text-green-800';
      case 'ip':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayValue = (entity: Entity) => {
    const props = entity.properties;
    
    switch (entity.kind.toLowerCase()) {
      case 'account':
        return props.displayName || props.accountName || 'Unknown Account';
      case 'file':
        return props.fileName || 'Unknown File';
      case 'filehash':
        return props.hashValue?.substring(0, 16) + '...' || 'Unknown Hash';
      case 'host':
        return props.hostName || 'Unknown Host';
      case 'ip':
        return props.address || 'Unknown IP';
      default:
        return props.friendlyName || entity.name || 'Unknown Entity';
    }
  };

  if (parsedEntities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Entities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Users className="mx-auto h-12 w-12 mb-4" />
            <p>No entities found for this incident</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Entities ({parsedEntities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {parsedEntities.map((entity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className={`p-2 rounded ${getEntityColor(entity.kind)}`}>
                {getEntityIcon(entity.kind)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {entity.kind}
                  </Badge>
                </div>
                <p className="text-sm font-medium truncate" title={getDisplayValue(entity)}>
                  {getDisplayValue(entity)}
                </p>
                {entity.properties.friendlyName && entity.properties.friendlyName !== getDisplayValue(entity) && (
                  <p className="text-xs text-muted-foreground truncate" title={entity.properties.friendlyName}>
                    {entity.properties.friendlyName}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default EntitiesSection;
