import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useComments } from '@/hooks/useComments';
import { X, Image as ImageIcon, Send } from 'lucide-react'; // Added Send icon
import { useToast } from '@/hooks/use-toast';
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
import { Separator } from '@/components/ui/separator'; // For separating comment types
import { useCustomerReports } from '@/hooks/useCustomerReports'; // To get customer report content
import HtmlVariableDisplay from '@/components/HtmlVariableDisplay'; // To display HTML content
import { Incident } from '@/hooks/useIncidents'; // Import Incident interface

interface AddCommentFormProps {
  incidentId: string;
  author: string;
  incident: Incident; // Accept incident object
  onSendEmail: (comment: string, reportHtml: string) => Promise<void>; // New prop for sending email
  isSendingEmail: boolean; // New prop for email sending status
}

export const AddCommentForm: React.FC<AddCommentFormProps> = ({ incidentId, author, incident, onSendEmail, isSendingEmail }) => {
  const [message, setMessage] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [commentType, setCommentType] = useState<'internal' | 'customer'>('internal'); // New state for comment type
  const [showEmailPreview, setShowEmailPreview] = useState(false); // State for email preview modal
  const { addComment, uploadImage, isUploading } = useComments(incidentId);
  const { toast } = useToast();
  const { data: customerReport } = useCustomerReports(incidentId); // Fetch customer report

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only image files are allowed",
        variant: "destructive"
      });
    }

    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddComment = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a comment message",
        variant: "destructive"
      });
      return;
    }

    try {
      // Upload images first
      const uploadedImageUrls = [];
      for (const image of selectedImages) {
        const url = await uploadImage(image);
        uploadedImageUrls.push(url);
      }

      await addComment.mutateAsync({
        message: message.trim(),
        author,
        images: uploadedImageUrls,
        type: commentType // Pass the selected comment type
      });

      setMessage('');
      setSelectedImages([]);
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully"
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={commentType === 'internal' ? 'default' : 'ghost'}
            onClick={() => setCommentType('internal')}
            size="sm"
          >
            Add internal note
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant={commentType === 'customer' ? 'default' : 'ghost'}
            onClick={() => setCommentType('customer')}
            size="sm"
          >
            Reply to customer
          </Button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="space-y-4">
          <div>
            <Textarea
              placeholder={commentType === 'internal' ? "Add an internal note..." : "Reply to customer..."}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add Images
                  </span>
                </Button>
              </label>
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {selectedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end items-center gap-2">
            {commentType === 'customer' && (
              <AlertDialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!message.trim() || isSendingEmail}
                    onClick={() => setShowEmailPreview(true)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send as Email
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="max-w-5xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Email Preview</AlertDialogTitle>
                    <AlertDialogDescription>
                      Review the email content before sending.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md">
                    <h3 className="font-semibold mb-2">Comment:</h3>
                    <p className="mb-4 whitespace-pre-wrap">{message.trim()}</p>
                    <h3 className="font-semibold mb-2">Customer Report:</h3>
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
                            message.trim(),
                            customerReport?.[0]?.content_html || ''
                          );
                          await handleAddComment(); // Add comment after email is sent
                          toast({
                            title: "Email Sent & Comment Added",
                            description: "The email has been sent and your comment added successfully."
                          });
                          setShowEmailPreview(false);
                        } catch (error) {
                          console.error('Error sending email:', error);
                          toast({
                            title: "Error",
                            description: "Failed to send email or add comment.",
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
            <Button
              type="submit"
              disabled={addComment.isPending || isUploading || !message.trim()}
            >
              {addComment.isPending || isUploading ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
