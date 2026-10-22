import { addToLibrary } from "@/app/actions/catalog";
import { PendingButton } from "@/components/pending-button";

export function AddAlbumForm({
  mbid,
  returnTo,
  collections,
}: {
  mbid: string;
  returnTo: string;
  collections: Array<{ id: string; name: string }>;
}) {
  if (!collections.length) {
    return (
      <p className="mt-2 text-xs text-zinc-500">
        Create an album shelf to add this.
      </p>
    );
  }

  return (
    <form action={addToLibrary} className="mt-2 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="entity_type" value="album" />
      <input type="hidden" name="mbid" value={mbid} />
      <input type="hidden" name="return_to" value={returnTo} />
      <select
        name="destination"
        required
        className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
        defaultValue=""
      >
        <option value="" disabled>
          Add to…
        </option>
        {collections.map((collection) => (
          <option key={collection.id} value={`collection:${collection.id}`}>
            {collection.name}
          </option>
        ))}
      </select>
      <PendingButton
        pendingLabel="Adding…"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-60 dark:border-zinc-700"
      >
        Add
      </PendingButton>
    </form>
  );
}
