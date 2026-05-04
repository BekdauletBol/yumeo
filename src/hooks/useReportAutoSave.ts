import { useState, useEffect, useRef } from 'react';
import { updateMaterialAction } from '@/app/actions/materials';

interface UseReportAutoSaveProps {
  projectId?: string;
  draftId?: string;
  title: string;
  content: string;
  onSave: (content: string) => void;
}

export function useReportAutoSave({
  projectId,
  draftId,
  title,
  content,
  onSave,
}: UseReportAutoSaveProps) {
  const [isSaved, setIsSaved] = useState(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(content);

  useEffect(() => {
    // Skip if no content changed
    if (content === lastSavedRef.current) {
      return;
    }

    setIsSaved(false);

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new auto-save timeout (30 seconds)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        if (draftId) {
          // Update existing draft - content only
          // Note: Title can be updated separately or stored in metadata
          await updateMaterialAction(draftId, {
            content,
          });
        } else if (projectId) {
          // Create new draft if needed
          // This is handled by parent component
        }

        lastSavedRef.current = content;
        setIsSaved(true);
        onSave(content);
      } catch (err) {
        console.error('Failed to auto-save report:', err);
        setIsSaved(false);
      }
    }, 30000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, title, draftId, projectId, onSave]);

  return { isSaved };
}
