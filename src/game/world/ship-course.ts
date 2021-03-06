/*
 * The savegame data structure was reverse-engineered by Benedikt Freisen
 * as part of the 'mdcii-engine' project and released under GPLv2+.
 * https://github.com/roybaer/mdcii-engine
 */

import Stream from "../../parsers/stream";
import assert from "../../util/assert";

export enum CourseState {
  Stopped = 0x00,
  Sailing = 55,
  Unknown = 53,
  Unknown2 = 52,
  Unknown3 = 54,
  Unknown4 = 51
}

export class ShipCourse {
  public static fromSaveGame(data: Stream) {
    const num = data.read32();
    const byte1 = (num >> 0) & 0xff;
    const byte2 = (num >> 8) & 0xff;
    const byte3 = (num >> 16) & 0xff;
    const byte4 = (num >> 24) & 0xff;

    const state: CourseState = byte1;
    assert(state in CourseState);

    const position = new PIXI.Point(
      byte4 + ((byte2 & 0b00001111) << 8),
      byte3 + ((byte2 & 0b11110000) << 4)
    );

    return new ShipCourse(position, state);
  }

  constructor(
    public readonly position: PIXI.Point,
    public readonly state: CourseState
  ) {}
}
