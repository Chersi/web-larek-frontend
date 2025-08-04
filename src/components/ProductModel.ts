import {Model} from "./base/Model";
import {IProduct, IOrder,IOrderForm, FormErrors} from "../types/index"

export class ProductModel extends Model<IProduct> {
    protected items: IProduct[]; // Массив всех товаров
    basket: IProduct[] = []; // Корзина (изначально пустая)
    order: IOrder = { // Объект заказа с начальными значениями
		address: '',
		email: '',
		phone: '',
	};
    protected formErrors: FormErrors = {}; // Ошибки формы

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

	// Добавление товара в корзину
	addCardToBasket(item: IProduct) {
		this.basket.push(item); // Добавляем в корзину
		this.selectedItem(item.id); // Отмечаем как выбранный
	}

	// Переключение поля statusAddToBasket
	selectedItem(id: string) {
		const item = this.getProduct(id); // Получаем товар
		item.statusAddToBasket = !item.statusAddToBasket; // Переключаем флаг statusAddToBasket
		this.events.emit('items:changed'); // Уведомляем об изменении
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

		if (this.validateOrder()) {
			this.events.emit('input:changed', this.order);
		}
	}

    // Получение способа оплаты
	getPayMethod(): string {
        return this.order.payment;
    }

     // Перемещение карточек в заказ
    movingCardsToOrder() {
        this.order.items = this.basket.map((item) => item.id); // Копируем ID товаров из корзины
	}

    // Очистка данных заказа
	clearOrder() {
        this.order ={
            items: [],
            total: null,
            payment: '',
            address: '',
            email: '',
            phone: '',
	    }
    }

    // Управление включением товара в заказ
	availabilityInOrder(id: string, isIncluded: boolean) {
		if (isIncluded) {
        if (!this.order.items.includes(id)) {// Добавляем уникальный ID
            this.order.items.push(id);
        }
    	} else {
        	this.order.items = this.order.items.filter(itemId => itemId !== id);// Удаляем ID
    	}
	}

    // Сброс выбранных товаров в каталоге
	resetSelectedAll() {
		this.items.forEach((item) => (item.statusAddToBasket = false)); // Сбрасываем флаг statusAddToBasket у всех товаров
		this.events.emit('items:changed'); // Уведомляем об изменении состояния
	}

    // Очистка корзины
	clearBasket() {
        this.order.items.forEach((id) => {
			this.availabilityInOrder(id, false); // Убираем из заказа
		});
		this.resetSelectedAll(); // Сбрасываем выбор
		this.basket.length = 0; // Очищаем корзину
		this.events.emit('items:changed'); // Уведомляем об изменении
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

	// Управления статусом statusAddToBasket
	setStatusAddToBasket(id: string, status: boolean) {
        const item = this.getProduct(id);
        if (item) {
            item.statusAddToBasket = status;
            this.emitChanges('items:changed');
        }
    }
}