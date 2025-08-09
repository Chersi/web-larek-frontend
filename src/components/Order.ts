import {Form} from "./common/Form";
import {IEvents} from "./base/events";
import {ensureElement, formatNumber} from '../utils/utils'
import {IOrderForm, ICardActions, FormErrors} from "../types/index";

export class Order extends Form<IOrderForm> {
    protected buttonCard: HTMLButtonElement;
	protected buttonCash: HTMLButtonElement;
	protected formErrors: FormErrors = {};
	protected totalPrice: number = 0;
	protected totalElement: HTMLElement | null;

    constructor(container: HTMLFormElement, events: IEvents, actions?: ICardActions) {
        super(container, events);

        this.buttonCard = container.elements.namedItem('card') as HTMLButtonElement;
		this.buttonCash = container.elements.namedItem('cash') as HTMLButtonElement;
		this.totalElement = this.container.querySelector('.order__total');

        if (this.buttonCard) {
			this.buttonCard.addEventListener('click', (event: MouseEvent) => {
				this.selectPaymentMethod = 'card';
				actions?.onClick(event);
			});
		}

		if (this.buttonCash) {
			this.buttonCash.addEventListener('click', (event: MouseEvent) => {
				this.selectPaymentMethod = 'cash';
			});
		}
    }

	set total(value: number) {
        this.totalPrice = value;
        // Здесь можно добавить логику отображения суммы в интерфейсе
        if (this.totalElement) {
            this.totalElement.textContent = `Итого: ${formatNumber(value)}`;
        }
    }

    set address(value: string) {
        (this.container.elements.namedItem('address') as HTMLInputElement).value = value;
    }

    set email(value: string) {
        (this.container.elements.namedItem('email') as HTMLInputElement).value = value;
    }

    set phone(value: string) {
        (this.container.elements.namedItem('phone') as HTMLInputElement).value = value;
    }

    // Выбрать способ оплаты
	set selectPaymentMethod(payment: string) {
		this.onInputChange('payment', payment);
		this.toggleClass(this.buttonCard, 'button_alt-active', payment === 'card');
		this.toggleClass(this.buttonCash, 'button_alt-active', payment === 'cash');
	}

	// Удаленеи выбора после покупки
	clearPayment() {
		this.onInputChange('payment', '');
		this.buttonCard.classList.remove('button_alt-active');
		this.buttonCash.classList.remove('button_alt-active');
	}
}