import { describe, expect, it } from "vitest";
import {
  filterSongs,
  fold,
  hasExactTitle,
  initialOf,
  latestVersion,
  recentVersions,
  shortDate,
  sortSongs,
  versionDetails,
} from "../src/shared/library.js";
import type { SongSummary, VersionRef } from "../src/shared/types.js";

let nextId = 1;

function version(label: string, updatedAt: string, extra: Partial<VersionRef> = {}): VersionRef {
  return { id: nextId++, label, songKey: null, capo: null, updatedAt, ...extra };
}

function song(title: string, artist = "", versions: VersionRef[] = []): SongSummary {
  return { id: nextId++, title, artist, versionCount: versions.length, versions };
}

const titles = (songs: SongSummary[]) => songs.map((s) => s.title);

describe("fold", () => {
  it("ignores case, accents and repeated spaces", () => {
    expect(fold("  Isaías   9 ")).toBe("isaias 9");
    expect(fold("Sobre as ÁGUAS")).toBe("sobre as aguas");
  });
});

describe("sortSongs", () => {
  it("orders accented and lower-case titles where a reader expects them", () => {
    const sorted = sortSongs([
      song("Ousado Amor"),
      song("Eu vejo a Glória"),
      song("Águas Purificadoras"),
      song("Eu Navegarei"),
      song("Atos 2"),
    ]);
    expect(titles(sorted)).toEqual([
      "Águas Purificadoras",
      "Atos 2",
      "Eu Navegarei",
      "Eu vejo a Glória",
      "Ousado Amor",
    ]);
  });
});

describe("filterSongs", () => {
  const library = [
    song("Atos 2", "Gabriela Rocha"),
    song("Eu Navegarei", "Gabriela Rocha"),
    song("Isaías 9", "Rodolfo Abrantes"),
    song("Você Me Leva Ao Deserto", "Ministério Zoe"),
    song("Deserto", "Outro"),
  ];

  it("matches titles without accents", () => {
    expect(titles(filterSongs(library, "isaias"))).toEqual(["Isaías 9"]);
  });

  it("matches artists", () => {
    expect(titles(filterSongs(library, "gabriela"))).toEqual(["Atos 2", "Eu Navegarei"]);
  });

  it("puts titles that start with the query first", () => {
    expect(titles(filterSongs(library, "deserto"))).toEqual(["Deserto", "Você Me Leva Ao Deserto"]);
  });

  it("returns everything for a blank query", () => {
    expect(filterSongs(library, "   ")).toBe(library);
  });
});

describe("hasExactTitle", () => {
  const library = [song("Isaías 9")];

  it("treats case, accents and spacing as the same title", () => {
    expect(hasExactTitle(library, "isaias  9")).toBe(true);
  });

  it("is false for a partial title and for a blank query", () => {
    expect(hasExactTitle(library, "isaias")).toBe(false);
    expect(hasExactTitle(library, "  ")).toBe(false);
  });
});

describe("initialOf", () => {
  it("files accented initials under their plain letter, and the rest under #", () => {
    expect(initialOf("Águas")).toBe("A");
    expect(initialOf("ousado amor")).toBe("O");
    expect(initialOf("1983")).toBe("#");
    expect(initialOf("")).toBe("#");
  });
});

describe("latestVersion and recentVersions", () => {
  const a1 = version("Principal", "2026-08-25T20:30:00.000Z");
  const a2 = version("Acústico", "2026-10-30T17:48:00.000Z");
  const b1 = version("Tom Em", "2026-10-08T19:41:00.000Z");
  const c1 = version("Recital IEB", "2026-10-27T19:49:00.000Z");
  const library = [song("A", "", [a1, a2]), song("B", "", [b1]), song("C", "", [c1]), song("D")];

  it("picks the most recently saved version of a song", () => {
    expect(latestVersion(library[0])).toBe(a2);
    expect(latestVersion(library[3])).toBeNull();
  });

  it("lists versions across songs, newest first, up to the limit", () => {
    const recent = recentVersions(library, 3);
    expect(recent.map((r) => r.version)).toEqual([a2, c1, b1]);
    expect(recent[0].song.title).toBe("A");
  });
});

describe("versionDetails", () => {
  it("drops the key when the label already names it", () => {
    expect(versionDetails({ label: "Tom A", songKey: "A", capo: null })).toEqual([]);
    expect(versionDetails({ label: "tom em", songKey: "Em", capo: 2 })).toEqual(["capo 2ª"]);
  });

  it("keeps the key when the label names a different one, or none", () => {
    expect(versionDetails({ label: "Tom A", songKey: "Am", capo: null })).toEqual(["Tom Am"]);
    expect(versionDetails({ label: "Principal", songKey: "D", capo: 4 })).toEqual(["Tom D", "capo 4ª"]);
  });
});

describe("shortDate", () => {
  const now = new Date(2026, 10, 8, 15, 0);

  it("says hoje for today", () => {
    expect(shortDate(new Date(2026, 10, 8, 9, 30).toISOString(), now)).toBe("hoje");
  });

  it("gives day and month within the year, and adds the year otherwise", () => {
    expect(shortDate(new Date(2026, 9, 30, 12).toISOString(), now)).toBe("30 out");
    expect(shortDate(new Date(2025, 10, 8, 12).toISOString(), now)).toBe("8 nov 2025");
  });
});
