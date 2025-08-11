
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, User } from 'lucide-react';

interface CommentData {
  id: string;
  properties: {
    message: string;
    createdTimeUtc: string;
    author: {
      name: string;
      email: string | null;
      userPrincipalName: string;
    };
  };
}

interface CommentsSectionProps {
  comments?: string[];
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ comments }) => {
  const parseComments = (commentsArray?: string[]): CommentData[] => {
    if (!commentsArray || commentsArray.length === 0) return [];
    
    return commentsArray.map(commentStr => {
      try {
        return JSON.parse(commentStr);
      } catch (error) {
        console.error('Error parsing comment:', error);
        return null;
      }
    }).filter(Boolean);
  };

  const parsedComments = parseComments(comments);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (parsedComments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="mx-auto h-12 w-12 mb-4" />
            <p>No comments found for this incident</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({parsedComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {parsedComments.map((comment, index) => (
            <div key={index} className="border-l-4 border-primary/20 pl-4 py-2">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.properties.author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(comment.properties.createdTimeUtc)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
                    {comment.properties.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
