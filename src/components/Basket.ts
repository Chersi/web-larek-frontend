import {Component} from './base/Components';
import {ensureElement, formatNumber, createElement} from '../utils/utils';
import {IProduct, ICardActions} from '../types/index'

export type IBasketPart = Pick<IProduct, 'id' | 'title' | 'price' | 'statusAddToBasket'>;

export interface IBasket extends IBasketPart{
    items: HTMLElement[];
    total: number;
    selected: number | null;
}

// Класс корзины
export class Basket extends Component<IBasket> {
    protected _list: HTMLElement;
    protected _total: HTMLElement;
    protected _button: HTMLButtonElement;

    constructor(container: HTMLElement, actions?: ICardActions) {
        super(container);

        this._list = ensureElement<HTMLElement>('.basket__list',this.container);
        this._total = ensureElement('.basket__price', this.container);
        this._button = ensureElement('.button',this.container) as HTMLButtonElement;

    
		this._button.addEventListener('click', (event: MouseEvent) => {
			actions.onClick?.(event);
		});

		this.items = [];
    }

    set items(items: HTMLElement[]) {
        if (items.length) {
            this._list.replaceChildren(...items);
            this.setDisabled(this._button, false);
        } else {
            this._list.replaceChildren(createElement<HTMLParagraphElement>('p', {
                textContent: 'Корзина пуста'
            }));
            this.setDisabled(this._button, true);
        }
    }

    set selected(items: string[]) {
        if (items.length) {
            this.setDisabled(this._button, false);
        } else {
            this.setDisabled(this._button, true);
        }
    }

    set total(total: number) {
        this.setText(this._total, formatNumber(total));
    }

    updateSelected() {
		Array.from(this._list.children).forEach(
			(item, index) =>
				(item.querySelector(`.basket__item-index`)!.textContent = (index + 1).toString()));
	}

    disableButton() {
		this.setDisabled(this._button, true);
	}
}

// Класс списка карточек в корзине
export class CardBasket extends Component<IBasket> {
    protected cardId: string;
    protected cardTitle: HTMLElement;
	protected cardPrice: HTMLElement;
	protected cardButton: HTMLButtonElement;
	protected basketItemIndex: HTMLElement;

	constructor(container: HTMLElement, actions?: ICardActions) {
		super(container);

		this.cardTitle = ensureElement('.card__title', this.container);
		this.cardPrice = ensureElement('.card__price', this.container);
		this.cardButton = ensureElement('.basket__item-delete',this.container) as HTMLButtonElement;
		this.basketItemIndex = this.container.querySelector('.basket__item-index');

		
		if (this.cardButton) {
			this.cardButton.addEventListener('click', (event: MouseEvent) => {
				this.container.remove();
				actions?.onClick(event);
			});
		}
	}

	set id(value: string) {
		this.container.dataset.id = value;
	}

	set title(value: string) {
		this.setText(this.cardTitle, value);
	}

	set price(value: number | null) {
    const formattedValue = value === null ? 'Бесплатно' : `${formatNumber(value)} синапсов`;
    this.setText(this.cardPrice, formattedValue);
    }

	set selected(value: number) {
		this.setText(this.basketItemIndex, (value++).toString());
	}
}