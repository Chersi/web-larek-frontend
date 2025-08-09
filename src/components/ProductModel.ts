import {Model} from "./base/Model";
import {IProduct, IOrder,IOrderForm, FormErrors} from "../types/index"

export class ProductModel extends Model<IProduct> {
    protected items: IProduct[]; // Массив всех товаров
    basket: IProduct[] = []; // Корзина (изначально пустая)
    order: IOrder = { // Объект заказа с начальными значениями
		payment: '', 
		address: '',
		email: '',
		phone: '',
	};
    protected formErrors: FormErrors = {}; // Ошибки формы
	private selectedCard: IProduct | null = null;

    // Методы класса:
    //Получить список карточек
    getProducts(): IProduct[]  {
        return this.items;
    }

    //Получить одну карточку по id
    getProduct(id: string): IProduct {
        return this.items.find(item => item.id === id)
    }

    // Установка карчтоек в массив
	setItems(items: IProduct[]) {
        this.items = items;
        this.emitChanges('items:changed', {items: this.items})
    }

	// Метод для сохранения выбранной карточки
    selectCard(card: IProduct) {
        this.selectedCard = card;
        this.triggerRedraw();
    }

    // Метод для вызова события отрисовки
    private triggerRedraw() {
        this.events.emit('card:selected', this.selectedCard);
    }

    // Получение выбранной карточки
    getSelectedCard(): IProduct | null {
        return this.selectedCard;
    }

	// Добавление товара в корзину
	addCardToBasket(item: IProduct) {
		this.basket.push(item); // Добавляем в корзину
		this.selectedItem(item.id); // Отмечаем как выбранный
	}

	// Переключение поля statusAddToBasket
	selectedItem(id: string) {
		const item = this.getProduct(id); // Получаем товар
		item.statusAddToBasket = !item.statusAddToBasket; // Переключаем флаг statusAddToBasket
	}

    // Количество товара в корзине
    quantityItemsInBasket(): number {
        return this.basket.length;
    }
    
    // Удаление товара из корзины
	deleteFromBasket(id: string) {
		this.basket = this.basket.filter((item) => item.id !== id); // Фильтруем массив
		this.events.emit('items:changed'); // Уведомляем об изменении
		const item = this.getProduct(id);
    	if (item) {
        	item.statusAddToBasket = false;
    	}
	}

    // Сумма корзины
    basketTotal(): number {
        return this.basket.reduce((sum, next) => sum + next.price, 0); // Суммируем цены
    }

	// Заполнение полей формы заказа
	setOrderField(field: keyof IOrderForm, value: string) {
		this.order[field] = value;
		this.validateOrder();
	}

    // Получение способа оплаты
	getPayMethod(): string {
        return this.order.payment;
    }

    // Метод для формирования финального заказа
    createFinalOrder(): IOrder {
        return {
            ...this.order,
            items: this.basket.map(item => item.id),
            total: this.basketTotal()
        };
    }

    // Очистка данных заказа
	clearOrder() {
		this.clearBasket();
        this.order ={
            payment: '',
            address: '',
            email: '',
            phone: '',
	    }
    }

    // Сброс выбранных товаров в каталоге
	resetSelectedAll() {
		this.items.forEach((item) => (item.statusAddToBasket = false)); // Сбрасываем флаг statusAddToBasket у всех товаров
	}

    // Очистка корзины
	clearBasket() {
        this.basket.forEach((item) => {
			item.statusAddToBasket = false;
		});
		this.resetSelectedAll(); // Сбрасываем выбор
		this.basket.length = 0; // Очищаем корзину
		this.emitChanges('items:changed');
	}

	// Валидация
    validateOrder() {
		const errors: typeof this.formErrors = {}; // Создаем объект для хранения ошибок
        // Проверяем обязательные поля:
		if (!this.order.address) { 
			errors.address = 'Необходимо указать адрес';
		}
		if (!this.order.payment) {
			errors.payment = 'Необходимо указать способ оплаты';
		}

		if (!this.order.email) {
			errors.email = 'Необходимо указать email';
		}
		if (!this.order.phone) {
			errors.phone = 'Необходимо указать телефон';
		}

		this.formErrors = errors; // Сохраняем ошибки и уведомляем систему
		this.events.emit('formErrors:change', this.formErrors);
		return Object.keys(errors).length === 0; // Возвращаем true, если ошибок нет
	}
}