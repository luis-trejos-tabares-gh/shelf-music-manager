import "server-only";
import { request as httpsRequest } from "node:https";

export function httpsGet(url: URL, headers: Record<string, string>) {
  return new Promise<{ status: number; body: string; location?: string }>(
    (resolve, reject) => {
      const req = httpsRequest(url, { method: "GET", headers }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
            location: res.headers.location,
          });
        });
      });

      req.on("error", reject);
      req.end();
    },
  );
}

export function httpsHead(url: URL, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; location?: string }>((resolve, reject) => {
    const req = httpsRequest(url, { method: "HEAD", headers }, (res) => {
      res.resume();
      resolve({
        status: res.statusCode ?? 0,
        location: res.headers.location,
      });
    });

    req.on("error", reject);
    req.end();
  });
}
