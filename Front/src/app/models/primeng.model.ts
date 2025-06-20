/* ----------------------------------------------------------
  NOT PRIME NG SPECIFIC MODELS, JUST CONVENIENCE MODELS FOR PRIME NG COMPONENTS
  ----------------------------------------------------------
*/

// Used when translations are NOT needed
export class SelectSimple {
  constructor(public readonly key: number, public readonly label: string) {}
}

// Used when translations are needed
export class SelectItem2 {
  constructor(
    public readonly key: string,
    public label = '',
    public updateTranslation = (trans: string) => {
      this.label = trans;
    }
  ) {}
}

class SelectGroupBase {
  constructor(
    public readonly label = '',
    public readonly icon = '',
    public color = 'var(--color-accent)'
  ) {}
}

// Used when translations are needed
export class SelectGroupItem2 extends SelectGroupBase {
  items: SelectItem2[] = [];

  constructor(label: string, icon: string, color?: string) {
    super(label, icon, color);
  }
}

// Used when translations are NOT needed
export class SelectGroupSimple extends SelectGroupBase {
  items: SelectSimple[] = [];

  constructor(label: string, icon: string, color?: string) {
    super(label, icon, color);
  }
}

export interface FilterItem {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  disabled?: any;
}
