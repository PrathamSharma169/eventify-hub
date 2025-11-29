import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { Event, ApiResponse } from '@/types/api';

export const useEvent = (id: string | undefined) => {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) throw new Error('Event ID is required');
      
      const response = await apiClient.get<ApiResponse<Event>>(`/events/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};
