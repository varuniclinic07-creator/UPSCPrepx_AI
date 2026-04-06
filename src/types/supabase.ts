export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin' | 'super_admin';
          subscription_tier: 'trial' | 'basic' | 'premium';
          subscription_ends_at: string | null;
          trial_ends_at: string | null;
          trial_sessions: Json;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          subscription_tier?: 'trial' | 'basic' | 'premium';
          subscription_ends_at?: string | null;
          trial_ends_at?: string | null;
          trial_sessions?: Json;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          role?: 'user' | 'admin' | 'super_admin';
          subscription_tier?: 'trial' | 'basic' | 'premium';
          subscription_ends_at?: string | null;
          trial_ends_at?: string | null;
          trial_sessions?: Json;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      lecture_jobs: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          subject: string;
          status: 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled';
          progress: number;
          progress_percent: number;
          current_chapter: number | null;
          total_chapters: number | null;
          outline: Json | null;
          duration: number | null;
          video_url: string | null;
          audio_url: string | null;
          notes_pdf_url: string | null;
          transcript: Json | null;
          error: string | null;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
          estimated_completion: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          subject: string;
          status?: 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled';
          progress?: number;
          duration?: number | null;
          video_url?: string | null;
          audio_url?: string | null;
          notes_pdf_url?: string | null;
          transcript?: Json | null;
          error?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          estimated_completion?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          subject?: string;
          status?: 'pending' | 'processing' | 'ready' | 'failed' | 'cancelled';
          progress?: number;
          duration?: number | null;
          video_url?: string | null;
          audio_url?: string | null;
          notes_pdf_url?: string | null;
          transcript?: Json | null;
          error?: string | null;
          error_message?: string | null;
          started_at?: string | null;
          estimated_completion?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          subject: string;
          content: Json;
          is_bookmarked: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          subject: string;
          content: Json;
          is_bookmarked?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          subject?: string;
          content?: Json;
          is_bookmarked?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          subject: string;
          questions: Json;
          total_questions: number;
          time_limit: number;
          passing_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          subject: string;
          questions: Json;
          total_questions: number;
          time_limit?: number;
          passing_score?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          subject?: string;
          questions?: Json;
          total_questions?: number;
          time_limit?: number;
          passing_score?: number;
          created_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          answers: Json;
          passed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          answers: Json;
          passed: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          score?: number;
          total_questions?: number;
          time_taken?: number;
          answers?: Json;
          passed?: boolean;
          created_at?: string;
        };
      };
      current_affairs: {
        Row: {
          id: string;
          topic: string;
          category: string;
          content: Json;
          date: string;
          is_published: boolean;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          topic: string;
          category: string;
          content: Json;
          date?: string;
          is_published?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          topic?: string;
          category?: string;
          content?: Json;
          date?: string;
          is_published?: boolean;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_providers: {
        Row: {
          id: string;
          name: string;
          slug: string;
          api_base_url: string;
          api_key_encrypted: string | null;
          is_active: boolean;
          is_default: boolean;
          models: Json;
          rate_limit_rpm: number;
          health_status: string;
          last_health_check: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          api_base_url: string;
          api_key_encrypted?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          models?: Json;
          rate_limit_rpm?: number;
          health_status?: string;
          last_health_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          api_base_url?: string;
          api_key_encrypted?: string | null;
          is_active?: boolean;
          is_default?: boolean;
          models?: Json;
          rate_limit_rpm?: number;
          health_status?: string;
          last_health_check?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          phone: string | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          score: number;
          status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          phone?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          score?: number;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          phone?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          score?: number;
          status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feature_config: {
        Row: {
          id: string;
          feature_id: string;
          display_name: string;
          display_name_hi: string | null;
          description: string | null;
          icon: string | null;
          is_enabled: boolean;
          is_visible: boolean;
          min_tier: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          feature_id: string;
          display_name: string;
          display_name_hi?: string | null;
          description?: string | null;
          icon?: string | null;
          is_enabled?: boolean;
          is_visible?: boolean;
          min_tier?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          feature_id?: string;
          display_name?: string;
          display_name_hi?: string | null;
          description?: string | null;
          icon?: string | null;
          is_enabled?: boolean;
          is_visible?: boolean;
          min_tier?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      static_materials: {
        Row: {
          id: string;
          name: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          subject: string;
          category: string | null;
          tags: Json;
          is_standard: boolean;
          is_processed: boolean;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          subject: string;
          category?: string | null;
          tags?: Json;
          is_standard?: boolean;
          is_processed?: boolean;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          file_url?: string;
          subject?: string;
          category?: string | null;
          tags?: Json;
          is_standard?: boolean;
          is_processed?: boolean;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          name: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          subject: string;
          category: string | null;
          tags: Json;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          file_name: string;
          file_type: string;
          file_size: number;
          file_url: string;
          subject: string;
          category?: string | null;
          tags?: Json;
          uploaded_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          file_url?: string;
          subject?: string;
          category?: string | null;
          tags?: Json;
          uploaded_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      lecture_chapters: {
        Row: {
          id: string;
          job_id: string;
          chapter_number: number;
          title: string;
          content: Json | null;
          audio_url: string | null;
          video_url: string | null;
          duration: number | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          chapter_number: number;
          title: string;
          content?: Json | null;
          audio_url?: string | null;
          video_url?: string | null;
          duration?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          chapter_number?: number;
          title?: string;
          content?: Json | null;
          audio_url?: string | null;
          video_url?: string | null;
          duration?: number | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      trial_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: string;
          started_at: string;
          completed_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: string;
          started_at?: string;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_type?: string;
          started_at?: string;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      ip_registrations: {
        Row: {
          id: string;
          ip_address: string;
          ip_hash: string;
          user_id: string | null;
          user_email: string;
          user_agent: string | null;
          device_fingerprint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ip_address: string;
          ip_hash: string;
          user_id?: string | null;
          user_email: string;
          user_agent?: string | null;
          device_fingerprint?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ip_address?: string;
          ip_hash?: string;
          user_id?: string | null;
          user_email?: string;
          user_agent?: string | null;
          device_fingerprint?: string | null;
          created_at?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          currency: string;
          duration_days: number;
          features: Json;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          currency?: string;
          duration_days: number;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          currency?: string;
          duration_days?: number;
          features?: Json;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          status: string;
          starts_at: string;
          ends_at: string;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          status?: string;
          starts_at: string;
          ends_at: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          status?: string;
          starts_at?: string;
          ends_at?: string;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          amount: number;
          currency: string;
          status: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          invoice_url: string | null;
          error_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          amount: number;
          currency?: string;
          status?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          invoice_url?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          invoice_url?: string | null;
          error_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_store: {
        Row: {
          id: string;
          event_type: string;
          aggregate_id: string;
          aggregate_type: string;
          payload: Json;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          aggregate_id: string;
          aggregate_type: string;
          payload: Json;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          aggregate_id?: string;
          aggregate_type?: string;
          payload?: Json;
          metadata?: Json;
          created_at?: string;
        };
      };
      syllabus_topics: {
        Row: {
          id: string;
          topic_name: string;
          subject: string;
          paper: string | null;
          section: string | null;
          keywords: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          topic_name: string;
          subject: string;
          paper?: string | null;
          section?: string | null;
          keywords?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          topic_name?: string;
          subject?: string;
          paper?: string | null;
          section?: string | null;
          keywords?: Json;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      security_events: {
        Row: {
          id: string;
          event_type: string;
          user_id: string | null;
          ip_address: string | null;
          details: Json;
          severity: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          user_id?: string | null;
          ip_address?: string | null;
          details?: Json;
          severity?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          user_id?: string | null;
          ip_address?: string | null;
          details?: Json;
          severity?: string;
          created_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          event_id: string;
          event_type: string;
          payload: Json;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          event_type: string;
          payload: Json;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          event_type?: string;
          payload?: Json;
          processed?: boolean;
          created_at?: string;
        };
      };
      shorts: {
        Row: {
          id: string;
          user_id: string;
          topic: string;
          subject: string;
          script: string;
          visual_cues: Json;
          duration: number;
          status: string;
          video_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          topic: string;
          subject: string;
          script: string;
          visual_cues: Json;
          duration: number;
          status?: string;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          topic?: string;
          subject?: string;
          script?: string;
          visual_cues?: Json;
          duration?: number;
          status?: string;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          subjects: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          subjects?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          subjects?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      study_sessions: {
        Row: {
          id: string;
          plan_id: string;
          user_id: string;
          subject: string;
          topic: string;
          scheduled_date: string;
          duration_minutes: number;
          completed: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_id: string;
          user_id: string;
          subject: string;
          topic: string;
          scheduled_date: string;
          duration_minutes: number;
          completed?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_id?: string;
          user_id?: string;
          subject?: string;
          topic?: string;
          scheduled_date?: string;
          duration_minutes?: number;
          completed?: boolean;
          notes?: string | null;
          created_at?: string;
        };
      };
      user_bookmarks: {
        Row: {
          id: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          title: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          title?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource_type?: string;
          resource_id?: string;
          title?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_ip_registration: {
        Args: {
          p_ip_address: string;
          p_email: string;
        };
        Returns: {
          can_register: boolean;
          reason: string;
          existing_email: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];