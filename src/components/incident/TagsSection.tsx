
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tag } from 'lucide-react';

interface TagData {
  labelName: string;
  labelType: string;
}

interface TagsSectionProps {
  tags?: string[];
}

const TagsSection: React.FC<TagsSectionProps> = ({ tags }) => {
  const parseTags = (tagsArray?: string[]): TagData[] => {
    if (!tagsArray || tagsArray.length === 0) return [];
    
    return tagsArray.map(tagStr => {
      try {
        return JSON.parse(tagStr);
      } catch (error) {
        console.error('Error parsing tag:', error);
        return { labelName: tagStr, labelType: 'Unknown' };
      }
    }).filter(Boolean);
  };

  const parsedTags = parseTags(tags);

  const getTagColor = (labelType: string) => {
    switch (labelType?.toLowerCase()) {
      case 'user':
        return 'bg-blue-100 text-blue-800';
      case 'system':
        return 'bg-green-100 text-green-800';
      case 'automatic':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (parsedTags.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Tag className="mx-auto h-12 w-12 mb-4" />
            <p>No tags found for this incident</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="w-5 h-5" />
          Tags ({parsedTags.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {parsedTags.map((tag, index) => (
            <Badge 
              key={index} 
              className={`${getTagColor(tag.labelType)} flex items-center gap-1`}
            >
              <Tag className="w-3 h-3" />
              {tag.labelName}
              <span className="text-xs opacity-75">({tag.labelType})</span>
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TagsSection;
