export function withNotice(
  path: string,
  key: "added" | "error",
  message: string,
) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("error");
  params.delete("added");
  params.set(key, message);
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}
