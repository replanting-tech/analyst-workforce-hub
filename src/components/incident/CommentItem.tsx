
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useComments, Comment } from '@/hooks/useComments';
import { Edit2, Trash2, Save, X, Image as ImageIcon, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge'; // For comment type badge
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // For email preview
import { useCustomerReports } from '@/hooks/useCustomerReports'; // To get customer report content
import HtmlVariableDisplay from '@/components/HtmlVariableDisplay'; // To display HTML content
import { Incident } from '@/hooks/useIncidents'; // Import Incident interface

interface CommentItemProps {
  comment: Comment;
  incidentId: string;
  currentUser: string;
  canEdit?: boolean;
  incident: Incident; // Accept incident object
  onSendEmail: (comment: string, reportHtml: string) => Promise<void>; // New prop for sending email
  isSendingEmail: boolean; // New prop for email sending status
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  incidentId,
  currentUser,
  canEdit = true,
  incident, // Destructure incident
  onSendEmail, // Destructure onSendEmail
  isSendingEmail // Destructure isSendingEmail
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(comment.message);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false); // State for email preview modal
  const { updateComment, deleteComment, uploadImage, isUploading } = useComments(incidentId);
  const { toast } = useToast();
  const { data: customerReport } = useCustomerReports(incidentId); // Fetch customer report

  const isOwner = comment.author === currentUser;
  const canEditComment = canEdit && isOwner;

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setSelectedImages(imageFiles);
  };

  const handleSave = async () => {
    if (!editMessage.trim()) {
      toast({
        title: "Message required",
        description: "Comment message cannot be empty",
        variant: "destructive"
      });
      return;
    }

    try {
      let updatedImages = comment.images || [];
      
      // Upload new images if any
      if (selectedImages.length > 0) {
        const uploadedUrls = [];
        for (const image of selectedImages) {
          const url = await uploadImage(image);
          uploadedUrls.push(url);
        }
        updatedImages = [...updatedImages, ...uploadedUrls];
      }

      await updateComment.mutateAsync({
        commentId: comment.id,
        message: editMessage.trim(),
        images: updatedImages
      });

      setIsEditing(false);
      setSelectedImages([]);
      
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully"
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await deleteComment.mutateAsync(comment.id);
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

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
      <CardContent className="pt-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{comment.author}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(comment.createdAt)}
                {comment.updatedAt && ' (edited)'}
              </p>
              <Badge
                variant={comment.type === 'internal' ? 'secondary' : 'default'}
                className="mt-1"
              >
                {comment.type === 'internal' ? 'Internal Note' : 'Reply to Customer'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {comment.type === 'customer' && (
                <AlertDialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowEmailPreview(true)}
                      disabled={isSendingEmail}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Email Preview</AlertDialogTitle>
                      <AlertDialogDescription>
                        Review the email content before sending.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md">
                      <h3 className="font-semibold mb-2">Comment:</h3>
                      <p className="mb-4 whitespace-pre-wrap">{comment.message}</p>
                      <h3 className="font-semibold mb-2">Customer Report Content:</h3>
                      {customerReport?.[0]?.content_html ? (
                        <HtmlVariableDisplay
                          content={customerReport[0].content_html}
                          isEditMode={false}
                          variableName="customer_report_html"
                        />
                      ) : (
                        <p className="text-muted-foreground">No customer report content available.</p>
                      )}
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowEmailPreview(false)}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          try {
                            await onSendEmail(
                              comment.message,
                              customerReport?.[0]?.content_html || ''
                            );
                            toast({
                              title: "Email Sent",
                              description: "The email has been sent successfully."
                            });
                            setShowEmailPreview(false);
                          } catch (error) {
                            console.error('Error sending email:', error);
                            toast({
                              title: "Error",
                              description: "Failed to send email.",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Send Email
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canEditComment && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteComment.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              
              {/* Image Upload for Edit */}
              <div>
                <label htmlFor={`image-upload-${comment.id}`} className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Add Images
                    </span>
                  </Button>
                </label>
                <input
                  id={`image-upload-${comment.id}`}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              {/* Selected Images Preview */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedImages.map((file, index) => (
                    <img
                      key={index}
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateComment.isPending || isUploading}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {updateComment.isPending || isUploading ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditMessage(comment.message);
                    setSelectedImages([]);
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
              
              {/* Images */}
              {comment.images && comment.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {comment.images.map((imageUrl, index) => (
                    <a
                      key={index}
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={imageUrl}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-24 object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
