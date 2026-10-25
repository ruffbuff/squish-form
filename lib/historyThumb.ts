import { renderAvatarStill } from "./avatarStill";
import { flatSvg } from "./flatSvg";
import type { FlatParams } from "./flatTypes";
import type { AvatarParams } from "./types";

export function thumbFor3d(params: AvatarParams) {
  return renderAvatarStill(params);
}

export function thumbForFlat(params: FlatParams) {
  return flatSvg(params, "medal", `hist-${params.silhouette}`);
}
