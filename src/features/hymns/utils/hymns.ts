import { z } from "zod";
import { hymnSchema, type Hymn } from "@/lib/types";
import rawHymns from "./hymns.json";

// The repo ships a starter subset of the 1985 LDS hymnal. Expand the JSON file
// to cover whatever the ward actually sings; the picker handles any length.
export const HYMNS: readonly Hymn[] = z.array(hymnSchema).parse(rawHymns);
