
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from 'lucide-react';
import { AddCommentForm } from './AddCommentForm';
import { CommentItem } from './CommentItem';
import { Comment } from '@/hooks/useComments';

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
  incidentId: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ comments, incidentId }) => {
  console.log(incidentId);
  const parseComments = (commentsArray?: string[]): Comment[] => {
    if (!commentsArray || commentsArray.length === 0) return [];
    
    return commentsArray.map(commentStr => {
      try {
        const parsed = JSON.parse(commentStr);
        
        // Handle both old Azure Sentinel format and new format
        if (parsed?.properties) {
          // Old Azure Sentinel format
          return {
            id: parsed.id || `legacy-${Date.now()}-${Math.random()}`,
            message: parsed.properties.message,
            author: parsed.properties.author.name,
            createdAt: parsed.properties.createdTimeUtc,
            images: []
          };
        } else {
          // New format
          return parsed as Comment;
        }
      } catch (error) {
        console.error('Error parsing comment:', error);
        return null;
      }
    }).filter(Boolean);
  };

  const parsedComments = parseComments(comments);
  const currentUser = "Current User"; // Replace with actual current user from auth context

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({parsedComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <AddCommentForm incidentId={incidentId} author={currentUser} />
        
        {/* Comments List */}
        {parsedComments.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="mx-auto h-12 w-12 mb-4" />
            <p>No comments yet. Be the first to add a comment!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parsedComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                incidentId={incidentId}
                currentUser={currentUser}
                canEdit={true}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommentsSection;
