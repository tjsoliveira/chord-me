import { useEffect } from "react";

/**
 * Sets the browser tab title. Pass null while data is still loading so the tab
 * keeps the previous title instead of flashing a placeholder.
 *
 * The hyphen is reserved for the song/version pair ("Ousado Amor - Tom D");
 * other screens use a middot so the tab never implies a version that isn't there.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
