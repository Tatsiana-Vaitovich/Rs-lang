import { Component } from '../../core/templates/components';

export type Attr = {
  [prop: string]: string;
};

export class Input extends Component {
  constructor(attr: Attr) {
    super('input');
    if (attr && typeof attr === 'object') {
      Object.keys(attr).forEach((key: string) => {
        this.container.setAttribute(key, attr[key]);
      });
    }
  }

  public onInput(cb: (event: Event) => void): void {
    this.container.addEventListener('input', cb);
  }

  public getValue(): string {
    const value = this.container.getAttribute('value') as string;
    return value;
  }

  public setValue(value: string): void {
    this.container.setAttribute('value', value);
  }

  public render() {
    return this.container;
  }
}
