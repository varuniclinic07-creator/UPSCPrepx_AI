export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          code: string
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_reward: number | null
        }
        Insert: {
          code: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_reward?: number | null
        }
        Update: {
          code?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      admin_ai_provider_models: {
        Row: {
          cost_per_1k_tokens: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model_display_name: string | null
          model_name: string
          provider_id: string | null
          supports_function_calling: boolean | null
          supports_vision: boolean | null
        }
        Insert: {
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_display_name?: string | null
          model_name: string
          provider_id?: string | null
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
        }
        Update: {
          cost_per_1k_tokens?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model_display_name?: string | null
          model_name?: string
          provider_id?: string | null
          supports_function_calling?: boolean | null
          supports_vision?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_ai_provider_models_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "admin_ai_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_ai_providers: {
        Row: {
          api_key_encrypted: string | null
          base_url: string
          config: Json | null
          created_at: string | null
          default_model: string | null
          failed_requests: number | null
          health_check_error: string | null
          id: string
          is_active: boolean | null
          is_healthy: boolean | null
          last_tested_at: string | null
          priority: number | null
          provider_name: string
          provider_type: string | null
          rate_limit_concurrent: number | null
          rate_limit_rpm: number | null
          total_requests: number | null
          updated_at: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          base_url: string
          config?: Json | null
          created_at?: string | null
          default_model?: string | null
          failed_requests?: number | null
          health_check_error?: string | null
          id?: string
          is_active?: boolean | null
          is_healthy?: boolean | null
          last_tested_at?: string | null
          priority?: number | null
          provider_name: string
          provider_type?: string | null
          rate_limit_concurrent?: number | null
          rate_limit_rpm?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          base_url?: string
          config?: Json | null
          created_at?: string | null
          default_model?: string | null
          failed_requests?: number | null
          health_check_error?: string | null
          id?: string
          is_active?: boolean | null
          is_healthy?: boolean | null
          last_tested_at?: string | null
          priority?: number | null
          provider_name?: string
          provider_type?: string | null
          rate_limit_concurrent?: number | null
          rate_limit_rpm?: number | null
          total_requests?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_content_rules: {
        Row: {
          applies_to: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          rule_config: Json
          rule_name: string
          rule_type: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_config: Json
          rule_name: string
          rule_type?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          rule_config?: Json
          rule_name?: string
          rule_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_content_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_feature_controls: {
        Row: {
          config: Json | null
          feature_display_name: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          is_visible: boolean | null
          limits_by_plan: Json | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config?: Json | null
          feature_display_name?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          is_visible?: boolean | null
          limits_by_plan?: Json | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config?: Json | null
          feature_display_name?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          is_visible?: boolean | null
          limits_by_plan?: Json | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_feature_controls_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_materials: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean | null
          is_reference: boolean | null
          is_standard: boolean | null
          page_count: number | null
          subject: string | null
          title: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean | null
          is_reference?: boolean | null
          is_standard?: boolean | null
          page_count?: number | null
          subject?: string | null
          title: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          is_reference?: boolean | null
          is_standard?: boolean | null
          page_count?: number | null
          subject?: string | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_materials_tags: {
        Row: {
          material_id: string
          tag: string
        }
        Insert: {
          material_id: string
          tag: string
        }
        Update: {
          material_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_materials_tags_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "admin_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_runs: {
        Row: {
          agent_type: string
          completed_at: string | null
          content_generated: number | null
          errors: Json | null
          id: string
          metadata: Json | null
          nodes_processed: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          agent_type: string
          completed_at?: string | null
          content_generated?: number | null
          errors?: Json | null
          id?: string
          metadata?: Json | null
          nodes_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          agent_type?: string
          completed_at?: string | null
          content_generated?: number | null
          errors?: Json | null
          id?: string
          metadata?: Json | null
          nodes_processed?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      agentic_cache: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          query_hash: string
          query_text: string
          result_data: Json
          source_type: string
          source_urls: string[] | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          query_hash: string
          query_text: string
          result_data: Json
          source_type: string
          source_urls?: string[] | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          query_hash?: string
          query_text?: string
          result_data?: Json
          source_type?: string
          source_urls?: string[] | null
        }
        Relationships: []
      }
      agentic_orchestrator_logs: {
        Row: {
          combined_results: Json | null
          confidence_score: number | null
          created_at: string | null
          doc_thinker_time_ms: number | null
          error_message: string | null
          file_search_time_ms: number | null
          id: string
          intent: string | null
          query: string
          routing_reasoning: string | null
          status: string | null
          systems_used: string[] | null
          total_processing_time_ms: number | null
          user_id: string | null
          web_search_time_ms: number | null
        }
        Insert: {
          combined_results?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          doc_thinker_time_ms?: number | null
          error_message?: string | null
          file_search_time_ms?: number | null
          id?: string
          intent?: string | null
          query: string
          routing_reasoning?: string | null
          status?: string | null
          systems_used?: string[] | null
          total_processing_time_ms?: number | null
          user_id?: string | null
          web_search_time_ms?: number | null
        }
        Update: {
          combined_results?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          doc_thinker_time_ms?: number | null
          error_message?: string | null
          file_search_time_ms?: number | null
          id?: string
          intent?: string | null
          query?: string
          routing_reasoning?: string | null
          status?: string | null
          systems_used?: string[] | null
          total_processing_time_ms?: number | null
          user_id?: string | null
          web_search_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_orchestrator_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_query_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          intent: string | null
          query: string
          response_time_ms: number | null
          services_used: string[] | null
          sources_count: number | null
          success: boolean | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          intent?: string | null
          query: string
          response_time_ms?: number | null
          services_used?: string[] | null
          sources_count?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          intent?: string | null
          query?: string
          response_time_ms?: number | null
          services_used?: string[] | null
          sources_count?: number | null
          success?: boolean | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_query_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      agentic_web_searches: {
        Row: {
          cache_key: string | null
          cached_until: string | null
          created_at: string | null
          id: string
          intent: string | null
          processing_time_ms: number | null
          query: string
          results: Json | null
          sources_used: string[] | null
          status: string | null
          total_results: number | null
          user_id: string | null
        }
        Insert: {
          cache_key?: string | null
          cached_until?: string | null
          created_at?: string | null
          id?: string
          intent?: string | null
          processing_time_ms?: number | null
          query: string
          results?: Json | null
          sources_used?: string[] | null
          status?: string | null
          total_results?: number | null
          user_id?: string | null
        }
        Update: {
          cache_key?: string | null
          cached_until?: string | null
          created_at?: string | null
          id?: string
          intent?: string | null
          processing_time_ms?: number | null
          query?: string
          results?: Json | null
          sources_used?: string[] | null
          status?: string | null
          total_results?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agentic_web_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_providers: {
        Row: {
          api_base_url: string
          api_key_encrypted: string | null
          api_version: string | null
          available_models: Json | null
          created_at: string | null
          default_model: string | null
          extra_headers: Json | null
          extra_params: Json | null
          health_status: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_health_check: string | null
          name: string
          provider_type: string
          rate_limit_current_usage: number | null
          rate_limit_reset_at: string | null
          rate_limit_rpm: number | null
          rate_limit_tpm: number | null
          slug: string
          total_cost: number | null
          total_requests: number | null
          total_tokens: number | null
          updated_at: string | null
        }
        Insert: {
          api_base_url: string
          api_key_encrypted?: string | null
          api_version?: string | null
          available_models?: Json | null
          created_at?: string | null
          default_model?: string | null
          extra_headers?: Json | null
          extra_params?: Json | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_health_check?: string | null
          name: string
          provider_type: string
          rate_limit_current_usage?: number | null
          rate_limit_reset_at?: string | null
          rate_limit_rpm?: number | null
          rate_limit_tpm?: number | null
          slug: string
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Update: {
          api_base_url?: string
          api_key_encrypted?: string | null
          api_version?: string | null
          available_models?: Json | null
          created_at?: string | null
          default_model?: string | null
          extra_headers?: Json | null
          extra_params?: Json | null
          health_status?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_health_check?: string | null
          name?: string
          provider_type?: string
          rate_limit_current_usage?: number | null
          rate_limit_reset_at?: string | null
          rate_limit_rpm?: number | null
          rate_limit_tpm?: number | null
          slug?: string
          total_cost?: number | null
          total_requests?: number | null
          total_tokens?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          id: string
          user_id: string
          provider: string
          model: string
          endpoint: string | null
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          cost_usd: number
          latency_ms: number | null
          session_id: string | null
          success: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          provider: string
          model: string
          endpoint?: string | null
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_usd?: number
          latency_ms?: number | null
          session_id?: string | null
          success?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          provider?: string
          model?: string
          endpoint?: string | null
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          cost_usd?: number
          latency_ms?: number | null
          session_id?: string | null
          success?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      all_features: {
        Row: {
          basic_limit: number | null
          category: string | null
          created_at: string | null
          dashboard_priority: number | null
          description: string | null
          feature_name: string
          feature_slug: string
          icon: string | null
          id: string
          implementation_notes: string | null
          is_enabled: boolean | null
          is_implemented: boolean | null
          is_visible: boolean | null
          min_tier: string | null
          premium_limit: number | null
          premium_plus_limit: number | null
          preview_content: string | null
          show_on_dashboard: boolean | null
          sort_order: number | null
          trial_limit: number | null
          updated_at: string | null
        }
        Insert: {
          basic_limit?: number | null
          category?: string | null
          created_at?: string | null
          dashboard_priority?: number | null
          description?: string | null
          feature_name: string
          feature_slug: string
          icon?: string | null
          id?: string
          implementation_notes?: string | null
          is_enabled?: boolean | null
          is_implemented?: boolean | null
          is_visible?: boolean | null
          min_tier?: string | null
          premium_limit?: number | null
          premium_plus_limit?: number | null
          preview_content?: string | null
          show_on_dashboard?: boolean | null
          sort_order?: number | null
          trial_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          basic_limit?: number | null
          category?: string | null
          created_at?: string | null
          dashboard_priority?: number | null
          description?: string | null
          feature_name?: string
          feature_slug?: string
          icon?: string | null
          id?: string
          implementation_notes?: string | null
          is_enabled?: boolean | null
          is_implemented?: boolean | null
          is_visible?: boolean | null
          min_tier?: string | null
          premium_limit?: number | null
          premium_plus_limit?: number | null
          preview_content?: string | null
          show_on_dashboard?: boolean | null
          sort_order?: number | null
          trial_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      answer_templates: {
        Row: {
          category: string | null
          content: Json
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          is_public: boolean | null
          name: string
          tags: string[] | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_public?: boolean | null
          name?: string
          tags?: string[] | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          ip_address: string | null
          reason: string | null
          request_id: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          request_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: string | null
          reason?: string | null
          request_id?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          back_content: string | null
          content: string
          context_url: string | null
          created_at: string | null
          front_content: string | null
          id: string
          source_id: string
          source_type: string
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          back_content?: string | null
          content: string
          context_url?: string | null
          created_at?: string | null
          front_content?: string | null
          id?: string
          source_id: string
          source_type: string
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          back_content?: string | null
          content?: string
          context_url?: string | null
          created_at?: string | null
          front_content?: string | null
          id?: string
          source_id?: string
          source_type?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ca_articles: {
        Row: {
          category: string | null
          created_at: string | null
          digest_id: string | null
          full_content: string | null
          id: string
          image_url: string | null
          importance: number | null
          is_published: boolean | null
          read_time_min: number | null
          source_id: string | null
          summary: string | null
          summary_hindi: string | null
          title: string
          title_hindi: string | null
          updated_at: string | null
          url: string | null
          word_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          digest_id?: string | null
          full_content?: string | null
          id?: string
          image_url?: string | null
          importance?: number | null
          is_published?: boolean | null
          read_time_min?: number | null
          source_id?: string | null
          summary?: string | null
          summary_hindi?: string | null
          title: string
          title_hindi?: string | null
          updated_at?: string | null
          url?: string | null
          word_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          digest_id?: string | null
          full_content?: string | null
          id?: string
          image_url?: string | null
          importance?: number | null
          is_published?: boolean | null
          read_time_min?: number | null
          source_id?: string | null
          summary?: string | null
          summary_hindi?: string | null
          title?: string
          title_hindi?: string | null
          updated_at?: string | null
          url?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ca_articles_digest_id_fkey"
            columns: ["digest_id"]
            isOneToOne: false
            referencedRelation: "daily_ca_digest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ca_articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "ca_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_mcqs: {
        Row: {
          article_id: string | null
          bloom_taxonomy: string | null
          correct_answer: number | null
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          explanation_hindi: string | null
          id: string
          is_active: boolean | null
          options: Json
          question: string
          question_hindi: string | null
        }
        Insert: {
          article_id?: string | null
          bloom_taxonomy?: string | null
          correct_answer?: number | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          explanation_hindi?: string | null
          id?: string
          is_active?: boolean | null
          options: Json
          question: string
          question_hindi?: string | null
        }
        Update: {
          article_id?: string | null
          bloom_taxonomy?: string | null
          correct_answer?: number | null
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          explanation_hindi?: string | null
          id?: string
          is_active?: boolean | null
          options?: Json
          question?: string
          question_hindi?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ca_mcqs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "ca_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ca_mcqs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_today_ca_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_quiz_attempts: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          id: string
          is_correct: boolean | null
          mcq_id: string | null
          selected_answer: number | null
          time_taken_sec: number | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          mcq_id?: string | null
          selected_answer?: number | null
          time_taken_sec?: number | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          id?: string
          is_correct?: boolean | null
          mcq_id?: string | null
          selected_answer?: number | null
          time_taken_sec?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ca_quiz_attempts_mcq_id_fkey"
            columns: ["mcq_id"]
            isOneToOne: false
            referencedRelation: "ca_mcqs"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_sources: {
        Row: {
          api_endpoint: string | null
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_crawled_at: string | null
          name: string
          priority: number | null
          rss_feed_url: string | null
          updated_at: string | null
          url: string
        }
        Insert: {
          api_endpoint?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_crawled_at?: string | null
          name: string
          priority?: number | null
          rss_feed_url?: string | null
          updated_at?: string | null
          url: string
        }
        Update: {
          api_endpoint?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_crawled_at?: string | null
          name?: string
          priority?: number | null
          rss_feed_url?: string | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      ca_syllabus_mapping: {
        Row: {
          article_id: string | null
          created_at: string | null
          id: string
          relevance_score: number | null
          subject: string | null
          syllabus_node_id: string | null
          topic: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          relevance_score?: number | null
          subject?: string | null
          syllabus_node_id?: string | null
          topic: string
        }
        Update: {
          article_id?: string | null
          created_at?: string | null
          id?: string
          relevance_score?: number | null
          subject?: string | null
          syllabus_node_id?: string | null
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "ca_syllabus_mapping_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "ca_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ca_syllabus_mapping_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_today_ca_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      ca_user_reads: {
        Row: {
          article_id: string | null
          bookmarked_at: string | null
          created_at: string | null
          id: string
          is_bookmarked: boolean | null
          is_read: boolean | null
          rating: number | null
          read_at: string | null
          time_spent_sec: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          article_id?: string | null
          bookmarked_at?: string | null
          created_at?: string | null
          id?: string
          is_bookmarked?: boolean | null
          is_read?: boolean | null
          rating?: number | null
          read_at?: string | null
          time_spent_sec?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string | null
          bookmarked_at?: string | null
          created_at?: string | null
          id?: string
          is_bookmarked?: boolean | null
          is_read?: boolean | null
          rating?: number | null
          read_at?: string | null
          time_spent_sec?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ca_user_reads_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "ca_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ca_user_reads_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "v_today_ca_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          id: string
          user_id: string
          certificate_type: string
          title: string
          image_url: string | null
          issued_date: string | null
          expires_at: string | null
          status: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          certificate_type: string
          title: string
          image_url?: string | null
          issued_date?: string | null
          expires_at?: string | null
          status?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          certificate_type?: string
          title?: string
          image_url?: string | null
          issued_date?: string | null
          expires_at?: string | null
          status?: string
          metadata?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          message_count: number | null
          messages: Json | null
          model: string | null
          provider: string | null
          title: string | null
          tokens_used: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_count?: number | null
          messages?: Json | null
          model?: string | null
          provider?: string | null
          title?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          message_count?: number | null
          messages?: Json | null
          model?: string | null
          provider?: string | null
          title?: string | null
          tokens_used?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_library: {
        Row: {
          id: string
          title: string
          summary: string | null
          syllabus_node_id: string | null
          status: string
          content: string | null
          author_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          syllabus_node_id?: string | null
          status?: string
          content?: string | null
          author_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          summary?: string | null
          syllabus_node_id?: string | null
          status?: string
          content?: string | null
          author_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      content_queue: {
        Row: {
          agent_type: string | null
          ai_provider: string | null
          confidence_score: number | null
          content_type: string
          created_at: string | null
          generated_content: Json
          id: string
          node_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          agent_type?: string | null
          ai_provider?: string | null
          confidence_score?: number | null
          content_type: string
          created_at?: string | null
          generated_content?: Json
          id?: string
          node_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          agent_type?: string | null
          ai_provider?: string | null
          confidence_score?: number | null
          content_type?: string
          created_at?: string | null
          generated_content?: Json
          id?: string
          node_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      content_rules: {
        Row: {
          applies_to: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_config: Json
          rule_type: string
          updated_at: string | null
        }
        Insert: {
          applies_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_config: Json
          rule_type: string
          updated_at?: string | null
        }
        Update: {
          applies_to?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_config?: Json
          rule_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      content_validation_rules: {
        Row: {
          allowed_sources: string[] | null
          applies_to_features: string[] | null
          blocked_keywords: string[] | null
          blocked_sources: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          min_accuracy_score: number | null
          min_relevance_score: number | null
          required_keywords: string[] | null
          rule_name: string
          rule_type: string | null
          updated_at: string | null
        }
        Insert: {
          allowed_sources?: string[] | null
          applies_to_features?: string[] | null
          blocked_keywords?: string[] | null
          blocked_sources?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_accuracy_score?: number | null
          min_relevance_score?: number | null
          required_keywords?: string[] | null
          rule_name: string
          rule_type?: string | null
          updated_at?: string | null
        }
        Update: {
          allowed_sources?: string[] | null
          applies_to_features?: string[] | null
          blocked_keywords?: string[] | null
          blocked_sources?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_accuracy_score?: number | null
          min_relevance_score?: number | null
          required_keywords?: string[] | null
          rule_name?: string
          rule_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coupon_usages: {
        Row: {
          coupon_id: string | null
          discount_amount: number
          id: string
          payment_order_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          coupon_id?: string | null
          discount_amount: number
          id?: string
          payment_order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          coupon_id?: string | null
          discount_amount?: number
          id?: string
          payment_order_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_cu_coupon"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cu_order"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_cu_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_plans: string[] | null
          applicable_products: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_type: string | null
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          min_purchase_amount: number | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          usage_per_user: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          applicable_products?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          applicable_products?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          usage_per_user?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_c_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      current_affairs: {
        Row: {
          category: string | null
          confidence_score: number | null
          content_hash: string | null
          crawl_metadata: Json | null
          crawl_source: string | null
          created_at: string | null
          full_content: string | null
          id: string
          last_crawled_at: string | null
          mains_relevance: boolean | null
          node_id: string | null
          prelims_relevance: boolean | null
          published_date: string
          pyq_connections: string[] | null
          source_name: string | null
          source_url: string | null
          summary: string
          title: string
          updated_at: string | null
          upsc_relevance: string | null
          version: number | null
          views: number | null
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          content_hash?: string | null
          crawl_metadata?: Json | null
          crawl_source?: string | null
          created_at?: string | null
          full_content?: string | null
          id?: string
          last_crawled_at?: string | null
          mains_relevance?: boolean | null
          node_id?: string | null
          prelims_relevance?: boolean | null
          published_date: string
          pyq_connections?: string[] | null
          source_name?: string | null
          source_url?: string | null
          summary: string
          title: string
          updated_at?: string | null
          upsc_relevance?: string | null
          version?: number | null
          views?: number | null
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          content_hash?: string | null
          crawl_metadata?: Json | null
          crawl_source?: string | null
          created_at?: string | null
          full_content?: string | null
          id?: string
          last_crawled_at?: string | null
          mains_relevance?: boolean | null
          node_id?: string | null
          prelims_relevance?: boolean | null
          published_date?: string
          pyq_connections?: string[] | null
          source_name?: string | null
          source_url?: string | null
          summary?: string
          title?: string
          updated_at?: string | null
          upsc_relevance?: string | null
          version?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "current_affairs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_ca_digest: {
        Row: {
          article_count: number | null
          created_at: string | null
          date: string
          generated_at: string | null
          id: string
          is_published: boolean | null
          pdf_url: string | null
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          article_count?: number | null
          created_at?: string | null
          date: string
          generated_at?: string | null
          id?: string
          is_published?: boolean | null
          pdf_url?: string | null
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          article_count?: number | null
          created_at?: string | null
          date?: string
          generated_at?: string | null
          id?: string
          is_published?: boolean | null
          pdf_url?: string | null
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_newspapers: {
        Row: {
          articles: Json | null
          created_at: string | null
          edition: string | null
          id: string
          is_free: boolean | null
          pdf_url: string | null
          publication: string
          publish_date: string
          scraped_at: string | null
          scraping_status: string | null
          source_url: string | null
        }
        Insert: {
          articles?: Json | null
          created_at?: string | null
          edition?: string | null
          id?: string
          is_free?: boolean | null
          pdf_url?: string | null
          publication: string
          publish_date: string
          scraped_at?: string | null
          scraping_status?: string | null
          source_url?: string | null
        }
        Update: {
          articles?: Json | null
          created_at?: string | null
          edition?: string | null
          id?: string
          is_free?: boolean | null
          pdf_url?: string | null
          publication?: string
          publish_date?: string
          scraped_at?: string | null
          scraping_status?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      deployments: {
        Row: {
          id: string
          version: string
          status: string
          deployed_at: string | null
          deployed_by: string | null
          description: string | null
          rollback_version: string | null
        }
        Insert: {
          id?: string
          version: string
          status?: string
          deployed_at?: string | null
          deployed_by?: string | null
          description?: string | null
          rollback_version?: string | null
        }
        Update: {
          id?: string
          version?: string
          status?: string
          deployed_at?: string | null
          deployed_by?: string | null
          description?: string | null
          rollback_version?: string | null
        }
        Relationships: []
      }
      document_chat_sessions: {
        Row: {
          created_at: string | null
          document_id: string | null
          id: string
          messages: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chat_sessions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chat_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_uploads: {
        Row: {
          created_at: string | null
          extracted_text: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          filename: string
          id: string
          key_topics: string[] | null
          metadata: Json | null
          status: string | null
          summary: string | null
          total_chunks: number | null
          total_pages: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          extracted_text?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          filename: string
          id?: string
          key_topics?: string[] | null
          metadata?: Json | null
          status?: string | null
          summary?: string | null
          total_chunks?: number | null
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          extracted_text?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          filename?: string
          id?: string
          key_topics?: string[] | null
          metadata?: Json | null
          status?: string | null
          summary?: string | null
          total_chunks?: number | null
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string | null
          document_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          content?: string | null
          document_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          content?: string | null
          document_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      doubt_answers: {
        Row: {
          ai_provider: string | null
          answer_html: string | null
          answer_text: string
          created_at: string | null
          id: string
          is_followup: boolean | null
          metadata: Json | null
          question_id: string
          response_time_ms: number | null
          sources: Json | null
          thread_id: string
          word_count: number | null
        }
        Insert: {
          ai_provider?: string | null
          answer_html?: string | null
          answer_text: string
          created_at?: string | null
          id?: string
          is_followup?: boolean | null
          metadata?: Json | null
          question_id: string
          response_time_ms?: number | null
          sources?: Json | null
          thread_id: string
          word_count?: number | null
        }
        Update: {
          ai_provider?: string | null
          answer_html?: string | null
          answer_text?: string
          created_at?: string | null
          id?: string
          is_followup?: boolean | null
          metadata?: Json | null
          question_id?: string
          response_time_ms?: number | null
          sources?: Json | null
          thread_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doubt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "doubt_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doubt_answers_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "doubt_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_attachments: {
        Row: {
          created_at: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          ocr_text: string | null
          question_id: string | null
          transcription: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          ocr_text?: string | null
          question_id?: string | null
          transcription?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          ocr_text?: string | null
          question_id?: string | null
          transcription?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_attachments_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "doubt_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_questions: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          metadata: Json | null
          question_html: string | null
          question_text: string
          thread_id: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question_html?: string | null
          question_text: string
          thread_id: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          question_html?: string | null
          question_text?: string
          thread_id?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "doubt_questions_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "doubt_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_ratings: {
        Row: {
          answer_id: string
          created_at: string | null
          feedback_text: string | null
          flag_reason: string | null
          id: string
          is_flagged: boolean | null
          is_helpful: boolean | null
          rating: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string | null
          feedback_text?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_helpful?: boolean | null
          rating?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string | null
          feedback_text?: string | null
          flag_reason?: string | null
          id?: string
          is_flagged?: boolean | null
          is_helpful?: boolean | null
          rating?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doubt_ratings_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "doubt_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      doubt_threads: {
        Row: {
          created_at: string | null
          id: string
          is_bookmarked: boolean | null
          metadata: Json | null
          resolved_at: string | null
          status: string | null
          subject: string | null
          title_en: string
          title_hi: string | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_bookmarked?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          status?: string | null
          subject?: string | null
          title_en: string
          title_hi?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_bookmarked?: boolean | null
          metadata?: Json | null
          resolved_at?: string | null
          status?: string | null
          subject?: string | null
          title_en?: string
          title_hi?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      doubt_usage: {
        Row: {
          id: string
          image_doubts: number | null
          last_reset: string | null
          month: string
          text_doubts: number | null
          total_doubts: number | null
          user_id: string
          voice_doubts: number | null
        }
        Insert: {
          id?: string
          image_doubts?: number | null
          last_reset?: string | null
          month: string
          text_doubts?: number | null
          total_doubts?: number | null
          user_id: string
          voice_doubts?: number | null
        }
        Update: {
          id?: string
          image_doubts?: number | null
          last_reset?: string | null
          month?: string
          text_doubts?: number | null
          total_doubts?: number | null
          user_id?: string
          voice_doubts?: number | null
        }
        Relationships: []
      }
      event_store: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          created_at: string | null
          event_data: Json
          event_type: string
          id: string
          metadata: Json
          version: number
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          created_at?: string | null
          event_data?: Json
          event_type: string
          id?: string
          metadata?: Json
          version?: number
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          created_at?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          metadata?: Json
          version?: number
        }
        Relationships: []
      }
      feature_config: {
        Row: {
          created_at: string | null
          default_ai_model: string | null
          default_ai_provider: string | null
          description: string | null
          display_name: string
          fallback_ai_provider: string | null
          feature_id: string | null
          icon: string | null
          id: string
          is_enabled: boolean | null
          is_visible: boolean | null
          last_used_at: string | null
          limits_per_tier: Json | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          min_subscription_tier: string | null
          min_tier: string | null
          name: string | null
          preview_content: string | null
          preview_type: string | null
          preview_updated_at: string | null
          sort_order: number | null
          total_usage: number | null
          updated_at: string | null
          usage_limit_basic: number | null
          usage_limit_premium: number | null
          usage_limit_trial: number | null
        }
        Insert: {
          created_at?: string | null
          default_ai_model?: string | null
          default_ai_provider?: string | null
          description?: string | null
          display_name: string
          fallback_ai_provider?: string | null
          feature_id?: string | null
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          is_visible?: boolean | null
          last_used_at?: string | null
          limits_per_tier?: Json | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          min_subscription_tier?: string | null
          min_tier?: string | null
          name?: string | null
          preview_content?: string | null
          preview_type?: string | null
          preview_updated_at?: string | null
          sort_order?: number | null
          total_usage?: number | null
          updated_at?: string | null
          usage_limit_basic?: number | null
          usage_limit_premium?: number | null
          usage_limit_trial?: number | null
        }
        Update: {
          created_at?: string | null
          default_ai_model?: string | null
          default_ai_provider?: string | null
          description?: string | null
          display_name?: string
          fallback_ai_provider?: string | null
          feature_id?: string | null
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          is_visible?: boolean | null
          last_used_at?: string | null
          limits_per_tier?: Json | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          min_subscription_tier?: string | null
          min_tier?: string | null
          name?: string | null
          preview_content?: string | null
          preview_type?: string | null
          preview_updated_at?: string | null
          sort_order?: number | null
          total_usage?: number | null
          updated_at?: string | null
          usage_limit_basic?: number | null
          usage_limit_premium?: number | null
          usage_limit_trial?: number | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          feature_key: string
          feature_name: string
          global_limit: number | null
          id: string
          is_enabled: boolean
          plan_restrictions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feature_key: string
          feature_name: string
          global_limit?: number | null
          id?: string
          is_enabled?: boolean
          plan_restrictions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feature_key?: string
          feature_name?: string
          global_limit?: number | null
          id?: string
          is_enabled?: boolean
          plan_restrictions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          id: string
          type: string
          message: string
          rating: number | null
          user_id: string | null
          context: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          type: string
          message: string
          rating?: number | null
          user_id?: string | null
          context?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          message?: string
          rating?: number | null
          user_id?: string | null
          context?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      feature_usage: {
        Row: {
          id: string
          feature_id: string
          user_id: string
          session_duration_ms: number | null
          success: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          feature_id: string
          user_id: string
          session_duration_ms?: number | null
          success?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          feature_id?: string
          user_id?: string
          session_duration_ms?: number | null
          success?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      file_search_sessions: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          intent: string | null
          materials_explored: string[] | null
          navigation_path: Json | null
          processing_time_ms: number | null
          query: string
          results: Json | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          intent?: string | null
          materials_explored?: string[] | null
          navigation_path?: Json | null
          processing_time_ms?: number | null
          query: string
          results?: Json | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          intent?: string | null
          materials_explored?: string[] | null
          navigation_path?: Json | null
          processing_time_ms?: number | null
          query?: string
          results?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_search_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_solution: boolean | null
          thread_id: string | null
          upvotes: number | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          thread_id?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_solution?: boolean | null
          thread_id?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
          upvotes: number | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          upvotes?: number | null
        }
        Relationships: []
      }
      government_schemes: {
        Row: {
          beneficiaries: string | null
          budget_allocation: string | null
          category: string | null
          created_at: string | null
          id: string
          interview_importance: boolean | null
          is_bookmarked_count: number | null
          key_features: string[] | null
          launched_year: number | null
          mains_importance: boolean | null
          ministry: string | null
          objective: string | null
          official_website: string | null
          pib_links: string[] | null
          prelims_importance: boolean | null
          scheme_name: string
          subject_slug: string | null
          updated_at: string | null
          upsc_relevance: string | null
          views: number | null
        }
        Insert: {
          beneficiaries?: string | null
          budget_allocation?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          interview_importance?: boolean | null
          is_bookmarked_count?: number | null
          key_features?: string[] | null
          launched_year?: number | null
          mains_importance?: boolean | null
          ministry?: string | null
          objective?: string | null
          official_website?: string | null
          pib_links?: string[] | null
          prelims_importance?: boolean | null
          scheme_name: string
          subject_slug?: string | null
          updated_at?: string | null
          upsc_relevance?: string | null
          views?: number | null
        }
        Update: {
          beneficiaries?: string | null
          budget_allocation?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          interview_importance?: boolean | null
          is_bookmarked_count?: number | null
          key_features?: string[] | null
          launched_year?: number | null
          mains_importance?: boolean | null
          ministry?: string | null
          objective?: string | null
          official_website?: string | null
          pib_links?: string[] | null
          prelims_importance?: boolean | null
          scheme_name?: string
          subject_slug?: string | null
          updated_at?: string | null
          upsc_relevance?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "government_schemes_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      group_messages: {
        Row: {
          id: string
          group_id: string
          sender_id: string
          content: string
          created_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          sender_id: string
          content: string
          created_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          sender_id?: string
          content?: string
          created_at?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          created_at?: string | null
        }
        Relationships: []
      }
      grading_history: {
        Row: {
          id: string
          user_id: string
          question: string
          answer: string
          total_score: number
          max_possible: number
          percentage: number
          criteria_scores: Json | null
          feedback: string | null
          strengths: Json | null
          improvements: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          question: string
          answer: string
          total_score: number
          max_possible: number
          percentage: number
          criteria_scores?: Json | null
          feedback?: string | null
          strengths?: Json | null
          improvements?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          question?: string
          answer?: string
          total_score?: number
          max_possible?: number
          percentage?: number
          criteria_scores?: Json | null
          feedback?: string | null
          strengths?: Json | null
          improvements?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number | null
          base_amount: number
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          created_at: string | null
          discount_amount: number | null
          due_date: string | null
          gst_amount: number
          gstin: string | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string | null
          issued_at: string | null
          paid_at: string | null
          paid_date: string | null
          payment_order_id: string | null
          pdf_url: string | null
          status: string | null
          subscription_id: string | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          base_amount: number
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          gst_amount: number
          gstin?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type?: string | null
          issued_at?: string | null
          paid_at?: string | null
          paid_date?: string | null
          payment_order_id?: string | null
          pdf_url?: string | null
          status?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          base_amount?: number
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          created_at?: string | null
          discount_amount?: number | null
          due_date?: string | null
          gst_amount?: number
          gstin?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string | null
          issued_at?: string | null
          paid_at?: string | null
          paid_date?: string | null
          payment_order_id?: string | null
          pdf_url?: string | null
          status?: string | null
          subscription_id?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_inv_po"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inv_sub"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inv_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_registrations: {
        Row: {
          block_reason: string | null
          city: string | null
          country_code: string | null
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_address: unknown
          ip_hash: string
          is_blocked: boolean | null
          last_attempt_at: string | null
          registration_count: number | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          block_reason?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address: unknown
          ip_hash: string
          is_blocked?: boolean | null
          last_attempt_at?: string | null
          registration_count?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          block_reason?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: unknown
          ip_hash?: string
          is_blocked?: boolean | null
          last_attempt_at?: string | null
          registration_count?: number | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_rules: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          ip_address: unknown
          ip_range: unknown
          is_active: boolean | null
          reason: string | null
          rule_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          ip_range?: unknown
          is_active?: boolean | null
          reason?: string | null
          rule_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          ip_range?: unknown
          is_active?: boolean | null
          reason?: string | null
          rule_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          id: string
          job_type: string
          user_id: string
          queue_name: string | null
          status: string
          attempts: number
          error: string | null
          payload: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          job_type: string
          user_id: string
          queue_name?: string | null
          status?: string
          attempts?: number
          error?: string | null
          payload?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          job_type?: string
          user_id?: string
          queue_name?: string | null
          status?: string
          attempts?: number
          error?: string | null
          payload?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_queues: {
        Row: {
          id: string
          queue_name: string
          status: string
          count: number
          created_at: string | null
        }
        Insert: {
          id?: string
          queue_name: string
          status?: string
          count?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          queue_name?: string
          status?: string
          count?: number
          created_at?: string | null
        }
        Relationships: []
      }
      knowledge_edges: {
        Row: {
          created_at: string | null
          from_node_id: string
          id: string
          metadata: Json | null
          relationship_type: string
          to_node_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          from_node_id: string
          id?: string
          metadata?: Json | null
          relationship_type: string
          to_node_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          from_node_id?: string
          id?: string
          metadata?: Json | null
          relationship_type?: string
          to_node_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_edges_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_edges_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_nodes: {
        Row: {
          confidence_score: number | null
          content: string | null
          created_at: string | null
          freshness_score: number | null
          human_approved: boolean | null
          id: string
          last_verified_at: string | null
          metadata: Json | null
          source_count: number | null
          subject: string | null
          syllabus_code: string | null
          title: string
          type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          confidence_score?: number | null
          content?: string | null
          created_at?: string | null
          freshness_score?: number | null
          human_approved?: boolean | null
          id?: string
          last_verified_at?: string | null
          metadata?: Json | null
          source_count?: number | null
          subject?: string | null
          syllabus_code?: string | null
          title: string
          type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          confidence_score?: number | null
          content?: string | null
          created_at?: string | null
          freshness_score?: number | null
          human_approved?: boolean | null
          id?: string
          last_verified_at?: string | null
          metadata?: Json | null
          source_count?: number | null
          subject?: string | null
          syllabus_code?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      lecture_chapters: {
        Row: {
          audio_generated_at: string | null
          audio_url: string | null
          chapter_number: number
          compiled_at: string | null
          created_at: string | null
          duration: number | null
          id: string
          image_urls: string[] | null
          job_id: string | null
          script: string | null
          script_generated_at: string | null
          status: string | null
          subtopics: string[] | null
          title: string
          updated_at: string | null
          video_segment_url: string | null
          visual_prompts: Json | null
          visuals_generated_at: string | null
        }
        Insert: {
          audio_generated_at?: string | null
          audio_url?: string | null
          chapter_number: number
          compiled_at?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          image_urls?: string[] | null
          job_id?: string | null
          script?: string | null
          script_generated_at?: string | null
          status?: string | null
          subtopics?: string[] | null
          title: string
          updated_at?: string | null
          video_segment_url?: string | null
          visual_prompts?: Json | null
          visuals_generated_at?: string | null
        }
        Update: {
          audio_generated_at?: string | null
          audio_url?: string | null
          chapter_number?: number
          compiled_at?: string | null
          created_at?: string | null
          duration?: number | null
          id?: string
          image_urls?: string[] | null
          job_id?: string | null
          script?: string | null
          script_generated_at?: string | null
          status?: string | null
          subtopics?: string[] | null
          title?: string
          updated_at?: string | null
          video_segment_url?: string | null
          visual_prompts?: Json | null
          visuals_generated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_chapters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "lecture_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_jobs: {
        Row: {
          ai_providers_used: Json | null
          chapters: Json | null
          completed_at: string | null
          created_at: string | null
          current_chapter: number | null
          current_phase: string | null
          error_message: string | null
          estimated_completion: string | null
          id: string
          language: string | null
          max_retries: number | null
          notes_pdf_url: string | null
          outline: Json | null
          progress_percent: number | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          subject_slug: string | null
          target_duration: number | null
          topic: string
          total_ai_calls: number | null
          total_chapters: number | null
          total_cost: number | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          ai_providers_used?: Json | null
          chapters?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_chapter?: number | null
          current_phase?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          id?: string
          language?: string | null
          max_retries?: number | null
          notes_pdf_url?: string | null
          outline?: Json | null
          progress_percent?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          subject_slug?: string | null
          target_duration?: number | null
          topic: string
          total_ai_calls?: number | null
          total_chapters?: number | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          ai_providers_used?: Json | null
          chapters?: Json | null
          completed_at?: string | null
          created_at?: string | null
          current_chapter?: number | null
          current_phase?: string | null
          error_message?: string | null
          estimated_completion?: string | null
          id?: string
          language?: string | null
          max_retries?: number | null
          notes_pdf_url?: string | null
          outline?: Json | null
          progress_percent?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          subject_slug?: string | null
          target_duration?: number | null
          topic?: string
          total_ai_calls?: number | null
          total_chapters?: number | null
          total_cost?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_jobs_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "lecture_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_queue_jobs: {
        Row: {
          added_at: string | null
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error: string | null
          id: string
          job_data: Json
          lecture_job_id: string | null
          max_attempts: number | null
          priority: number | null
          queue_name: string
          result: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          added_at?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          job_data: Json
          lecture_job_id?: string | null
          max_attempts?: number | null
          priority?: number | null
          queue_name: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          added_at?: string | null
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          job_data?: Json
          lecture_job_id?: string | null
          max_attempts?: number | null
          priority?: number | null
          queue_name?: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_queue_jobs_lecture_job_id_fkey"
            columns: ["lecture_job_id"]
            isOneToOne: false
            referencedRelation: "lecture_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_watch_history: {
        Row: {
          chapter_number: number | null
          created_at: string | null
          device_type: string | null
          duration_seconds: number | null
          id: string
          lecture_id: string | null
          user_id: string | null
          watched_from_seconds: number | null
          watched_to_seconds: number | null
        }
        Insert: {
          chapter_number?: number | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          lecture_id?: string | null
          user_id?: string | null
          watched_from_seconds?: number | null
          watched_to_seconds?: number | null
        }
        Update: {
          chapter_number?: number | null
          created_at?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          id?: string
          lecture_id?: string | null
          user_id?: string | null
          watched_from_seconds?: number | null
          watched_to_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_watch_history_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "user_lectures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lecture_watch_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures: {
        Row: {
          id: string
          topic: string
          title: string
          video_url: string | null
          description: string | null
          transcript: Json | null
          node_id: string | null
          subject: string | null
          subject_slug: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          topic: string
          title: string
          video_url?: string | null
          description?: string | null
          transcript?: Json | null
          node_id?: string | null
          subject?: string | null
          subject_slug?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          topic?: string
          title?: string
          video_url?: string | null
          description?: string | null
          transcript?: Json | null
          node_id?: string | null
          subject?: string | null
          subject_slug?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      magazines: {
        Row: {
          articles: Json | null
          created_at: string | null
          download_count: number | null
          id: string
          is_free: boolean | null
          issue_month: string
          issue_year: number
          name: string
          pdf_url: string | null
          scraped_at: string | null
          source_url: string | null
          theme: string | null
          thumbnail_url: string | null
          title: string | null
          view_count: number | null
        }
        Insert: {
          articles?: Json | null
          created_at?: string | null
          download_count?: number | null
          id?: string
          is_free?: boolean | null
          issue_month: string
          issue_year: number
          name: string
          pdf_url?: string | null
          scraped_at?: string | null
          source_url?: string | null
          theme?: string | null
          thumbnail_url?: string | null
          title?: string | null
          view_count?: number | null
        }
        Update: {
          articles?: Json | null
          created_at?: string | null
          download_count?: number | null
          id?: string
          is_free?: boolean | null
          issue_month?: string
          issue_year?: number
          name?: string
          pdf_url?: string | null
          scraped_at?: string | null
          source_url?: string | null
          theme?: string | null
          thumbnail_url?: string | null
          title?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      mains_answers: {
        Row: {
          answer_text: string
          created_at: string | null
          id: string
          question_id: string
          status: Database["public"]["Enums"]["answer_status"] | null
          time_taken_sec: number
          updated_at: string | null
          user_id: string
          word_count: number
        }
        Insert: {
          answer_text: string
          created_at?: string | null
          id?: string
          question_id: string
          status?: Database["public"]["Enums"]["answer_status"] | null
          time_taken_sec: number
          updated_at?: string | null
          user_id: string
          word_count: number
        }
        Update: {
          answer_text?: string
          created_at?: string | null
          id?: string
          question_id?: string
          status?: Database["public"]["Enums"]["answer_status"] | null
          time_taken_sec?: number
          updated_at?: string | null
          user_id?: string
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "mains_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mains_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mains_evaluations: {
        Row: {
          ai_model_used: string
          ai_prompt_version: string | null
          analysis_score: number
          answer_id: string
          content_score: number
          created_at: string | null
          evaluation_time_sec: number
          exam_tip: string | null
          feedback_en: string
          feedback_hi: string | null
          id: string
          improvements: string[]
          model_answer_points: string[]
          overall_percentage: number
          overall_score: number
          presentation_score: number
          strengths: string[]
          structure_score: number
        }
        Insert: {
          ai_model_used: string
          ai_prompt_version?: string | null
          analysis_score: number
          answer_id: string
          content_score: number
          created_at?: string | null
          evaluation_time_sec: number
          exam_tip?: string | null
          feedback_en: string
          feedback_hi?: string | null
          id?: string
          improvements?: string[]
          model_answer_points?: string[]
          overall_percentage: number
          overall_score: number
          presentation_score: number
          strengths?: string[]
          structure_score: number
        }
        Update: {
          ai_model_used?: string
          ai_prompt_version?: string | null
          analysis_score?: number
          answer_id?: string
          content_score?: number
          created_at?: string | null
          evaluation_time_sec?: number
          exam_tip?: string | null
          feedback_en?: string
          feedback_hi?: string | null
          id?: string
          improvements?: string[]
          model_answer_points?: string[]
          overall_percentage?: number
          overall_score?: number
          presentation_score?: number
          strengths?: string[]
          structure_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "mains_evaluations_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: true
            referencedRelation: "mains_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      mains_feedback: {
        Row: {
          created_at: string | null
          evaluation_id: string
          feedback_text: string | null
          id: string
          rating: number | null
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          created_at?: string | null
          evaluation_id: string
          feedback_text?: string | null
          id?: string
          rating?: number | null
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          created_at?: string | null
          evaluation_id?: string
          feedback_text?: string | null
          id?: string
          rating?: number | null
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "mains_feedback_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: true
            referencedRelation: "mains_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      mains_questions: {
        Row: {
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          id: string
          is_pyq: boolean | null
          marks: number
          model_answer_points: string[] | null
          question_text: string
          question_text_hi: string | null
          subject: Database["public"]["Enums"]["gs_subject"]
          syllabus_node_id: string | null
          tags: string[] | null
          time_limit_min: number
          topic: string
          updated_at: string | null
          word_limit: number
          year: number | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          is_pyq?: boolean | null
          marks?: number
          model_answer_points?: string[] | null
          question_text: string
          question_text_hi?: string | null
          subject: Database["public"]["Enums"]["gs_subject"]
          syllabus_node_id?: string | null
          tags?: string[] | null
          time_limit_min?: number
          topic: string
          updated_at?: string | null
          word_limit?: number
          year?: number | null
        }
        Update: {
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          id?: string
          is_pyq?: boolean | null
          marks?: number
          model_answer_points?: string[] | null
          question_text?: string
          question_text_hi?: string | null
          subject?: Database["public"]["Enums"]["gs_subject"]
          syllabus_node_id?: string | null
          tags?: string[] | null
          time_limit_min?: number
          topic?: string
          updated_at?: string | null
          word_limit?: number
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mains_questions_syllabus_node_id_fkey"
            columns: ["syllabus_node_id"]
            isOneToOne: false
            referencedRelation: "syllabus_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      material_chunks: {
        Row: {
          chapter: string | null
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          has_image: boolean | null
          has_table: boolean | null
          id: string
          material_id: string | null
          page_number: number | null
          section_title: string | null
          word_count: number | null
        }
        Insert: {
          chapter?: string | null
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          has_image?: boolean | null
          has_table?: boolean | null
          id?: string
          material_id?: string | null
          page_number?: number | null
          section_title?: string | null
          word_count?: number | null
        }
        Update: {
          chapter?: string | null
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          has_image?: boolean | null
          has_table?: boolean | null
          id?: string
          material_id?: string | null
          page_number?: number | null
          section_title?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "material_chunks_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "static_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      math_solutions: {
        Row: {
          id: string
          user_id: string
          equation: string
          solution: string
          steps: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          equation: string
          solution: string
          steps?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          equation?: string
          solution?: string
          steps?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          id: string
          type: string
          title: string
          category: string | null
          file_url: string
          file_size: number | null
          file_type: string | null
          uploaded_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          type: string
          title: string
          category?: string | null
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          title?: string
          category?: string | null
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mcq_analytics: {
        Row: {
          accuracy_percent: number
          avg_time_sec: number
          created_at: string
          date: string
          difficulty_distribution: Json | null
          id: string
          questions_attempted: number
          strong_areas: string[] | null
          subject: Database["public"]["Enums"]["mcq_subject"]
          topic: string | null
          updated_at: string
          user_id: string
          weak_areas: string[] | null
        }
        Insert: {
          accuracy_percent?: number
          avg_time_sec?: number
          created_at?: string
          date: string
          difficulty_distribution?: Json | null
          id?: string
          questions_attempted?: number
          strong_areas?: string[] | null
          subject: Database["public"]["Enums"]["mcq_subject"]
          topic?: string | null
          updated_at?: string
          user_id: string
          weak_areas?: string[] | null
        }
        Update: {
          accuracy_percent?: number
          avg_time_sec?: number
          created_at?: string
          date?: string
          difficulty_distribution?: Json | null
          id?: string
          questions_attempted?: number
          strong_areas?: string[] | null
          subject?: Database["public"]["Enums"]["mcq_subject"]
          topic?: string | null
          updated_at?: string
          user_id?: string
          weak_areas?: string[] | null
        }
        Relationships: []
      }
      mcq_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          is_skipped: boolean
          marked_for_review: boolean
          question_id: string
          selected_option: number | null
          time_spent_sec: number
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_skipped?: boolean
          marked_for_review?: boolean
          question_id: string
          selected_option?: number | null
          time_spent_sec?: number
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          is_skipped?: boolean
          marked_for_review?: boolean
          question_id?: string
          selected_option?: number | null
          time_spent_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "mcq_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "mcq_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcq_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mcq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_attempts: {
        Row: {
          accuracy_percent: number
          attempted_questions: number
          avg_time_per_question: number
          completed_at: string | null
          correct_answers: number
          difficulty: Database["public"]["Enums"]["mcq_difficulty"] | null
          id: string
          incorrect_answers: number
          mock_id: string | null
          negative_marks: number
          net_marks: number
          percentile: number | null
          rank: number | null
          session_type: Database["public"]["Enums"]["mcq_session_type"]
          started_at: string
          subject: Database["public"]["Enums"]["mcq_subject"] | null
          time_taken_sec: number
          topic: string | null
          total_marks: number
          total_questions: number
          unattempted: number
          user_id: string
        }
        Insert: {
          accuracy_percent?: number
          attempted_questions?: number
          avg_time_per_question?: number
          completed_at?: string | null
          correct_answers?: number
          difficulty?: Database["public"]["Enums"]["mcq_difficulty"] | null
          id?: string
          incorrect_answers?: number
          mock_id?: string | null
          negative_marks?: number
          net_marks?: number
          percentile?: number | null
          rank?: number | null
          session_type: Database["public"]["Enums"]["mcq_session_type"]
          started_at?: string
          subject?: Database["public"]["Enums"]["mcq_subject"] | null
          time_taken_sec?: number
          topic?: string | null
          total_marks?: number
          total_questions: number
          unattempted?: number
          user_id: string
        }
        Update: {
          accuracy_percent?: number
          attempted_questions?: number
          avg_time_per_question?: number
          completed_at?: string | null
          correct_answers?: number
          difficulty?: Database["public"]["Enums"]["mcq_difficulty"] | null
          id?: string
          incorrect_answers?: number
          mock_id?: string | null
          negative_marks?: number
          net_marks?: number
          percentile?: number | null
          rank?: number | null
          session_type?: Database["public"]["Enums"]["mcq_session_type"]
          started_at?: string
          subject?: Database["public"]["Enums"]["mcq_subject"] | null
          time_taken_sec?: number
          topic?: string | null
          total_marks?: number
          total_questions?: number
          unattempted?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_attempts_mock_id_fkey"
            columns: ["mock_id"]
            isOneToOne: false
            referencedRelation: "mcq_mock_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_bookmarks: {
        Row: {
          created_at: string
          difficulty_for_user:
            | Database["public"]["Enums"]["mcq_difficulty"]
            | null
          id: string
          last_reviewed_at: string | null
          next_review_at: string | null
          notes: string | null
          question_id: string
          review_count: number
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_for_user?:
            | Database["public"]["Enums"]["mcq_difficulty"]
            | null
          id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          notes?: string | null
          question_id: string
          review_count?: number
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_for_user?:
            | Database["public"]["Enums"]["mcq_difficulty"]
            | null
          id?: string
          last_reviewed_at?: string | null
          next_review_at?: string | null
          notes?: string | null
          question_id?: string
          review_count?: number
          tags?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mcq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_mock_questions: {
        Row: {
          id: string
          mock_id: string
          question_id: string
          question_number: number
          section: Database["public"]["Enums"]["mcq_section"]
        }
        Insert: {
          id?: string
          mock_id: string
          question_id: string
          question_number: number
          section: Database["public"]["Enums"]["mcq_section"]
        }
        Update: {
          id?: string
          mock_id?: string
          question_id?: string
          question_number?: number
          section?: Database["public"]["Enums"]["mcq_section"]
        }
        Relationships: [
          {
            foreignKeyName: "mcq_mock_questions_mock_id_fkey"
            columns: ["mock_id"]
            isOneToOne: false
            referencedRelation: "mcq_mock_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcq_mock_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "mcq_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      mcq_mock_tests: {
        Row: {
          attempt_count: number
          avg_score: number | null
          created_at: string
          description: Json | null
          difficulty_distribution: Json
          duration_min: number
          id: string
          is_active: boolean
          is_premium: boolean
          subject_distribution: Json
          title: Json
          total_marks: number
          total_questions: number
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          avg_score?: number | null
          created_at?: string
          description?: Json | null
          difficulty_distribution: Json
          duration_min?: number
          id?: string
          is_active?: boolean
          is_premium?: boolean
          subject_distribution: Json
          title: Json
          total_marks?: number
          total_questions?: number
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          avg_score?: number | null
          created_at?: string
          description?: Json | null
          difficulty_distribution?: Json
          duration_min?: number
          id?: string
          is_active?: boolean
          is_premium?: boolean
          subject_distribution?: Json
          title?: Json
          total_marks?: number
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      mcq_questions: {
        Row: {
          bloom_level: Database["public"]["Enums"]["mcq_bloom_level"]
          correct_option: number
          created_at: string
          created_by: string | null
          difficulty: Database["public"]["Enums"]["mcq_difficulty"]
          explanation: Json | null
          id: string
          is_pyy: boolean
          marks: number
          negative_marks: number
          options: Json
          question_text: Json
          source_references: Json | null
          subject: Database["public"]["Enums"]["mcq_subject"]
          subtopic: string | null
          tags: string[] | null
          time_estimate_sec: number
          topic: string
          updated_at: string
          year: number | null
        }
        Insert: {
          bloom_level?: Database["public"]["Enums"]["mcq_bloom_level"]
          correct_option: number
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["mcq_difficulty"]
          explanation?: Json | null
          id?: string
          is_pyy?: boolean
          marks?: number
          negative_marks?: number
          options: Json
          question_text: Json
          source_references?: Json | null
          subject: Database["public"]["Enums"]["mcq_subject"]
          subtopic?: string | null
          tags?: string[] | null
          time_estimate_sec?: number
          topic: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          bloom_level?: Database["public"]["Enums"]["mcq_bloom_level"]
          correct_option?: number
          created_at?: string
          created_by?: string | null
          difficulty?: Database["public"]["Enums"]["mcq_difficulty"]
          explanation?: Json | null
          id?: string
          is_pyy?: boolean
          marks?: number
          negative_marks?: number
          options?: Json
          question_text?: Json
          source_references?: Json | null
          subject?: Database["public"]["Enums"]["mcq_subject"]
          subtopic?: string | null
          tags?: string[] | null
          time_estimate_sec?: number
          topic?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      mcq_sessions: {
        Row: {
          id: string
          user_id: string
          topic: string | null
          completed: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topic?: string | null
          completed?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string | null
          completed?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mentor_goals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mentor_messages: {
        Row: {
          content: string | null
          context_snapshot: Json | null
          created_at: string | null
          id: string
          role: string | null
          session_id: string
        }
        Insert: {
          content?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          role?: string | null
          session_id: string
        }
        Update: {
          content?: string | null
          context_snapshot?: Json | null
          created_at?: string | null
          id?: string
          role?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mentor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          topic: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          topic?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mock_interview_sessions: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string | null
          difficulty: string | null
          duration_seconds: number | null
          feedback: Json | null
          id: string
          max_score: number | null
          model_used: string | null
          questions: Json | null
          score: number | null
          started_at: string | null
          strengths: string[] | null
          subject: string | null
          tokens_used: number | null
          topic: string
          user_id: string | null
          weaknesses: string[] | null
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          feedback?: Json | null
          id?: string
          max_score?: number | null
          model_used?: string | null
          questions?: Json | null
          score?: number | null
          started_at?: string | null
          strengths?: string[] | null
          subject?: string | null
          tokens_used?: number | null
          topic: string
          user_id?: string | null
          weaknesses?: string[] | null
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string | null
          difficulty?: string | null
          duration_seconds?: number | null
          feedback?: Json | null
          id?: string
          max_score?: number | null
          model_used?: string | null
          questions?: Json | null
          score?: number | null
          started_at?: string | null
          strengths?: string[] | null
          subject?: string | null
          tokens_used?: number | null
          topic?: string
          user_id?: string | null
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "mock_interview_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news_digests: {
        Row: {
          id: string
          title: string
          content: string | null
          source: string | null
          published_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content?: string | null
          source?: string | null
          published_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string | null
          source?: string | null
          published_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      monthly_compilations: {
        Row: {
          id: string
          user_id: string
          month: number
          year: number
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          month: number
          year: number
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          month?: number
          year?: number
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      note_collaborations: {
        Row: {
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          note_id: string
          permission: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          note_id: string
          permission: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          note_id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_collaborations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_exports: {
        Row: {
          created_at: string | null
          download_count: number | null
          downloaded_at: string | null
          error_message: string | null
          expires_at: string | null
          file_name: string
          file_size_bytes: number | null
          file_url: string | null
          format: string
          id: string
          note_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          download_count?: number | null
          downloaded_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_url?: string | null
          format: string
          id?: string
          note_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          download_count?: number | null
          downloaded_at?: string | null
          error_message?: string | null
          expires_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_url?: string | null
          format?: string
          id?: string
          note_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_exports_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_folders: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      note_templates: {
        Row: {
          id: string
          user_id: string | null
          title: Json
          description: Json | null
          content: Json | null
          category: string
          subcategory: string | null
          tags: Json | null
          structure: Json | null
          word_limit: number | null
          time_limit_seconds: number | null
          is_system: boolean
          is_premium: boolean
          usage_count: number
          rating: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: Json
          description?: Json | null
          content?: Json | null
          category: string
          subcategory?: string | null
          tags?: Json | null
          structure?: Json | null
          word_limit?: number | null
          time_limit_seconds?: number | null
          is_system?: boolean
          is_premium?: boolean
          usage_count?: number
          rating?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: Json
          description?: Json | null
          content?: Json | null
          category?: string
          subcategory?: string | null
          tags?: Json | null
          structure?: Json | null
          word_limit?: number | null
          time_limit_seconds?: number | null
          is_system?: boolean
          is_premium?: boolean
          usage_count?: number
          rating?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      note_versions: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          note_id: string
          save_type: string | null
          user_id: string
          version_number: number
          word_count: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          note_id: string
          save_type?: string | null
          user_id: string
          version_number: number
          word_count?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          note_id?: string
          save_type?: string | null
          user_id?: string
          version_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "note_versions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          confidence_score: number | null
          content: Json
          created_at: string | null
          generation_method: string | null
          id: string
          is_bookmarked: boolean | null
          node_id: string | null
          sources: string[] | null
          subject_slug: string | null
          topic: string
          updated_at: string | null
          user_id: string | null
          version: number | null
          views: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          confidence_score?: number | null
          content: Json
          created_at?: string | null
          generation_method?: string | null
          id?: string
          is_bookmarked?: boolean | null
          node_id?: string | null
          sources?: string[] | null
          subject_slug?: string | null
          topic: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          views?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          confidence_score?: number | null
          content?: Json
          created_at?: string | null
          generation_method?: string | null
          id?: string
          is_bookmarked?: boolean | null
          node_id?: string | null
          sources?: string[] | null
          subject_slug?: string | null
          topic?: string
          updated_at?: string | null
          user_id?: string | null
          version?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_generation_queue: {
        Row: {
          agentic_systems_used: Json | null
          brevity_level: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          max_retries: number | null
          priority: number | null
          result_note_id: string | null
          retry_count: number | null
          started_at: string | null
          status: string | null
          topic: string
          user_id: string | null
        }
        Insert: {
          agentic_systems_used?: Json | null
          brevity_level?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          result_note_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          topic: string
          user_id?: string | null
        }
        Update: {
          agentic_systems_used?: Json | null
          brevity_level?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          result_note_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: string | null
          topic?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_generation_queue_result_note_id_fkey"
            columns: ["result_note_id"]
            isOneToOne: false
            referencedRelation: "user_generated_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_generation_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_library: {
        Row: {
          brevity_level: string | null
          content_html: string | null
          content_markdown: string
          created_at: string | null
          created_by: string | null
          downloads_count: number | null
          has_manim_diagrams: boolean | null
          has_video_summary: boolean | null
          id: string
          is_premium: boolean | null
          is_published: boolean | null
          likes_count: number | null
          pdf_url: string | null
          sub_subject: string | null
          subject: string
          thumbnail_url: string | null
          title: string
          topic: string
          updated_at: string | null
          views_count: number | null
          word_count: number | null
        }
        Insert: {
          brevity_level?: string | null
          content_html?: string | null
          content_markdown: string
          created_at?: string | null
          created_by?: string | null
          downloads_count?: number | null
          has_manim_diagrams?: boolean | null
          has_video_summary?: boolean | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          pdf_url?: string | null
          sub_subject?: string | null
          subject: string
          thumbnail_url?: string | null
          title: string
          topic: string
          updated_at?: string | null
          views_count?: number | null
          word_count?: number | null
        }
        Update: {
          brevity_level?: string | null
          content_html?: string | null
          content_markdown?: string
          created_at?: string | null
          created_by?: string | null
          downloads_count?: number | null
          has_manim_diagrams?: boolean | null
          has_video_summary?: boolean | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          likes_count?: number | null
          pdf_url?: string | null
          sub_subject?: string | null
          subject?: string
          thumbnail_url?: string | null
          title?: string
          topic?: string
          updated_at?: string | null
          views_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_sources: {
        Row: {
          chapter: string | null
          created_at: string | null
          id: string
          note_id: string | null
          page_number: number | null
          source_name: string
          source_type: string | null
          source_url: string | null
        }
        Insert: {
          chapter?: string | null
          created_at?: string | null
          id?: string
          note_id?: string | null
          page_number?: number | null
          source_name: string
          source_type?: string | null
          source_url?: string | null
        }
        Update: {
          chapter?: string | null
          created_at?: string | null
          id?: string
          note_id?: string | null
          page_number?: number | null
          source_name?: string
          source_type?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_sources_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_library"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_syllabus_mapping: {
        Row: {
          note_id: string
          syllabus_code: string
          syllabus_topic: string | null
        }
        Insert: {
          note_id: string
          syllabus_code: string
          syllabus_topic?: string | null
        }
        Update: {
          note_id?: string
          syllabus_code?: string
          syllabus_topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_syllabus_mapping_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_library"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_tags: {
        Row: {
          note_id: string
          tag: string
        }
        Insert: {
          note_id: string
          tag: string
        }
        Update: {
          note_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_tags_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_library"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_marketing: boolean | null
          email_transactional: boolean | null
          email_trial_reminders: boolean | null
          push_current_affairs: boolean | null
          push_enabled: boolean | null
          push_study_reminders: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_marketing?: boolean | null
          email_transactional?: boolean | null
          email_trial_reminders?: boolean | null
          push_current_affairs?: boolean | null
          push_enabled?: boolean | null
          push_study_reminders?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_marketing?: boolean | null
          email_transactional?: boolean | null
          email_trial_reminders?: boolean | null
          push_current_affairs?: boolean | null
          push_enabled?: boolean | null
          push_study_reminders?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offline_cache: {
        Row: {
          content_id: string
          content_type: string
          downloaded_at: string | null
          expires_at: string | null
          file_size_bytes: number | null
          file_url: string
          id: string
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          downloaded_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url: string
          id?: string
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          downloaded_at?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          step_explore_features: boolean | null
          step_first_note: boolean | null
          step_first_quiz: boolean | null
          step_profile: boolean | null
          step_welcome: boolean | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          step_explore_features?: boolean | null
          step_first_note?: boolean | null
          step_first_quiz?: boolean | null
          step_profile?: boolean | null
          step_welcome?: boolean | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          step_explore_features?: boolean | null
          step_first_note?: boolean | null
          step_first_quiz?: boolean | null
          step_profile?: boolean | null
          step_welcome?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          coupon_id: string | null
          created_at: string | null
          currency: string | null
          discount_amount: number | null
          expires_at: string | null
          failure_reason: string | null
          final_amount: number
          id: string
          items: Json | null
          metadata: Json | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refunded_at: string | null
          status: string | null
          tax_amount: number | null
          user_id: string | null
        }
        Insert: {
          amount: number
          coupon_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          expires_at?: string | null
          failure_reason?: string | null
          final_amount: number
          id?: string
          items?: Json | null
          metadata?: Json | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_at?: string | null
          status?: string | null
          tax_amount?: number | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          coupon_id?: string | null
          created_at?: string | null
          currency?: string | null
          discount_amount?: number | null
          expires_at?: string | null
          failure_reason?: string | null
          final_amount?: number
          id?: string
          items?: Json | null
          metadata?: Json | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_at?: string | null
          status?: string | null
          tax_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_po_coupon"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_po_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          base_amount: number
          card_last4: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          gateway_response: Json | null
          gst_amount: number
          id: string
          initiated_at: string | null
          order_id: string | null
          payment_gateway: string
          payment_method: string | null
          status: string | null
          subscription_id: string | null
          total_amount: number
          transaction_id: string
          user_id: string | null
        }
        Insert: {
          base_amount: number
          card_last4?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          gateway_response?: Json | null
          gst_amount: number
          id?: string
          initiated_at?: string | null
          order_id?: string | null
          payment_gateway: string
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          total_amount: number
          transaction_id: string
          user_id?: string | null
        }
        Update: {
          base_amount?: number
          card_last4?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          gateway_response?: Json | null
          gst_amount?: number
          id?: string
          initiated_at?: string | null
          order_id?: string | null
          payment_gateway?: string
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          total_amount?: number
          transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          base_amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          gst_amount: number
          gst_percentage: number | null
          id: string
          invoice_number: string | null
          invoice_url: string | null
          payment_gateway: string | null
          payment_method: string | null
          plan_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          receipt_id: string | null
          refunded_at: string | null
          status: string | null
          total_amount: number
          user_id: string | null
        }
        Insert: {
          base_amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          gst_amount: number
          gst_percentage?: number | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          plan_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt_id?: string | null
          refunded_at?: string | null
          status?: string | null
          total_amount: number
          user_id?: string | null
        }
        Update: {
          base_amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          gst_amount?: number
          gst_percentage?: number | null
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          plan_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          receipt_id?: string | null
          refunded_at?: string | null
          status?: string | null
          total_amount?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_annotations: {
        Row: {
          color: string | null
          created_at: string | null
          document_id: string
          id: string
          note_content: string | null
          page_index: number
          position: Json | null
          text_content: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          note_content?: string | null
          page_index: number
          position?: Json | null
          text_content?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          note_content?: string | null
          page_index?: number
          position?: Json | null
          text_content?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_annotations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_documents: {
        Row: {
          created_at: string | null
          file_size_bytes: number | null
          id: string
          source_url: string | null
          storage_path: string
          title: string
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_size_bytes?: number | null
          id?: string
          source_url?: string | null
          storage_path: string
          title: string
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number | null
          id?: string
          source_url?: string | null
          storage_path?: string
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pdf_progress: {
        Row: {
          document_id: string
          id: string
          last_page: number | null
          last_read_at: string | null
          percentage_completed: number | null
          total_time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          document_id: string
          id?: string
          last_page?: number | null
          last_read_at?: string | null
          percentage_completed?: number | null
          total_time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          document_id?: string
          id?: string
          last_page?: number | null
          last_read_at?: string | null
          percentage_completed?: number | null
          total_time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdf_progress_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "pdf_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          id: string
          slug: string
          name: string
          price: number
          features: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          price?: number
          features?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          price?: number
          features?: Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      post_trial_access_rules: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          feature_name: string
          id: string
          is_allowed: boolean | null
          limit_per_day: number | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          feature_name: string
          id?: string
          is_allowed?: boolean | null
          limit_per_day?: number | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          feature_name?: string
          id?: string
          is_allowed?: boolean | null
          limit_per_day?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          avatar_url: string | null
          role: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          discount_applied: number
          id: string
          payment_id: string | null
          promo_code_id: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          discount_applied: number
          id?: string
          payment_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          discount_applied?: number
          id?: string
          payment_id?: string | null
          promo_code_id?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_plans: string[] | null
          code: string
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_type: string | null
          discount_value: number
          first_purchase_only: boolean | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          minimum_amount: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_plans?: string[] | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          first_purchase_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_amount?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_plans?: string[] | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          first_purchase_only?: boolean | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          minimum_amount?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_notification_tokens: {
        Row: {
          device_type: string | null
          enabled: boolean | null
          id: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          device_type?: string | null
          enabled?: boolean | null
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          device_type?: string | null
          enabled?: boolean | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          question_type: string
          question_text: string
          question_text_hi: string | null
          options: Json
          correct_answer: string
          explanation: Json | null
          explanation_hi: string | null
          subject: string | null
          difficulty: string | null
          source: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          question_type: string
          question_text: string
          question_text_hi?: string | null
          options: Json
          correct_answer: string
          explanation?: Json | null
          explanation_hi?: string | null
          subject?: string | null
          difficulty?: string | null
          source?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          question_type?: string
          question_text?: string
          question_text_hi?: string | null
          options?: Json
          correct_answer?: string
          explanation?: Json | null
          explanation_hi?: string | null
          subject?: string | null
          difficulty?: string | null
          source?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          correct_answers: number
          id: string
          quiz_id: string | null
          score: number
          started_at: string
          time_taken_seconds: number | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          correct_answers: number
          id?: string
          quiz_id?: string | null
          score: number
          started_at: string
          time_taken_seconds?: number | null
          total_questions: number
          user_id?: string | null
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          correct_answers?: number
          id?: string
          quiz_id?: string | null
          score?: number
          started_at?: string
          time_taken_seconds?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          ai_model: string | null
          ai_provider: string | null
          confidence_score: number | null
          created_at: string | null
          difficulty: string | null
          id: string
          node_id: string | null
          questions: Json
          subject_slug: string | null
          title: string
          topic: string | null
          total_questions: number
          user_id: string | null
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_provider?: string | null
          confidence_score?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          node_id?: string | null
          questions: Json
          subject_slug?: string | null
          title: string
          topic?: string | null
          total_questions: number
          user_id?: string | null
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_provider?: string | null
          confidence_score?: number | null
          created_at?: string | null
          difficulty?: string | null
          id?: string
          node_id?: string | null
          questions?: Json
          subject_slug?: string | null
          title?: string
          topic?: string | null
          total_questions?: number
          user_id?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "quizzes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referee_id: string | null
          referee_signed_up_at: string | null
          referee_subscribed_at: string | null
          referral_code: string
          referrer_id: string | null
          referrer_rewarded_at: string | null
          reward_type: string | null
          reward_value: number | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referee_id?: string | null
          referee_signed_up_at?: string | null
          referee_subscribed_at?: string | null
          referral_code: string
          referrer_id?: string | null
          referrer_rewarded_at?: string | null
          reward_type?: string | null
          reward_value?: number | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referee_id?: string | null
          referee_signed_up_at?: string | null
          referee_subscribed_at?: string | null
          referral_code?: string
          referrer_id?: string | null
          referrer_rewarded_at?: string | null
          reward_type?: string | null
          reward_value?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_commands: {
        Row: {
          command_params: Json | null
          command_type: string
          created_at: string | null
          executed_at: string | null
          expires_at: string | null
          id: string
          is_executed: boolean
          user_id: string
        }
        Insert: {
          command_params?: Json | null
          command_type: string
          created_at?: string | null
          executed_at?: string | null
          expires_at?: string | null
          id?: string
          is_executed?: boolean
          user_id: string
        }
        Update: {
          command_params?: Json | null
          command_type?: string
          created_at?: string | null
          executed_at?: string | null
          expires_at?: string | null
          id?: string
          is_executed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remote_commands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_analytics_daily: {
        Row: {
          active_subscribers: number | null
          arr: number | null
          created_at: string | null
          date: string
          id: string
          mrr: number | null
          new_subscriptions: number | null
          refunds: number | null
          total_revenue: number | null
        }
        Insert: {
          active_subscribers?: number | null
          arr?: number | null
          created_at?: string | null
          date: string
          id?: string
          mrr?: number | null
          new_subscriptions?: number | null
          refunds?: number | null
          total_revenue?: number | null
        }
        Update: {
          active_subscribers?: number | null
          arr?: number | null
          created_at?: string | null
          date?: string
          id?: string
          mrr?: number | null
          new_subscriptions?: number | null
          refunds?: number | null
          total_revenue?: number | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          last_results_count: number | null
          name: string
          query: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_results_count?: number | null
          name: string
          query: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_results_count?: number | null
          name?: string
          query?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_adjustments: {
        Row: {
          ai_recommendations: Json | null
          created_at: string | null
          id: string
          new_exam_date: string | null
          old_exam_date: string | null
          plan_id: string
          reason: string
          tasks_added: number | null
          tasks_removed: number | null
          tasks_rescheduled: number | null
          user_accepted: boolean | null
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string | null
          id?: string
          new_exam_date?: string | null
          old_exam_date?: string | null
          plan_id: string
          reason: string
          tasks_added?: number | null
          tasks_removed?: number | null
          tasks_rescheduled?: number | null
          user_accepted?: boolean | null
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string | null
          id?: string
          new_exam_date?: string | null
          old_exam_date?: string | null
          plan_id?: string
          reason?: string
          tasks_added?: number | null
          tasks_removed?: number | null
          tasks_rescheduled?: number | null
          user_accepted?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_adjustments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          applied_at: string | null
          name: string | null
          version: string
        }
        Insert: {
          applied_at?: string | null
          name?: string | null
          version: string
        }
        Update: {
          applied_at?: string | null
          name?: string | null
          version?: string
        }
        Relationships: []
      }
      search_analytics: {
        Row: {
          created_at: string | null
          id: string
          query: string
          results_count: number | null
          search_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          query: string
          results_count?: number | null
          search_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          query?: string
          results_count?: number | null
          search_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_history: {
        Row: {
          clicked_result_id: string | null
          created_at: string | null
          filters: Json | null
          id: string
          query: string
          results_count: number | null
          search_time_ms: number | null
          user_id: string | null
        }
        Insert: {
          clicked_result_id?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
          search_time_ms?: number | null
          user_id?: string | null
        }
        Update: {
          clicked_result_id?: string | null
          created_at?: string | null
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          search_time_ms?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      search_index: {
        Row: {
          book_reference: Json | null
          content_id: string
          content_text: string
          content_type: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source: string | null
          source_url: string | null
          syllabus_tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          book_reference?: Json | null
          content_id: string
          content_text: string
          content_type: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          syllabus_tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          book_reference?: Json | null
          content_id?: string
          content_text?: string
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          source_url?: string | null
          syllabus_tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          details: Json | null
          endpoint: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: string | null
          ip_hash: string | null
          request_method: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          endpoint?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          request_method?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          endpoint?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          request_method?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          action_taken: string | null
          blocked: boolean | null
          created_at: string | null
          details: Json | null
          endpoint: string | null
          event_type: string
          id: string
          ip_address: unknown
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string | null
          blocked?: boolean | null
          created_at?: string | null
          details?: Json | null
          endpoint?: string | null
          event_type: string
          id?: string
          ip_address: unknown
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string | null
          blocked?: boolean | null
          created_at?: string | null
          details?: Json | null
          endpoint?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      srs_stats: {
        Row: {
          bookmark_id: string
          ease_factor: number | null
          id: string
          interval_days: number | null
          lapses: number | null
          last_reviewed_at: string | null
          next_review_date: string | null
          repetitions: number | null
        }
        Insert: {
          bookmark_id: string
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          lapses?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          repetitions?: number | null
        }
        Update: {
          bookmark_id?: string
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          lapses?: number | null
          last_reviewed_at?: string | null
          next_review_date?: string | null
          repetitions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "srs_stats_bookmark_id_fkey"
            columns: ["bookmark_id"]
            isOneToOne: true
            referencedRelation: "bookmarks"
            referencedColumns: ["id"]
          },
        ]
      }
      static_materials: {
        Row: {
          author: string | null
          category: string | null
          chunk_count: number | null
          created_at: string | null
          description: string | null
          download_count: number | null
          edition: string | null
          file_name: string | null
          file_size: number | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          is_approved: boolean | null
          is_processed: boolean | null
          is_public: boolean | null
          is_standard: boolean | null
          last_searched_at: string | null
          min_tier: string | null
          name: string | null
          priority: number | null
          processed_at: string | null
          processing_status: string | null
          published_year: number | null
          publisher: string | null
          search_count: number | null
          standard: string | null
          subject: string | null
          subject_slug: string | null
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string | null
          uploaded_by: string | null
          view_count: number | null
          year: number | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          edition?: string | null
          file_name?: string | null
          file_size?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_approved?: boolean | null
          is_processed?: boolean | null
          is_public?: boolean | null
          is_standard?: boolean | null
          last_searched_at?: string | null
          min_tier?: string | null
          name?: string | null
          priority?: number | null
          processed_at?: string | null
          processing_status?: string | null
          published_year?: number | null
          publisher?: string | null
          search_count?: number | null
          standard?: string | null
          subject?: string | null
          subject_slug?: string | null
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          view_count?: number | null
          year?: number | null
        }
        Update: {
          author?: string | null
          category?: string | null
          chunk_count?: number | null
          created_at?: string | null
          description?: string | null
          download_count?: number | null
          edition?: string | null
          file_name?: string | null
          file_size?: number | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_approved?: boolean | null
          is_processed?: boolean | null
          is_public?: boolean | null
          is_standard?: boolean | null
          last_searched_at?: string | null
          min_tier?: string | null
          name?: string | null
          priority?: number | null
          processed_at?: string | null
          processing_status?: string | null
          published_year?: number | null
          publisher?: string | null
          search_count?: number | null
          standard?: string | null
          subject?: string | null
          subject_slug?: string | null
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string | null
          uploaded_by?: string | null
          view_count?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "static_materials_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "static_materials_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_completions: {
        Row: {
          completed_at: string | null
          id: string
          notes: string | null
          quality_rating: number | null
          task_id: string | null
          time_spent_minutes: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          quality_rating?: number | null
          task_id?: string | null
          time_spent_minutes?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          notes?: string | null
          quality_rating?: number | null
          task_id?: string | null
          time_spent_minutes?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "study_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          is_private: boolean
          member_count: number
          is_active: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          is_private?: boolean
          member_count?: number
          is_active?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          is_private?: boolean
          member_count?: number
          is_active?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      study_milestones: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          current_value: number | null
          description: string | null
          estimated_date: string | null
          id: string
          milestone_type: string
          plan_id: string
          target_value: number
          title: string
          unit: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          estimated_date?: string | null
          id?: string
          milestone_type: string
          plan_id: string
          target_value: number
          title: string
          unit: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          estimated_date?: string | null
          id?: string
          milestone_type?: string
          plan_id?: string
          target_value?: number
          title?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_milestones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          completion_percent: number | null
          created_at: string | null
          dailygoals: Json | null
          id: string
          is_active: boolean | null
          monthly_goals: Json | null
          plan_name: string
          schedule: Json | null
          streak_days: number | null
          target_exam_date: string | null
          updated_at: string | null
          user_id: string | null
          weekly_goals: Json | null
        }
        Insert: {
          completion_percent?: number | null
          created_at?: string | null
          dailygoals?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_goals?: Json | null
          plan_name: string
          schedule?: Json | null
          streak_days?: number | null
          target_exam_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          weekly_goals?: Json | null
        }
        Update: {
          completion_percent?: number | null
          created_at?: string | null
          dailygoals?: Json | null
          id?: string
          is_active?: boolean | null
          monthly_goals?: Json | null
          plan_name?: string
          schedule?: Json | null
          streak_days?: number | null
          target_exam_date?: string | null
          updated_at?: string | null
          user_id?: string | null
          weekly_goals?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "study_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_preferences: {
        Row: {
          break_frequency_minutes: number | null
          created_at: string | null
          id: string
          mock_frequency_days: number | null
          preferred_study_times: string[] | null
          revision_interval_days: number | null
          sleep_time: string | null
          updated_at: string | null
          user_id: string
          wake_up_time: string | null
        }
        Insert: {
          break_frequency_minutes?: number | null
          created_at?: string | null
          id?: string
          mock_frequency_days?: number | null
          preferred_study_times?: string[] | null
          revision_interval_days?: number | null
          sleep_time?: string | null
          updated_at?: string | null
          user_id: string
          wake_up_time?: string | null
        }
        Update: {
          break_frequency_minutes?: number | null
          created_at?: string | null
          id?: string
          mock_frequency_days?: number | null
          preferred_study_times?: string[] | null
          revision_interval_days?: number | null
          sleep_time?: string | null
          updated_at?: string | null
          user_id?: string
          wake_up_time?: string | null
        }
        Relationships: []
      }
      study_schedules: {
        Row: {
          completed_tasks: number | null
          created_at: string | null
          date: string
          day_number: number
          id: string
          plan_id: string
          status: string | null
          total_actual_minutes: number | null
          total_estimated_minutes: number | null
          total_tasks: number | null
        }
        Insert: {
          completed_tasks?: number | null
          created_at?: string | null
          date: string
          day_number: number
          id?: string
          plan_id: string
          status?: string | null
          total_actual_minutes?: number | null
          total_estimated_minutes?: number | null
          total_tasks?: number | null
        }
        Update: {
          completed_tasks?: number | null
          created_at?: string | null
          date?: string
          day_number?: number
          id?: string
          plan_id?: string
          status?: string | null
          total_actual_minutes?: number | null
          total_estimated_minutes?: number | null
          total_tasks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "study_schedules_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_sessions: {
        Row: {
          ca_articles_read: number | null
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          notes_created: number | null
          plan_id: string | null
          productivity_rating: number | null
          quizzes_attempted: number | null
          session_date: string
          started_at: string | null
          subject_slug: string | null
          topics_covered: string[] | null
          user_id: string | null
        }
        Insert: {
          ca_articles_read?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          notes_created?: number | null
          plan_id?: string | null
          productivity_rating?: number | null
          quizzes_attempted?: number | null
          session_date?: string
          started_at?: string | null
          subject_slug?: string | null
          topics_covered?: string[] | null
          user_id?: string | null
        }
        Update: {
          ca_articles_read?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          notes_created?: number | null
          plan_id?: string | null
          productivity_rating?: number | null
          quizzes_attempted?: number | null
          session_date?: string
          started_at?: string | null
          subject_slug?: string | null
          topics_covered?: string[] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_sessions_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      study_tasks: {
        Row: {
          actual_minutes: number | null
          ai_generated: boolean | null
          completed_at: string | null
          content_links: string[] | null
          created_at: string | null
          estimated_minutes: number | null
          id: string
          order_index: number | null
          schedule_id: string
          status: string | null
          subject: string
          subtopic: string | null
          task_type: string
          topic: string
        }
        Insert: {
          actual_minutes?: number | null
          ai_generated?: boolean | null
          completed_at?: string | null
          content_links?: string[] | null
          created_at?: string | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number | null
          schedule_id: string
          status?: string | null
          subject: string
          subtopic?: string | null
          task_type: string
          topic: string
        }
        Update: {
          actual_minutes?: number | null
          ai_generated?: boolean | null
          completed_at?: string | null
          content_links?: string[] | null
          created_at?: string | null
          estimated_minutes?: number | null
          id?: string
          order_index?: number | null
          schedule_id?: string
          status?: string | null
          subject?: string
          subtopic?: string | null
          task_type?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "study_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          change_type: string | null
          created_at: string | null
          effective_date: string | null
          id: string
          new_plan_id: string | null
          old_plan_id: string | null
          price_difference: number | null
          user_id: string | null
        }
        Insert: {
          change_type?: string | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          new_plan_id?: string | null
          old_plan_id?: string | null
          price_difference?: number | null
          user_id?: string | null
        }
        Update: {
          change_type?: string | null
          created_at?: string | null
          effective_date?: string | null
          id?: string
          new_plan_id?: string | null
          old_plan_id?: string | null
          price_difference?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sh_new"
            columns: ["new_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sh_old"
            columns: ["old_plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_sh_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          display_name: string | null
          display_order: number | null
          duration_months: number | null
          features: Json | null
          features_list: string[] | null
          gst_percent: number | null
          gst_percentage: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          limits: Json | null
          name: string
          price_3monthly: number | null
          price_monthly: number | null
          price_quarterly: number | null
          price_yearly: number | null
          razorpay_plan_id: string | null
          slug: string
          sort_order: number | null
          tier: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_name?: string | null
          display_order?: number | null
          duration_months?: number | null
          features?: Json | null
          features_list?: string[] | null
          gst_percent?: number | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name: string
          price_3monthly?: number | null
          price_monthly?: number | null
          price_quarterly?: number | null
          price_yearly?: number | null
          razorpay_plan_id?: string | null
          slug: string
          sort_order?: number | null
          tier?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          display_name?: string | null
          display_order?: number | null
          duration_months?: number | null
          features?: Json | null
          features_list?: string[] | null
          gst_percent?: number | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          limits?: Json | null
          name?: string
          price_3monthly?: number | null
          price_monthly?: number | null
          price_quarterly?: number | null
          price_yearly?: number | null
          razorpay_plan_id?: string | null
          slug?: string
          sort_order?: number | null
          tier?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          plan_type: string
          status: string
          trial_started_at: string | null
          trial_expires_at: string | null
          current_period_start: string | null
          current_period_end: string | null
          auto_renew: boolean
          cancelled_at: string | null
          refunded_at: string | null
          refund_amount: number | null
          ends_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          plan_type: string
          status?: string
          trial_started_at?: string | null
          trial_expires_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          auto_renew?: boolean
          cancelled_at?: string | null
          refunded_at?: string | null
          refund_amount?: number | null
          ends_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          plan_type?: string
          status?: string
          trial_started_at?: string | null
          trial_expires_at?: string | null
          current_period_start?: string | null
          current_period_end?: string | null
          auto_renew?: boolean
          cancelled_at?: string | null
          refunded_at?: string | null
          refund_amount?: number | null
          ends_at?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      syllabus_nodes: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          paper: string | null
          parent_id: string | null
          subject: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          paper?: string | null
          parent_id?: string | null
          subject?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          paper?: string | null
          parent_id?: string | null
          subject?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "syllabus_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "syllabus_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      syllabus_topics: {
        Row: {
          id: string
          subject_slug: string
          topic_name: string
          parent_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          subject_slug: string
          topic_name: string
          parent_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          subject_slug?: string
          topic_name?: string
          parent_id?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      template_ratings: {
        Row: {
          id: string
          template_id: string
          user_id: string
          rating: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          template_id: string
          user_id: string
          rating: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          template_id?: string
          user_id?: string
          rating?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenth_class_notes: {
        Row: {
          chapter_number: number
          chapter_title: string
          created_at: string | null
          diagrams_urls: string[] | null
          examples: string[] | null
          helpful_count: number | null
          id: string
          important_terms: Json | null
          is_free: boolean | null
          key_concepts: Json | null
          min_tier: string | null
          mnemonics: string[] | null
          pdf_url: string | null
          practice_questions: Json | null
          quick_facts: string[] | null
          related_current_affairs: string[] | null
          subject_slug: string | null
          summary: string
          updated_at: string | null
          upsc_connections: string | null
          views: number | null
        }
        Insert: {
          chapter_number: number
          chapter_title: string
          created_at?: string | null
          diagrams_urls?: string[] | null
          examples?: string[] | null
          helpful_count?: number | null
          id?: string
          important_terms?: Json | null
          is_free?: boolean | null
          key_concepts?: Json | null
          min_tier?: string | null
          mnemonics?: string[] | null
          pdf_url?: string | null
          practice_questions?: Json | null
          quick_facts?: string[] | null
          related_current_affairs?: string[] | null
          subject_slug?: string | null
          summary: string
          updated_at?: string | null
          upsc_connections?: string | null
          views?: number | null
        }
        Update: {
          chapter_number?: number
          chapter_title?: string
          created_at?: string | null
          diagrams_urls?: string[] | null
          examples?: string[] | null
          helpful_count?: number | null
          id?: string
          important_terms?: Json | null
          is_free?: boolean | null
          key_concepts?: Json | null
          min_tier?: string | null
          mnemonics?: string[] | null
          pdf_url?: string | null
          practice_questions?: Json | null
          quick_facts?: string[] | null
          related_current_affairs?: string[] | null
          subject_slug?: string | null
          summary?: string
          updated_at?: string | null
          upsc_connections?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tenth_class_notes_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      trial_sessions: {
        Row: {
          converted_at: string | null
          converted_to_paid: boolean | null
          converted_to_plan: string | null
          created_at: string | null
          ends_at: string
          features_used: Json | null
          id: string
          is_expired: boolean | null
          started_at: string
          total_notes_generated: number | null
          total_quizzes_taken: number | null
          total_time_spent_minutes: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          converted_at?: string | null
          converted_to_paid?: boolean | null
          converted_to_plan?: string | null
          created_at?: string | null
          ends_at: string
          features_used?: Json | null
          id?: string
          is_expired?: boolean | null
          started_at?: string
          total_notes_generated?: number | null
          total_quizzes_taken?: number | null
          total_time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          converted_at?: string | null
          converted_to_paid?: boolean | null
          converted_to_plan?: string | null
          created_at?: string | null
          ends_at?: string
          features_used?: Json | null
          id?: string
          is_expired?: boolean | null
          started_at?: string
          total_notes_generated?: number | null
          total_quizzes_taken?: number | null
          total_time_spent_minutes?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      upsc_input_normalizations: {
        Row: {
          confidence: number
          created_at: string | null
          id: string
          method: string
          node_id: string | null
          raw_input: string
          raw_input_hash: string
          resolved_subject: string | null
          resolved_subtopic: string | null
          resolved_topic: string | null
        }
        Insert: {
          confidence: number
          created_at?: string | null
          id?: string
          method: string
          node_id?: string | null
          raw_input: string
          raw_input_hash: string
          resolved_subject?: string | null
          resolved_subtopic?: string | null
          resolved_topic?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string | null
          id?: string
          method?: string
          node_id?: string | null
          raw_input?: string
          raw_input_hash?: string
          resolved_subject?: string | null
          resolved_subtopic?: string | null
          resolved_topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upsc_input_normalizations_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      upsc_syllabus: {
        Row: {
          created_at: string | null
          id: string
          keywords: string[] | null
          paper: string
          priority: number | null
          subject: string
          subtopics: string[] | null
          topic: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          paper: string
          priority?: number | null
          subject: string
          subtopics?: string[] | null
          topic: string
        }
        Update: {
          created_at?: string | null
          id?: string
          keywords?: string[] | null
          paper?: string
          priority?: number | null
          subject?: string
          subtopics?: string[] | null
          topic?: string
        }
        Relationships: []
      }
      upsc_syllabus_topics: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          paper: string | null
          related_topics: string[] | null
          section: string | null
          sub_topics: string[] | null
          subject_slug: string | null
          topic_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          paper?: string | null
          related_topics?: string[] | null
          section?: string | null
          sub_topics?: string[] | null
          subject_slug?: string | null
          topic_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          paper?: string | null
          related_topics?: string[] | null
          section?: string | null
          sub_topics?: string[] | null
          subject_slug?: string | null
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsc_syllabus_topics_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
        ]
      }
      usage_limits: {
        Row: {
          created_at: string | null
          current_count: number | null
          feature_name: string
          id: string
          limit_type: string | null
          limit_value: number
          reset_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_count?: number | null
          feature_name: string
          id?: string
          limit_type?: string | null
          limit_value: number
          reset_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_count?: number | null
          feature_name?: string
          id?: string
          limit_type?: string | null
          limit_value?: number
          reset_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_records: {
        Row: {
          id: string
          user_id: string
          period_start: string
          period_end: string
          tokens_used: number
          requests_made: number
          provider_cost: number
          overage_tokens: number
          overage_requests: number
          overage_charge: number
          total_charge: number
          status: string
          invoice_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          period_start: string
          period_end: string
          tokens_used?: number
          requests_made?: number
          provider_cost?: number
          overage_tokens?: number
          overage_requests?: number
          overage_charge?: number
          total_charge?: number
          status?: string
          invoice_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          period_start?: string
          period_end?: string
          tokens_used?: number
          requests_made?: number
          provider_cost?: number
          overage_tokens?: number
          overage_requests?: number
          overage_charge?: number
          total_charge?: number
          status?: string
          invoice_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          credits_consumed: number | null
          duration_seconds: number | null
          feature: string
          id: string
          metadata: Json | null
          quality: string | null
          resource_id: string | null
          resource_type: string | null
          tokens_used: number | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_consumed?: number | null
          duration_seconds?: number | null
          feature: string
          id?: string
          metadata?: Json | null
          quality?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tokens_used?: number | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_consumed?: number | null
          duration_seconds?: number | null
          feature?: string
          id?: string
          metadata?: Json | null
          quality?: string | null
          resource_id?: string | null
          resource_type?: string | null
          tokens_used?: number | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          content: Json
          created_at: string | null
          evaluation_id: string | null
          id: string
          question_id: string | null
          question_text: Json
          status: string | null
          submitted_at: string | null
          time_limit_seconds: number | null
          time_taken_seconds: number | null
          updated_at: string | null
          user_id: string
          word_count: number | null
          word_limit: number | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          evaluation_id?: string | null
          id?: string
          question_id?: string | null
          question_text?: Json
          status?: string | null
          submitted_at?: string | null
          time_limit_seconds?: number | null
          time_taken_seconds?: number | null
          updated_at?: string | null
          user_id: string
          word_count?: number | null
          word_limit?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          evaluation_id?: string | null
          id?: string
          question_id?: string | null
          question_text?: Json
          status?: string | null
          submitted_at?: string | null
          time_limit_seconds?: number | null
          time_taken_seconds?: number | null
          updated_at?: string | null
          user_id?: string
          word_count?: number | null
          word_limit?: number | null
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          created_at: string | null
          encrypted_key: string
          id: string
          is_active: boolean
          key_hash: string
          last_used_at: string | null
          last_validated: string | null
          provider: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key: string
          id?: string
          is_active?: boolean
          key_hash: string
          last_used_at?: string | null
          last_validated?: string | null
          provider: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_key?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          last_used_at?: string | null
          last_validated?: string | null
          provider?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          folder: string | null
          id: string
          notes: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          folder?: string | null
          id?: string
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          folder?: string | null
          id?: string
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          admin_response: string | null
          browser_info: Json | null
          created_at: string | null
          id: string
          message: string
          page_url: string | null
          rating: number | null
          resolved_at: string | null
          screenshot_url: string | null
          status: string | null
          subject: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          browser_info?: Json | null
          created_at?: string | null
          id?: string
          message: string
          page_url?: string | null
          rating?: number | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string | null
          subject?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          browser_info?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          page_url?: string | null
          rating?: number | null
          resolved_at?: string | null
          screenshot_url?: string | null
          status?: string | null
          subject?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          user_id: string
          xp_total: number
          level: number
          updated_at: string | null
        }
        Insert: {
          user_id: string
          xp_total?: number
          level?: number
          updated_at?: string | null
        }
        Update: {
          user_id?: string
          xp_total?: number
          level?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_generated_notes: {
        Row: {
          agentic_sources: Json | null
          ai_provider_used: string | null
          brevity_level: string | null
          content_html: string | null
          content_markdown: string | null
          created_at: string | null
          error_message: string | null
          has_manim_diagrams: boolean | null
          has_video_summary: boolean | null
          id: string
          pdf_url: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          status: string | null
          topic: string
          user_id: string | null
          word_count: number | null
        }
        Insert: {
          agentic_sources?: Json | null
          ai_provider_used?: string | null
          brevity_level?: string | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string | null
          error_message?: string | null
          has_manim_diagrams?: boolean | null
          has_video_summary?: boolean | null
          id?: string
          pdf_url?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          status?: string | null
          topic: string
          user_id?: string | null
          word_count?: number | null
        }
        Update: {
          agentic_sources?: Json | null
          ai_provider_used?: string | null
          brevity_level?: string | null
          content_html?: string | null
          content_markdown?: string | null
          created_at?: string | null
          error_message?: string | null
          has_manim_diagrams?: boolean | null
          has_video_summary?: boolean | null
          id?: string
          pdf_url?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          status?: string | null
          topic?: string
          user_id?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_generated_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lecture_limits: {
        Row: {
          daily_limit: number | null
          daily_reset_at: string | null
          daily_used: number | null
          monthly_limit: number | null
          monthly_reset_at: string | null
          monthly_used: number | null
          total_generated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          daily_limit?: number | null
          daily_reset_at?: string | null
          daily_used?: number | null
          monthly_limit?: number | null
          monthly_reset_at?: string | null
          monthly_used?: number | null
          total_generated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          daily_limit?: number | null
          daily_reset_at?: string | null
          daily_used?: number | null
          monthly_limit?: number | null
          monthly_reset_at?: string | null
          monthly_used?: number | null
          total_generated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lecture_limits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lectures: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          is_bookmarked: boolean | null
          is_completed: boolean | null
          last_watched_position: number | null
          lecture_job_id: string | null
          notes_pdf_url: string | null
          subject_slug: string | null
          thumbnail_url: string | null
          title: string
          total_chapters: number | null
          updated_at: string | null
          user_id: string | null
          user_rating: number | null
          video_url: string
          views: number | null
          watch_progress: number | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_bookmarked?: boolean | null
          is_completed?: boolean | null
          last_watched_position?: number | null
          lecture_job_id?: string | null
          notes_pdf_url?: string | null
          subject_slug?: string | null
          thumbnail_url?: string | null
          title: string
          total_chapters?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_rating?: number | null
          video_url: string
          views?: number | null
          watch_progress?: number | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          is_bookmarked?: boolean | null
          is_completed?: boolean | null
          last_watched_position?: number | null
          lecture_job_id?: string | null
          notes_pdf_url?: string | null
          subject_slug?: string | null
          thumbnail_url?: string | null
          title?: string
          total_chapters?: number | null
          updated_at?: string | null
          user_id?: string | null
          user_rating?: number | null
          video_url?: string
          views?: number | null
          watch_progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lectures_lecture_job_id_fkey"
            columns: ["lecture_job_id"]
            isOneToOne: false
            referencedRelation: "lecture_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lectures_subject_slug_fkey"
            columns: ["subject_slug"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "user_lectures_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_mastery: {
        Row: {
          accuracy_score: number | null
          attempts: number | null
          correct: number | null
          id: string
          last_attempted_at: string | null
          mastery_level: string
          next_revision_at: string | null
          node_id: string
          time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          attempts?: number | null
          correct?: number | null
          id?: string
          last_attempted_at?: string | null
          mastery_level?: string
          next_revision_at?: string | null
          node_id: string
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          attempts?: number | null
          correct?: number | null
          id?: string
          last_attempted_at?: string | null
          mastery_level?: string
          next_revision_at?: string | null
          node_id?: string
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mastery_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          character_count: number | null
          content: Json
          created_at: string | null
          folder_id: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          is_public: boolean | null
          is_template: boolean | null
          last_saved_at: string | null
          source_type: string | null
          source_video_id: string | null
          subject: string | null
          tags: string[] | null
          title: Json
          updated_at: string | null
          user_id: string
          video_timestamp_seconds: number | null
          word_count: number | null
        }
        Insert: {
          character_count?: number | null
          content?: Json
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          is_public?: boolean | null
          is_template?: boolean | null
          last_saved_at?: string | null
          source_type?: string | null
          source_video_id?: string | null
          subject?: string | null
          tags?: string[] | null
          title?: Json
          updated_at?: string | null
          user_id: string
          video_timestamp_seconds?: number | null
          word_count?: number | null
        }
        Update: {
          character_count?: number | null
          content?: Json
          created_at?: string | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          is_public?: boolean | null
          is_template?: boolean | null
          last_saved_at?: string | null
          source_type?: string | null
          source_video_id?: string | null
          subject?: string | null
          tags?: string[] | null
          title?: Json
          updated_at?: string | null
          user_id?: string
          video_timestamp_seconds?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "note_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_source_video_id_fkey"
            columns: ["source_video_id"]
            isOneToOne: false
            referencedRelation: "video_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          note_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_bookmarks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes_likes: {
        Row: {
          created_at: string | null
          id: string
          note_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_notes_likes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes_library"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_notes_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          syllabus_node_id: string | null
          completion_percent: number
          confidence_score: number | null
          next_revision_date: string | null
          syllabus_coverage: number | null
          study_streak: number
          best_streak: number
          total_study_hours: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          syllabus_node_id?: string | null
          completion_percent?: number
          confidence_score?: number | null
          next_revision_date?: string | null
          syllabus_coverage?: number | null
          study_streak?: number
          best_streak?: number
          total_study_hours?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          syllabus_node_id?: string | null
          completion_percent?: number
          confidence_score?: number | null
          next_revision_date?: string | null
          syllabus_coverage?: number | null
          study_streak?: number
          best_streak?: number
          total_study_hours?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_statistics: {
        Row: {
          average_quiz_score: number | null
          last_video_generated_at: string | null
          total_animations_generated: number
          total_api_calls: number
          total_notes_generated: number
          total_quizzes_attempted: number
          total_storage_used_bytes: number
          total_video_duration_seconds: number
          total_videos_generated: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_quiz_score?: number | null
          last_video_generated_at?: string | null
          total_animations_generated?: number
          total_api_calls?: number
          total_notes_generated?: number
          total_quizzes_attempted?: number
          total_storage_used_bytes?: number
          total_video_duration_seconds?: number
          total_videos_generated?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_quiz_score?: number | null
          last_video_generated_at?: string | null
          total_animations_generated?: number
          total_api_calls?: number
          total_notes_generated?: number
          total_quizzes_attempted?: number
          total_storage_used_bytes?: number
          total_video_duration_seconds?: number
          total_videos_generated?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          auto_renew: boolean | null
          base_price: number
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          ends_at: string | null
          gst_amount: number
          id: string
          last_renewed_at: string | null
          next_billing_date: string | null
          payment_id: string | null
          payment_method: string | null
          plan_id: string | null
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          started_at: string
          starts_at: string | null
          status: string | null
          tier: string
          total_price: number
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          base_price: number
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end: string
          current_period_start: string
          ends_at?: string | null
          gst_amount: number
          id?: string
          last_renewed_at?: string | null
          next_billing_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          plan_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          started_at?: string
          starts_at?: string | null
          status?: string | null
          tier: string
          total_price: number
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          base_price?: number
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          ends_at?: string | null
          gst_amount?: number
          id?: string
          last_renewed_at?: string | null
          next_billing_date?: string | null
          payment_id?: string | null
          payment_method?: string | null
          plan_id?: string | null
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          started_at?: string
          starts_at?: string | null
          status?: string | null
          tier?: string
          total_price?: number
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_us_plan"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_us_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_video_bookmarks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_video_likes: {
        Row: {
          created_at: string | null
          id: string
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_xp_stats: {
        Row: {
          current_balance: number | null
          id: string
          last_updated: string | null
          level: number | null
          longest_streak: number | null
          streak_count: number | null
          streak_freezes: number | null
          total_earned: number | null
          user_id: string
        }
        Insert: {
          current_balance?: number | null
          id?: string
          last_updated?: string | null
          level?: number | null
          longest_streak?: number | null
          streak_count?: number | null
          streak_freezes?: number | null
          total_earned?: number | null
          user_id: string
        }
        Update: {
          current_balance?: number | null
          id?: string
          last_updated?: string | null
          level?: number | null
          longest_streak?: number | null
          streak_count?: number | null
          streak_freezes?: number | null
          total_earned?: number | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          last_seen_at: string | null
          name: string | null
          phone: string | null
          post_trial: boolean | null
          preferences: Json | null
          role: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          trial_used: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          last_seen_at?: string | null
          name?: string | null
          phone?: string | null
          post_trial?: boolean | null
          preferences?: Json | null
          role?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_seen_at?: string | null
          name?: string | null
          phone?: string | null
          post_trial?: boolean | null
          preferences?: Json | null
          role?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      video_analytics_daily: {
        Row: {
          avg_watch_time_seconds: number | null
          completion_rate: number | null
          created_at: string | null
          date: string
          downloads: number | null
          id: string
          likes: number | null
          shares: number | null
          traffic_source: Json | null
          video_id: string | null
          views: number | null
        }
        Insert: {
          avg_watch_time_seconds?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date: string
          downloads?: number | null
          id?: string
          likes?: number | null
          shares?: number | null
          traffic_source?: Json | null
          video_id?: string | null
          views?: number | null
        }
        Update: {
          avg_watch_time_seconds?: number | null
          completion_rate?: number | null
          created_at?: string | null
          date?: string
          downloads?: number | null
          id?: string
          likes?: number | null
          shares?: number | null
          traffic_source?: Json | null
          video_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_analytics_daily_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_generation_queue: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          estimated_completion_at: string | null
          id: string
          max_retries: number | null
          priority: number | null
          progress: number | null
          retry_count: number | null
          script: string | null
          started_at: string | null
          status: string | null
          subject: string | null
          thumbnail_url: string | null
          topic: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion_at?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          progress?: number | null
          retry_count?: number | null
          script?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          topic: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          estimated_completion_at?: string | null
          id?: string
          max_retries?: number | null
          priority?: number | null
          progress?: number | null
          retry_count?: number | null
          script?: string | null
          started_at?: string | null
          status?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          topic?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_generation_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_generation_tasks: {
        Row: {
          completed_at: string | null
          created_at: string | null
          duration_minutes: number
          error_message: string | null
          expires_at: string | null
          file_size_bytes: number | null
          final_video_url: string | null
          groq_api_calls: number | null
          id: string
          include_animation: boolean
          manim_output_url: string | null
          processing_time_seconds: number | null
          quality: string | null
          remotion_output_url: string | null
          script_text: string | null
          status: string
          storyboard_json: Json | null
          subtopic: string | null
          thumbnail_url: string | null
          topic: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          final_video_url?: string | null
          groq_api_calls?: number | null
          id?: string
          include_animation?: boolean
          manim_output_url?: string | null
          processing_time_seconds?: number | null
          quality?: string | null
          remotion_output_url?: string | null
          script_text?: string | null
          status?: string
          storyboard_json?: Json | null
          subtopic?: string | null
          thumbnail_url?: string | null
          topic: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          error_message?: string | null
          expires_at?: string | null
          file_size_bytes?: number | null
          final_video_url?: string | null
          groq_api_calls?: number | null
          id?: string
          include_animation?: boolean
          manim_output_url?: string | null
          processing_time_seconds?: number | null
          quality?: string | null
          remotion_output_url?: string | null
          script_text?: string | null
          status?: string
          storyboard_json?: Json | null
          subtopic?: string | null
          thumbnail_url?: string | null
          topic?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_generation_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          timestamp_seconds: number
          updated_at: string | null
          user_id: string
          video_request_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          timestamp_seconds: number
          updated_at?: string | null
          user_id: string
          video_request_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          timestamp_seconds?: number
          updated_at?: string | null
          user_id?: string
          video_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_notes_video_request_id_fkey"
            columns: ["video_request_id"]
            isOneToOne: false
            referencedRelation: "video_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      video_requests: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          error_message: string | null
          id: string
          script_content: string | null
          status: string | null
          subject: string | null
          thumbnail_url: string | null
          topic: string
          transcript: string | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          script_content?: string | null
          status?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          topic: string
          transcript?: string | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          script_content?: string | null
          status?: string | null
          subject?: string | null
          thumbnail_url?: string | null
          topic?: string
          transcript?: string | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      video_shorts: {
        Row: {
          ai_provider_used: string | null
          created_at: string | null
          description: string | null
          downloads_count: number | null
          duration_seconds: number | null
          file_size_bytes: number | null
          format: string | null
          generated_by: string | null
          has_captions: boolean | null
          has_manim_visuals: boolean | null
          has_tts_audio: boolean | null
          hashtags: string[] | null
          id: string
          is_premium: boolean | null
          is_published: boolean | null
          language: string | null
          likes_count: number | null
          resolution: string | null
          script: string
          seo_tags: string[] | null
          shares_count: number | null
          social_caption: string | null
          subject: string
          thumbnail_url: string | null
          title: string
          topic: string
          updated_at: string | null
          video_url: string
          views_count: number | null
        }
        Insert: {
          ai_provider_used?: string | null
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          format?: string | null
          generated_by?: string | null
          has_captions?: boolean | null
          has_manim_visuals?: boolean | null
          has_tts_audio?: boolean | null
          hashtags?: string[] | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          language?: string | null
          likes_count?: number | null
          resolution?: string | null
          script: string
          seo_tags?: string[] | null
          shares_count?: number | null
          social_caption?: string | null
          subject: string
          thumbnail_url?: string | null
          title: string
          topic: string
          updated_at?: string | null
          video_url: string
          views_count?: number | null
        }
        Update: {
          ai_provider_used?: string | null
          created_at?: string | null
          description?: string | null
          downloads_count?: number | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          format?: string | null
          generated_by?: string | null
          has_captions?: boolean | null
          has_manim_visuals?: boolean | null
          has_tts_audio?: boolean | null
          hashtags?: string[] | null
          id?: string
          is_premium?: boolean | null
          is_published?: boolean | null
          language?: string | null
          likes_count?: number | null
          resolution?: string | null
          script?: string
          seo_tags?: string[] | null
          shares_count?: number | null
          social_caption?: string | null
          subject?: string
          thumbnail_url?: string | null
          title?: string
          topic?: string
          updated_at?: string | null
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "video_shorts_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      video_social_posts: {
        Row: {
          caption: string | null
          created_at: string | null
          engagement_data: Json | null
          error_message: string | null
          hashtags: string[] | null
          id: string
          platform: string
          post_id: string | null
          post_status: string | null
          post_url: string | null
          posted_at: string | null
          scheduled_at: string | null
          updated_at: string | null
          video_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          engagement_data?: Json | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          platform: string
          post_id?: string | null
          post_status?: string | null
          post_url?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
          updated_at?: string | null
          video_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          engagement_data?: Json | null
          error_message?: string | null
          hashtags?: string[] | null
          id?: string
          platform?: string
          post_id?: string | null
          post_status?: string | null
          post_url?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
          updated_at?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_social_posts_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video_shorts"
            referencedColumns: ["id"]
          },
        ]
      }
      video_watch_progress: {
        Row: {
          id: string
          is_completed: boolean | null
          last_position_seconds: number | null
          percent_watched: number | null
          playback_speed: number | null
          updated_at: string | null
          user_id: string
          video_request_id: string
        }
        Insert: {
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          percent_watched?: number | null
          playback_speed?: number | null
          updated_at?: string | null
          user_id: string
          video_request_id: string
        }
        Update: {
          id?: string
          is_completed?: boolean | null
          last_position_seconds?: number | null
          percent_watched?: number | null
          playback_speed?: number | null
          updated_at?: string | null
          user_id?: string
          video_request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_watch_progress_video_request_id_fkey"
            columns: ["video_request_id"]
            isOneToOne: true
            referencedRelation: "video_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          id: string
          topic: string
          title: string
          video_url: string | null
          description: string | null
          transcript: string | null
          node_id: string | null
          subject: string | null
          subject_slug: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          topic: string
          title: string
          video_url?: string | null
          description?: string | null
          transcript?: string | null
          node_id?: string | null
          subject?: string | null
          subject_slug?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          topic?: string
          title?: string
          video_url?: string | null
          description?: string | null
          transcript?: string | null
          node_id?: string | null
          subject?: string | null
          subject_slug?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      weekly_subject_balance: {
        Row: {
          created_at: string | null
          csat_minutes: number | null
          gs1_minutes: number | null
          gs2_minutes: number | null
          gs3_minutes: number | null
          gs4_minutes: number | null
          id: string
          mock_test_minutes: number | null
          optional_minutes: number | null
          plan_id: string
          revision_minutes: number | null
          week_end_date: string
          week_start_date: string
        }
        Insert: {
          created_at?: string | null
          csat_minutes?: number | null
          gs1_minutes?: number | null
          gs2_minutes?: number | null
          gs3_minutes?: number | null
          gs4_minutes?: number | null
          id?: string
          mock_test_minutes?: number | null
          optional_minutes?: number | null
          plan_id: string
          revision_minutes?: number | null
          week_end_date: string
          week_start_date: string
        }
        Update: {
          created_at?: string | null
          csat_minutes?: number | null
          gs1_minutes?: number | null
          gs2_minutes?: number | null
          gs3_minutes?: number | null
          gs4_minutes?: number | null
          id?: string
          mock_test_minutes?: number | null
          optional_minutes?: number | null
          plan_id?: string
          revision_minutes?: number | null
          week_end_date?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_subject_balance_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_health: {
        Row: {
          id: string
          worker_id: string
          status: string
          last_heartbeat: string | null
          current_job_id: string | null
          jobs_processed: number
          avg_processing_time_ms: number | null
        }
        Insert: {
          id?: string
          worker_id: string
          status?: string
          last_heartbeat?: string | null
          current_job_id?: string | null
          jobs_processed?: number
          avg_processing_time_ms?: number | null
        }
        Update: {
          id?: string
          worker_id?: string
          status?: string
          last_heartbeat?: string | null
          current_job_id?: string | null
          jobs_processed?: number
          avg_processing_time_ms?: number | null
        }
        Relationships: []
      }

      xp_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          source: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      crawl_statistics: {
        Row: {
          avg_content_length: number | null
          crawl_source: string | null
          days_active: number | null
          last_crawl: string | null
          total_articles: number | null
        }
        Relationships: []
      }
      user_mcq_stats: {
        Row: {
          avg_accuracy: number | null
          avg_score: number | null
          last_attempt: string | null
          total_attempts: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_activity_heatmap: {
        Row: {
          study_date: string | null
          tasks_completed: number | null
          total_hours: number | null
        }
        Relationships: []
      }
      v_daily_study_hours: {
        Row: {
          study_date: string | null
          subject: string | null
          tasks_completed: number | null
          total_hours: number | null
          total_minutes: number | null
        }
        Relationships: []
      }
      v_readiness_factors: {
        Row: {
          accuracy_factor: number | null
          consistency_factor: number | null
          coverage_factor: number | null
          mock_factor: number | null
        }
        Relationships: []
      }
      v_subject_accuracy: {
        Row: {
          accuracy_percentage: number | null
          correct_answers: number | null
          subject: Database["public"]["Enums"]["mcq_subject"] | null
          total_attempts: number | null
          week_start: string | null
        }
        Relationships: []
      }
      v_syllabus_coverage: {
        Row: {
          subject: string | null
          topics_in_plan: number | null
          topics_studied: number | null
        }
        Relationships: []
      }
      v_today_ca_articles: {
        Row: {
          category: string | null
          id: string | null
          image_url: string | null
          importance: number | null
          mcq_count: number | null
          read_time_min: number | null
          source_name: string | null
          summary: string | null
          summary_hindi: string | null
          syllabus_mapping: Json | null
          title: string | null
          title_hindi: string | null
        }
        Relationships: []
      }
      v_user_mcq_stats: {
        Row: {
          accuracy_percentage: number | null
          avg_time_per_question: number | null
          correct_answers: number | null
          last_attempt_at: string | null
          total_attempts: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_user_today_progress: {
        Row: {
          articles_bookmarked: number | null
          articles_read: number | null
          progress_percentage: number | null
          total_articles: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_weekly_summary: {
        Row: {
          active_days: number | null
          total_hours: number | null
          total_minutes: number | null
          total_tasks: number | null
          week_start: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_chat_message: {
        Args: { p_content: string; p_role: string; p_session_id: string }
        Returns: undefined
      }
      admin_override_ip_block: {
        Args: { p_action: string; p_admin_user_id: string; p_ip_hash: string }
        Returns: boolean
      }
      award_xp: {
        Args: {
          p_amount: number
          p_description?: string
          p_source: string
          p_user_id: string
        }
        Returns: undefined
      }
      calculate_gst: {
        Args: { base_amount: number; gst_percent?: number }
        Returns: number
      }
      can_access_feature_post_trial: {
        Args: {
          p_content_type?: string
          p_feature_name: string
          p_user_id: string
        }
        Returns: boolean
      }
      can_generate_lecture: {
        Args: { p_user_id: string }
        Returns: {
          can_generate: boolean
          daily_remaining: number
          monthly_remaining: number
          reason: string
        }[]
      }
      check_duplicate_content: { Args: { p_hash: string }; Returns: boolean }
      check_ip_registration: {
        Args: { p_email: string; p_ip_address: unknown }
        Returns: {
          can_register: boolean
          existing_email: string
          reason: string
        }[]
      }
      check_trial_status: {
        Args: { p_user_id: string }
        Returns: {
          can_access_premium: boolean
          has_expired: boolean
          is_active: boolean
          time_remaining_seconds: number
        }[]
      }
      check_usage_limit: {
        Args: { p_feature: string; p_limit_type: string; p_user_id: string }
        Returns: {
          allowed: boolean
          current_count: number
          limit_value: number
          remaining: number
        }[]
      }
      cleanup_old_audit_logs: { Args: never; Returns: number }
      cleanup_old_webhook_events: { Args: never; Returns: number }
      create_default_milestones: {
        Args: { exam_date_val: string; plan_uuid: string }
        Returns: undefined
      }
      create_subscription: {
        Args: {
          p_billing_cycle: string
          p_payment_id: string
          p_tier: string
          p_user_id: string
        }
        Returns: string
      }
      expire_trials: {
        Args: never
        Returns: {
          expired_count: number
        }[]
      }
      generate_content_hash: { Args: { p_content: string }; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_search_embedding: {
        Args: { content_text: string }
        Returns: string
      }
      get_ca_article_full: { Args: { article_id: string }; Returns: Json }
      get_daily_usage: {
        Args: { p_feature: string; p_user_id: string }
        Returns: number
      }
      get_doubt_usage_for_user: {
        Args: { user_uuid: string }
        Returns: {
          image_doubts: number
          limit_remaining: number
          month: string
          text_doubts: number
          total_doubts: number
          voice_doubts: number
        }[]
      }
      get_interview_stats: {
        Args: { p_user_id: string }
        Returns: {
          avg_score: number
          best_score: number
          top_topics: string[]
          total_interviews: number
          total_time_seconds: number
        }[]
      }
      get_monthly_usage: {
        Args: { p_feature: string; p_user_id: string }
        Returns: number
      }
      get_pending_remote_commands: {
        Args: { p_user_id: string }
        Returns: {
          command_params: Json
          command_type: string
          created_at: string
          expires_at: string
          id: string
        }[]
      }
      get_plan_price_with_gst: {
        Args: { p_billing_cycle: string; p_tier: string }
        Returns: {
          base_price: number
          gst_amount: number
          total_price: number
        }[]
      }
      get_user_id: { Args: never; Returns: string }
      get_user_stats_safe: {
        Args: { p_user_id: string }
        Returns: {
          total_lectures: number
          total_notes: number
          total_quizzes: number
        }[]
      }
      get_user_subscription_tier: {
        Args: { p_user_id: string }
        Returns: string
      }
      has_active_subscription: { Args: { p_user_id: string }; Returns: boolean }
      increment_lecture_usage: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_note_downloads: {
        Args: { note_id: string }
        Returns: undefined
      }
      increment_note_views: { Args: { note_id: string }; Returns: undefined }
      increment_video_views: { Args: { video_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_new_values?: Json
          p_old_values?: Json
          p_resource_id: string
          p_resource_type: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_security_event:
        | {
            Args: {
              p_blocked?: boolean
              p_details?: Json
              p_event_type: string
              p_ip_address?: unknown
              p_severity: string
              p_user_id?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_details?: Json
              p_endpoint?: string
              p_event_type: string
              p_ip_address?: string
              p_status_code?: number
              p_user_agent?: string
              p_user_id?: string
            }
            Returns: string
          }
      mark_article_as_read: {
        Args: { p_article_id: string; p_time_spent_sec?: number }
        Returns: undefined
      }
      record_ip_registration: {
        Args: {
          p_device_fingerprint?: string
          p_email: string
          p_ip_address: unknown
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      record_usage: {
        Args: {
          p_feature: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_tokens?: number
          p_user_id: string
        }
        Returns: undefined
      }
      record_video_analytics: {
        Args: {
          p_avg_watch_time?: number
          p_completion_rate?: number
          p_downloads?: number
          p_likes?: number
          p_shares?: number
          p_traffic_source?: Json
          p_video_id: string
          p_views?: number
        }
        Returns: undefined
      }
      search_content: {
        Args: {
          filter_content_types?: string[]
          filter_sources?: string[]
          filter_syllabus_tags?: string[]
          limit_results?: number
          query_embedding: string
        }
        Returns: {
          book_reference: Json
          content_text: string
          content_type: string
          id: string
          similarity: number
          source: string
          source_url: string
          syllabus_tags: string[]
          title: string
        }[]
      }
      submit_mcq_attempt: {
        Args: {
          p_mcq_id: string
          p_selected_answer: number
          p_time_taken_sec?: number
        }
        Returns: Json
      }
      toggle_article_bookmark: {
        Args: { p_article_id: string }
        Returns: boolean
      }
      toggle_note_like: { Args: { note_id: string }; Returns: boolean }
      toggle_video_like: { Args: { video_id: string }; Returns: boolean }
      track_trial_feature_usage: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: undefined
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: undefined }
      validate_promo_code: {
        Args: {
          p_amount: number
          p_code: string
          p_plan_slug: string
          p_user_id: string
        }
        Returns: {
          discount_amount: number
          error_message: string
          is_valid: boolean
        }[]
      }
    }
    Enums: {
      answer_status: "draft" | "submitted" | "evaluated"
      difficulty_level: "easy" | "medium" | "hard"
      gs_subject: "GS1" | "GS2" | "GS3" | "GS4" | "Essay"
      mcq_bloom_level:
        | "Remember"
        | "Understand"
        | "Apply"
        | "Analyze"
        | "Evaluate"
        | "Create"
      mcq_difficulty: "Easy" | "Medium" | "Hard"
      mcq_section: "GS" | "CSAT"
      mcq_session_type: "Practice" | "Mock" | "PYQ" | "Adaptive"
      mcq_subject:
        | "GS1"
        | "GS2"
        | "GS3"
        | "GS4"
        | "CSAT"
        | "Optional"
        | "General"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      answer_status: ["draft", "submitted", "evaluated"],
      difficulty_level: ["easy", "medium", "hard"],
      gs_subject: ["GS1", "GS2", "GS3", "GS4", "Essay"],
      mcq_bloom_level: [
        "Remember",
        "Understand",
        "Apply",
        "Analyze",
        "Evaluate",
        "Create",
      ],
      mcq_difficulty: ["Easy", "Medium", "Hard"],
      mcq_section: ["GS", "CSAT"],
      mcq_session_type: ["Practice", "Mock", "PYQ", "Adaptive"],
      mcq_subject: ["GS1", "GS2", "GS3", "GS4", "CSAT", "Optional", "General"],
    },
  },
} as const
