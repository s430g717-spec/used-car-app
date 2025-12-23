import React, { useEffect, useRef, useState } from "react";
import { getImageObjectUrl } from "../lib/idb";

// Accepts either normal http(s)/data URLs or idb:ID references
// Example: src="idb:123" will resolve via IndexedDB
export default function ResolvedImg(
  props: React.ImgHTMLAttributes<HTMLImageElement>
) {
  const { src, ...rest } = props;
  const [resolved, setResolved] = useState<string | undefined>(
    typeof src === "string" ? src : undefined
  );
  const prevBlobRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      if (typeof src !== "string" || !src) {
        if (active) setResolved(undefined);
        return;
      }
      if (!src.startsWith("idb:")) {
        if (active) setResolved(src);
        return;
      }
      const id = src.slice(4);
      const url = await getImageObjectUrl(id);
      if (active) setResolved(url ?? undefined);
    }
    run();
    return () => {
      active = false;
    };
  }, [src]);

  // Revoke blob URLs to avoid memory leaks when changed/unmounted
  useEffect(() => {
    if (resolved && resolved.startsWith("blob:")) {
      // revoke previous blob url
      if (prevBlobRef.current && prevBlobRef.current !== resolved) {
        try {
          URL.revokeObjectURL(prevBlobRef.current);
        } catch {}
      }
      prevBlobRef.current = resolved;
    }
    return () => {
      if (prevBlobRef.current) {
        try {
          URL.revokeObjectURL(prevBlobRef.current);
        } catch {}
        prevBlobRef.current = null;
      }
    };
  }, [resolved]);

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={resolved} {...rest} />;
}
