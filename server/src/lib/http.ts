import { HttpError } from "../middleware/error-handler";

export function asBigInt(id: string | string[]) {
  const raw = Array.isArray(id) ? id[0] : id;
  if (!raw) {
    throw new HttpError(400, "Invalid id: empty");
  }
  if (!/^\d+$/.test(raw)) {
    throw new HttpError(400, `Invalid id: ${raw}`);
  }
  return BigInt(raw);
}
