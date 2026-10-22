import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { ShelfMark } from "@/components/shelf-mark";
import { createClient } from "@/lib/supabase/server";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <ShelfMark className="h-6 w-6" />
          Shelf
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user ? (
            <>
              <Link href="/search">Search</Link>
              <Link href="/shelves">Shelves</Link>
              <Link href="/playlists">Playlists</Link>
              <Link href="/following">Following</Link>
              <form action={signOut}>
                <button type="submit" className="underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/signup">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
