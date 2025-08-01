
import { useState, useEffect, useCallback, useRef } from 'react';
import { getJobStatus, getTranscript } from '../services/api';
import { JobStatusEnum } from '../types';

export const useJobPolling = (jobId: string | undefined) => {
  const [status, setStatus] = useState<JobStatusEnum | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const pollingRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const pollStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await getJobStatus(jobId);
      setStatus(response.status);
      
      if (response.status === JobStatusEnum.COMPLETE) {
        setIsLoading(true);
        const transcriptResponse = await getTranscript(jobId);
        setTranscript(transcriptResponse.transcript);
        stopPolling();
        setIsLoading(false);
      } else if (response.status === JobStatusEnum.FAILED) {
        setError('Transcription failed.');
        stopPolling();
        setIsLoading(false);
      } else {
        pollingRef.current = window.setTimeout(pollStatus, 3000); // Poll every 3 seconds
      }
    } catch (err) {
      setError('An error occurred while fetching job status.');
      stopPolling();
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (jobId) {
      setIsLoading(true);
      pollStatus();
    } else {
        setIsLoading(false);
    }

    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return { status, transcript, isLoading, error };
};
