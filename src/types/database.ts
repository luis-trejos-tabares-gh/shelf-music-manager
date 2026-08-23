// Hand-written to match supabase/migrations/20250823120000_init.sql.
// After `npm run db:start`, regenerate with `npm run db:types`.

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
      artists: {
        Row: {
          id: string;
          mbid: string;
          name: string;
          bio: string | null;
          urls: Json;
          images: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mbid: string;
          name: string;
          bio?: string | null;
          urls?: Json;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mbid?: string;
          name?: string;
          bio?: string | null;
          urls?: Json;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      releases: {
        Row: {
          id: string;
          mbid: string;
          title: string;
          release_date: string | null;
          type: string | null;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mbid: string;
          title: string;
          release_date?: string | null;
          type?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mbid?: string;
          title?: string;
          release_date?: string | null;
          type?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      release_artists: {
        Row: {
          release_id: string;
          artist_id: string;
          credit_name: string | null;
          position: number;
        };
        Insert: {
          release_id: string;
          artist_id: string;
          credit_name?: string | null;
          position?: number;
        };
        Update: {
          release_id?: string;
          artist_id?: string;
          credit_name?: string | null;
          position?: number;
        };
        Relationships: [
          {
            foreignKeyName: "release_artists_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "release_artists_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      recordings: {
        Row: {
          id: string;
          mbid: string;
          release_id: string | null;
          title: string;
          position: number | null;
          isrc: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mbid: string;
          release_id?: string | null;
          title: string;
          position?: number | null;
          isrc?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mbid?: string;
          release_id?: string | null;
          title?: string;
          position?: number | null;
          isrc?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recordings_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      release_external_ids: {
        Row: {
          id: string;
          release_id: string;
          platform: string;
          external_id: string;
          url: string | null;
        };
        Insert: {
          id?: string;
          release_id: string;
          platform: string;
          external_id: string;
          url?: string | null;
        };
        Update: {
          id?: string;
          release_id?: string;
          platform?: string;
          external_id?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "release_external_ids_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      recording_external_ids: {
        Row: {
          id: string;
          recording_id: string;
          platform: string;
          external_id: string;
          url: string | null;
        };
        Insert: {
          id?: string;
          recording_id: string;
          platform: string;
          external_id: string;
          url?: string | null;
        };
        Update: {
          id?: string;
          recording_id?: string;
          platform?: string;
          external_id?: string;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recording_external_ids_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      availability: {
        Row: {
          release_id: string;
          odesli_payload: Json;
          fetched_at: string;
        };
        Insert: {
          release_id: string;
          odesli_payload?: Json;
          fetched_at?: string;
        };
        Update: {
          release_id?: string;
          odesli_payload?: Json;
          fetched_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: true;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
        ];
      };
      similar_artists: {
        Row: {
          artist_id: string;
          related_id: string;
          source: string;
          score: number | null;
        };
        Insert: {
          artist_id: string;
          related_id: string;
          source: string;
          score?: number | null;
        };
        Update: {
          artist_id?: string;
          related_id?: string;
          source?: string;
          score?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "similar_artists_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "similar_artists_related_id_fkey";
            columns: ["related_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          parent_id: string | null;
          kind: Database["public"]["Enums"]["collection_kind"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          parent_id?: string | null;
          kind: Database["public"]["Enums"]["collection_kind"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          parent_id?: string | null;
          kind?: Database["public"]["Enums"]["collection_kind"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collections_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
        ];
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          position: number;
          notes: string | null;
          release_id: string | null;
          artist_id: string | null;
          recording_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          position?: number;
          notes?: string | null;
          release_id?: string | null;
          artist_id?: string | null;
          recording_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          position?: number;
          notes?: string | null;
          release_id?: string | null;
          artist_id?: string | null;
          recording_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_items_release_id_fkey";
            columns: ["release_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_items_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "collection_items_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          spotify_playlist_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          spotify_playlist_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          spotify_playlist_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      playlist_tracks: {
        Row: {
          id: string;
          playlist_id: string;
          recording_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          recording_id: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          recording_id?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_tracks_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          user_id: string;
          artist_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          artist_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          artist_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      collection_kind: "album" | "artist" | "recording";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type CollectionKind = Database["public"]["Enums"]["collection_kind"];
