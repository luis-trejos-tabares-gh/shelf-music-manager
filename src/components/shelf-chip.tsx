import Link from "next/link";
import { removeFromLibrary } from "@/app/actions/catalog";
import { PendingButton } from "@/components/pending-button";

export function ShelfChip({
  collectionId,
  name,
  itemId,
  returnTo,
}: {
  collectionId: string;
  name: string;
  itemId: string;
  returnTo: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-2 py-0.5 dark:border-zinc-700">
      <Link href={`/shelves/${collectionId}`} className="underline">
        {name}
      </Link>
      <form action={removeFromLibrary}>
        <input type="hidden" name="item_id" value={itemId} />
        <input type="hidden" name="return_to" value={returnTo} />
        <PendingButton
          pendingLabel="Removing…"
          className="text-zinc-500 underline disabled:opacity-60"
        >
          Remove
        </PendingButton>
      </form>
    </span>
  );
}
