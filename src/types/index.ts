export type IProductCategory = | 'софт-скил' | 'другое' | 'дополнительное' | 'кнопка' | 'хард-скил';

export interface IProduct {
    id: string;
    description: string;
    image: string;
    title: string;
    category: IProductCategory;
    price: number;
    statusAddToBasket: boolean;
}

export type FormErrors = Partial<Record<keyof IOrder, string>>;

export interface IOrderForm {
    payment?: string;
    address: string;
    email: string;
    phone: string;
}

export interface IOrder extends IOrderForm {
    items?: string[];
    total?: number;
}

export interface ICardActions {
	onClick: (event: MouseEvent | string) => void;
}