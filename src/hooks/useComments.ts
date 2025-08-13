
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Comment {
  id: string;
  message: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
  images?: string[];
}

export const useComments = (incidentId: string) => {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `comments/${incidentId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('incident-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('incident-files')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const addComment = useMutation({
    mutationFn: async ({ 
      message, 
      author, 
      images = [] 
    }: { 
      message: string; 
      author: string; 
      images?: string[] 
    }) => {
      const newComment: Comment = {
        id: `comment-${Date.now()}-${Math.random().toString(36).substring(2)}`,
        message,
        author,
        createdAt: new Date().toISOString(),
        images
      };

      // Get current comments
      const { data: incident } = await supabase
        .from('incidents')
        .select('comments')
        .eq('incident_id', incidentId)
        .single();

      const currentComments = incident?.comments || [];
      const updatedComments = [...currentComments, JSON.stringify(newComment)];

      const { error } = await supabase
        .from('incidents')
        .update({ 
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('incident_id', incidentId);

      if (error) throw error;

      return newComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ 
      commentId, 
      message, 
      images = [] 
    }: { 
      commentId: string; 
      message: string; 
      images?: string[] 
    }) => {
      // Get current comments
      const { data: incident } = await supabase
        .from('incidents')
        .select('comments')
        .eq('incident_id', incidentId)
        .single();

      const currentComments = incident?.comments || [];
      const updatedComments = currentComments.map((commentStr: string) => {
        const comment = JSON.parse(commentStr);
        if (comment.id === commentId) {
          return JSON.stringify({
            ...comment,
            message,
            images,
            updatedAt: new Date().toISOString()
          });
        }
        return commentStr;
      });

      const { error } = await supabase
        .from('incidents')
        .update({ 
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('incident_id', incidentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      // Get current comments
      const { data: incident } = await supabase
        .from('incidents')
        .select('comments')
        .eq('incident_id', incidentId)
        .single();

      const currentComments = incident?.comments || [];
      const updatedComments = currentComments.filter((commentStr: string) => {
        const comment = JSON.parse(commentStr);
        return comment?.id !== commentId;
      });

      const { error } = await supabase
        .from('incidents')
        .update({ 
          comments: updatedComments,
          updated_at: new Date().toISOString()
        })
        .eq('incident_id', incidentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incident', incidentId] });
    },
  });

  return {
    addComment,
    updateComment,
    deleteComment,
    uploadImage,
    isUploading
  };
};
