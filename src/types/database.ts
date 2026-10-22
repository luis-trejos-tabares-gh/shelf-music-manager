export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      artist_setlists: {
        Row: {
          artist_id: string
          fetched_at: string
          payload: Json
        }
        Insert: {
          artist_id: string
          fetched_at?: string
          payload?: Json
        }
        Update: {
          artist_id?: string
          fetched_at?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "artist_setlists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          bio: string | null
          created_at: string
          discography_fetched_at: string | null
          id: string
          images: Json
          mbid: string
          name: string
          updated_at: string
          urls: Json
        }
        Insert: {
          bio?: string | null
          created_at?: string
          discography_fetched_at?: string | null
          id?: string
          images?: Json
          mbid: string
          name: string
          updated_at?: string
          urls?: Json
        }
        Update: {
          bio?: string | null
          created_at?: string
          discography_fetched_at?: string | null
          id?: string
          images?: Json
          mbid?: string
          name?: string
          updated_at?: string
          urls?: Json
        }
        Relationships: []
      }
      availability: {
        Row: {
          fetched_at: string
          payload: Json
          release_id: string
          source: string
        }
        Insert: {
          fetched_at?: string
          payload?: Json
          release_id: string
          source?: string
        }
        Update: {
          fetched_at?: string
          payload?: Json
          release_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: true
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          artist_id: string | null
          collection_id: string
          created_at: string
          id: string
          notes: string | null
          position: number
          recording_id: string | null
          release_id: string | null
        }
        Insert: {
          artist_id?: string | null
          collection_id: string
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          recording_id?: string | null
          release_id?: string | null
        }
        Update: {
          artist_id?: string | null
          collection_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          recording_id?: string | null
          release_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["collection_kind"]
          name: string
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["collection_kind"]
          name: string
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["collection_kind"]
          name?: string
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          artist_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_releases: {
        Row: {
          created_at: string
          release_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          release_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          release_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_releases_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_tracks: {
        Row: {
          created_at: string
          id: string
          playlist_id: string
          position: number
          recording_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          playlist_id: string
          position: number
          recording_id: string
        }
        Update: {
          created_at?: string
          id?: string
          playlist_id?: string
          position?: number
          recording_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          spotify_playlist_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          spotify_playlist_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          spotify_playlist_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recording_external_ids: {
        Row: {
          external_id: string
          id: string
          platform: string
          recording_id: string
          url: string | null
        }
        Insert: {
          external_id: string
          id?: string
          platform: string
          recording_id: string
          url?: string | null
        }
        Update: {
          external_id?: string
          id?: string
          platform?: string
          recording_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recording_external_ids_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      recordings: {
        Row: {
          created_at: string
          id: string
          isrc: string | null
          length_ms: number | null
          mbid: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          isrc?: string | null
          length_ms?: number | null
          mbid: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          isrc?: string | null
          length_ms?: number | null
          mbid?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      release_artists: {
        Row: {
          artist_id: string
          credit_name: string | null
          position: number
          release_id: string
        }
        Insert: {
          artist_id: string
          credit_name?: string | null
          position?: number
          release_id: string
        }
        Update: {
          artist_id?: string
          credit_name?: string | null
          position?: number
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_artists_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      release_external_ids: {
        Row: {
          external_id: string
          id: string
          platform: string
          release_id: string
          url: string | null
        }
        Insert: {
          external_id: string
          id?: string
          platform: string
          release_id: string
          url?: string | null
        }
        Update: {
          external_id?: string
          id?: string
          platform?: string
          release_id?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_external_ids_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      release_tracks: {
        Row: {
          credit_name: string | null
          position: number | null
          recording_id: string
          release_id: string
        }
        Insert: {
          credit_name?: string | null
          position?: number | null
          recording_id: string
          release_id: string
        }
        Update: {
          credit_name?: string | null
          position?: number | null
          recording_id?: string
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_tracks_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          canonical_release_mbid: string | null
          cover_url: string | null
          created_at: string
          duration_ms: number | null
          enriched_at: string | null
          id: string
          label_name: string | null
          mbid: string
          release_date: string | null
          secondary_types: string[]
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          canonical_release_mbid?: string | null
          cover_url?: string | null
          created_at?: string
          duration_ms?: number | null
          enriched_at?: string | null
          id?: string
          label_name?: string | null
          mbid: string
          release_date?: string | null
          secondary_types?: string[]
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          canonical_release_mbid?: string | null
          cover_url?: string | null
          created_at?: string
          duration_ms?: number | null
          enriched_at?: string | null
          id?: string
          label_name?: string | null
          mbid?: string
          release_date?: string | null
          secondary_types?: string[]
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      similar_artists: {
        Row: {
          artist_id: string
          related_id: string
          score: number | null
          source: string
        }
        Insert: {
          artist_id: string
          related_id: string
          score?: number | null
          source: string
        }
        Update: {
          artist_id?: string
          related_id?: string
          score?: number | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "similar_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "similar_artists_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      collection_kind: "album" | "artist" | "recording"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      collection_kind: ["album", "artist", "recording"],
    },
  },
} as const

