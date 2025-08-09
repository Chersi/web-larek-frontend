import {Component} from './/base/Components';
import {ensureElement} from '../utils/utils';
import {CARD_CATEGORY} from './../utils/constants';
import {IProduct, ICardActions, IProductCategory} from '../types/index';

export class Card extends Component<IProduct> {
    protected cardId: string;
    protected cardDescription: HTMLElement;
    protected cardImage: HTMLImageElement;
    protected cardTitle: HTMLElement;
    protected cardCategory: HTMLElement;
    protected cardPrice: HTMLElement;
    protected cardButton: HTMLButtonElement;
    _statusAddToBasket: boolean = false;

    constructor(container: HTMLElement, actions?: ICardActions) {
        super(container);

        this.cardDescription = this.container.querySelector('.card__text');
        this.cardImage = ensureElement('.card__image', this.container) as HTMLImageElement; 
        this.cardTitle = ensureElement('.card__title', this.container);
        this.cardCategory = ensureElement('.card__category', this.container);
        this.cardPrice = ensureElement('.card__price', this.container);
        this.cardButton = this.container.querySelector('.card__button');

        if (actions?.onClick) {
            if (this.cardButton) {
                this.cardButton.addEventListener('click', actions.onClick);
            } else {
                this.container.addEventListener('click', actions.onClick);
            }
        }

        Object.defineProperty(this, 'statusAddToBasket', {
            get() {
                return this._statusAddToBasket;
            },
            set(value: boolean) {
                this._statusAddToBasket = value;
                this.updateButtonText();
            }
        });
    }
    
    private updateButtonText() {
        this.setText(this.cardButton, this.statusAddToBasket ? 'Убрать' : 'В Корзину');
    }

    set id(value: string) {
		this.container.dataset.id = value;
	}

	get id(): string {
		return this.container.dataset.id || '';
	}

    set description(value: string) {
		this.setText(this.cardDescription, value);
	}

    set image(value: string) {
		this.setImage(this.cardImage, value, this.title);
	}

    set title(value: string) {
		this.setText(this.cardTitle, value);
	}

    get title(): string {
		return this.cardTitle.textContent || '';
	}

    set category(value: IProductCategory) {
		this.setText(this.cardCategory, value);
		this.cardCategory.className = '';

		const bazeClass = 'card__category';
		const otherClass = CARD_CATEGORY[value];

		this.cardCategory.classList.add(bazeClass, `${bazeClass}_${otherClass}`);
	}

    set price(value: number | null) {
        if (value === null || 0) {
            this.setText(this.cardPrice, 'Бесплатно');
            this.setDisabled(this.cardButton, true);
        } else if (typeof value === 'number' && value > 0) {
            const formatted = value
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            this.setText(this.cardPrice, `${formatted} синапсов`);
            this.setDisabled(this.cardButton, false);
        }
    }

	get statusAddToBasket(): boolean {
        return this._statusAddToBasket;
    }

    set statusAddToBasket(value: boolean) {
        this._statusAddToBasket = value;
    }

    set active(value: boolean) {
		this.toggleClass(this.container, 'modal_active', value);
	}

    render(data: Partial<IProduct>): HTMLElement {
		Object.assign(this as object, data);
        return this.container;
	}
}