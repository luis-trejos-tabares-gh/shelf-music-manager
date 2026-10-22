-- Local/hosted API roles need explicit DML grants. RLS still filters rows.

grant select on table
  public.artists,
  public.releases,
  public.release_artists,
  public.recordings,
  public.release_tracks,
  public.release_external_ids,
  public.recording_external_ids,
  public.availability,
  public.similar_artists
  to authenticated;

grant select, insert, update, delete on table
  public.collections,
  public.collection_items,
  public.playlists,
  public.playlist_tracks,
  public.follows
  to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
