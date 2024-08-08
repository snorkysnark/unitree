import { GetTreeApiTreeGetData } from "@/client";

export abstract class Cursor {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  abstract createParams(limit?: number): GetTreeApiTreeGetData;
}

export class BeforeCursor extends Cursor {
  createParams(limit?: number | undefined): GetTreeApiTreeGetData {
    return { limit, beforeCursor: this.value };
  }
}

export class AfterCursor extends Cursor {
  createParams(limit?: number | undefined): GetTreeApiTreeGetData {
    return { limit, afterCursor: this.value };
  }
}
