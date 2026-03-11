export interface AILog {
  id: number;
  content_type: 'product_description' | 'seo_title' | 'meta_description' | 'keywords';
  prompt: string;
  generated_content: string;
  related_type?: string;
  related_id?: number;
  ai_provider: string;
  model: string;
  tokens_used: number;
  response_time_ms: number;
  user_id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  status: 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface AIStatistics {
  total_generations: number;
  total_tokens: number;
  total_response_time: number;
  average_tokens_per_request: number;
  average_response_time_ms: number;
  success_rate: number;
  usage_by_type: {
    product_description: number;
    seo_title: number;
    meta_description: number;
    keywords: number;
  };
  usage_by_user: Array<{
    user_id: number;
    user_name: string;
    count: number;
    total_tokens: number;
  }>;
  recent_activity: AILog[];
}

export interface AILogsResponse {
  success: boolean;
  data: {
    data: AILog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AIStatisticsResponse {
  success: boolean;
  data: AIStatistics;
}

export interface AILogsFilters {
  content_type?: string;
  status?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}