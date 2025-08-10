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
                onClick: () => productModel.selectCard(item) 
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
			console.log(card.statusAddToBasket)
			if (card.statusAddToBasket) {
                events.emit('card:deleteFromBasket', item);
				modal.close();
            } else {
                events.emit('card:addToBasket', item);
            }
        }
    });

	modal.render({
			content: card.render(item),
            isActive: true
	});
});

// Добаили товар в корзинку
events.on('card:addToBasket', (item: Card) => {
	productModel.addCardToBasket(item);
    page.counter = productModel.quantityItemsInBasket();
    modal.close();
	events.emit('basket:change');
});

// Открыли корзинку
events.on('basket:open', () => {
	modal.render({
		content: basket.render({
			total: productModel.basketTotal(),
		}),
		isActive: true,
	});
});

// Обновление списка корзины
events.on('basket:change', () => {
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

    basket.items = basketCatalog;
    basket.updateSelected();
});

// Удалили карточку из корзины
events.on('card:deleteFromBasket', (item: Card) => {
	productModel.deleteFromBasket(item.id);
    page.counter = productModel.quantityItemsInBasket();
	events.emit('basket:change');
});

// Открыли форму заказа
events.on('order:creation', () => {
	modal.render({
		content: order.render({
			address: '',
			payment: '',
			valid: false,
			errors: [],
		}),
		isActive: true,
	});
});

// Изменили поле фомы
events.on(
	/^order\..*:change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		productModel.setOrderField(data.field, data.value);
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
	productModel.createFinalOrder();

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
	const finalOrder = productModel.createFinalOrder();
	api
		.postProductOrder(finalOrder)
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
		.catch((err) => console.error('Ошибка отправки заказа:', err));
});

// Блокировка прокрутки страницы
events.on('modal:open', () => {
    page.locked = true;
});

// Снятие блока
events.on('modal:close', () => {
    page.locked = false;
});