import './scss/styles.scss';
import {EventEmitter} from "./components/base/events"
import {ProductModel} from "./components/ProductModel";
import {CardAPI} from './components/CardAPI';
import {CDN_URL, API_URL} from './utils/constants'
import {Card} from './components/Card'
import {cloneTemplate, ensureElement} from './utils/utils';
import {Page} from './components/Page'
import {Modal} from './components/common/Modal'
import {IProduct, IOrderForm} from './types/index'
import {CardBasket, Basket} from './components/Basket'
import {Order} from './components/Order'
import {Success} from './components/Success'

/*// Чтобы мониторить все события, для отладки
events.onAll(({ eventName, data }) => {
    console.log(eventName, data);
})*/

// Все шаблоны
const successOrderTemplate = ensureElement<HTMLTemplateElement>('#success');
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPrevieTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const orderTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const events = new EventEmitter();
const api = new CardAPI(CDN_URL, API_URL);
const productModel = new ProductModel({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);
const order = new Order(cloneTemplate(orderTemplate), events);
const contacts = new Order(cloneTemplate(contactsTemplate), events);
const basket = new Basket(cloneTemplate(basketTemplate), {
	onClick: () => events.emit('order:creation', events)
});
const success = new Success(cloneTemplate(successOrderTemplate), {
	onClick: () => {
		modal.close();
	},
});

// Получили список карточке с сервера
api.getCardList() 
    .then(data => {
        productModel.setItems(data)
    })
    .catch (err => {
        console.log(err)
    })

// Вывели список в галарею
events.on('items:changed', () => {
    const itemsHTMLArray = productModel.getProducts().map(item => 
        new Card(cloneTemplate(cardCatalogTemplate), {
                onClick: () => events.emit('card:selected', item)
        })
    .render(item));
    page.render({
        catalog: itemsHTMLArray,
        counter: productModel.quantityItemsInBasket(),
        locked: false
    })
});

// Открыли модалку при клике на карточку
events.on('card:selected', (item: IProduct) => {
	const card = new Card(cloneTemplate(cardPrevieTemplate), {
		onClick: () => {
				events.emit('card:addToBasket', item)
	}
});

	modal.render({
			content: card.render(item),
            isActive: true
	});
});

// Добаили товар в корзинку
events.on('card:addToBasket', (item: Card) => {
	if (item.statusAddToBasket) {
        // Если товар уже в корзине - удаляем его
        productModel.deleteFromBasket(item.id);
    } else {
        // Иначе добавляем в корзину
        productModel.addCardToBasket(item);
    }
    page.counter = productModel.quantityItemsInBasket();
    modal.close();

});

// Открыли корзинку
events.on('basket:open', () => {
	const basketCatalog = productModel.basket.map((item, index) => {
		const basketItem = new CardBasket(cloneTemplate(cardBasketTemplate), {
			onClick: () => events.emit('card:deleteFromBasket', item),
		});

		return basketItem.render({
			title: item.title,
			price: item.price,
			selected: index + 1,
		});
	});

	modal.render({
		content: basket.render({
			items: basketCatalog,
			total: productModel.basketTotal(),
		}),
		isActive: true,
	});
});

// Удалили карточку из корзины
events.on('card:deleteFromBasket', (item: Card) => {
	productModel.deleteFromBasket(item.id);
	item.statusAddToBasket = false;
	basket.total = productModel.basketTotal();
	page.counter = productModel.quantityItemsInBasket(),
	basket.updateSelected();
	if (!productModel.basket.length) {
		basket.disableButton();
	}
});

// Открыли форму заказа
events.on('order:creation', () => {
	events.emit('input:changed');
	modal.render({
		content: order.render({
			address: '',
			payment: '',
			valid: false,
			errors: [],
		}),
		isActive: true,
	});
	events.emit('input:changed');
});

// Изменили поле фомы
events.on(
	/^order\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		productModel.setOrderField(data.field, data.value);
        productModel.getPayMethod();
	}
);

// Валидация
events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
	const {payment, address} = errors;

	order.valid = !payment && !address;

	order.errors = Object.values({payment, address})
		.filter((i) => !!i)
		.join('; ');
	const {email, phone} = errors;
	contacts.valid = !email && !phone;
	contacts.errors = Object.values({phone, email})
		.filter((i) => !!i)
		.join('; ');
});


// ОТкрыли заполнение контактов
events.on('order:submit', () => {
	productModel.order.total = productModel.basketTotal();
	productModel.movingCardsToOrder();

	modal.render({
		content: contacts.render({
			email: '',
			phone: '',
			valid: false,
			errors: [],
		}),
		isActive: true,
	});
});


// Изменили поле фомы контактов
events.on(
	/^contacts\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		productModel.setOrderField(data.field, data.value);
	}
);

// Заполнение формы с контактными данными
events.on('contacts:submit', () => {
	api
		.postProductOrder(productModel.order)
		.then((result) => {
			productModel.clearOrder();
			productModel.clearBasket();
			order.clearPayment();
			modal.render({
				content: success.render({
					description: result.total,
				}),
				isActive: true,
			});
		})
		.catch((err) => console.log(err));
});

// Блокировка прокрутки страницы
events.on('modal:open', () => {
    page.locked = true;
});

// Снятие блока
events.on('modal:close', () => {
    page.locked = false;
});