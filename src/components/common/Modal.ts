import {Component} from "../base/Components";
import {ensureElement} from "../../utils/utils";
import {IEvents} from "../base/events";

export interface IModal {
    content: HTMLElement;
    message?: string;
	  isActive: boolean;
	  isError?: boolean;
}

export class Modal extends Component<IModal> {
    protected _close: HTMLButtonElement;
    protected _content: HTMLElement;
    protected _pageWrapper: HTMLElement;
  
    constructor(container: HTMLElement, protected events: IEvents) {
        super(container)

        this._close = ensureElement<HTMLButtonElement>('.modal__close', container);
        this._content = ensureElement<HTMLElement>('.modal__content', container);

        this._close.addEventListener('click', this.close.bind(this));
        this.container.addEventListener('click', this.close.bind(this));
        this._content.addEventListener('click', (event) => event.stopPropagation());
  }

  // принимает элемент разметки которая будет отображаться в "modal__content" модального окна
  set content(value: HTMLElement) {
    this._content.replaceChildren(value);
  }

  open() {
    this.container.classList.add('modal_active');
    this.events.emit('modal:open');
  }

  close() {
    this.container.classList.remove('modal_active');
    this.content = null; // очистка контента в модальном окне
    this.events.emit('modal:close');
  }

  set locked(value: boolean) {
    if (value) {
      this._pageWrapper.classList.add('page__wrapper_locked');
    } else {
      this._pageWrapper.classList.remove('page__wrapper_locked');
    }
  }

  render(data: IModal): HTMLElement {
    super.render(data);
		this.open();
		return this.container;
  }
}