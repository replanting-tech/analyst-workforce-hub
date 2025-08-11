
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AnalystEnrichment {
  threatIndicatorIP?: string;
  threatIndicatorHash?: string;
  threatIndicatorDomain?: string;
  threatCategory?: string;
  description?: string;
  technicalRecommendation?: string;
}

export const useAnalystEnrichment = (incidentId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateEnrichment = useCallback(async (enrichmentData: AnalystEnrichment) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update the incident_classification field with enrichment data
      const { error: updateError } = await supabase
        .from('incidents')
        .update({
          incident_classification: JSON.stringify(enrichmentData),
          updated_at: new Date().toISOString()
        })
        .eq('incident_id', incidentId);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (err) {
      console.error('Error updating analyst enrichment:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [incidentId]);

  return {
    updateEnrichment,
    isLoading,
    error
  };
};
