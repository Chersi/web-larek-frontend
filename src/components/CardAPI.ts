import {Api, ApiListResponse} from './base/api';
import {IOrder, IProduct} from "../types/index";

export interface ICardAPI {
    getCardList: () => Promise<IProduct[]>;
    getCardItem: (id: string) => Promise<IProduct>;
    postProductOrder: (order: IOrder) => Promise<IOrderResult>;
}

export interface IOrderResult {
    id: string;
	total: number;
}

export class CardAPI extends Api implements ICardAPI {
    readonly cdn: string;

    constructor(cdn: string, baseUrl: string, options?: RequestInit) {
        super(baseUrl, options);
        this.cdn = cdn;
    }

    getCardItem(id: string): Promise<IProduct> {
        return this.get(`/product/${id}`).then(
            (item: IProduct) => ({
                ...item,
                image: this.cdn + item.image,
            })
        );
    }

    getCardList(): Promise<IProduct[]> {
        return this.get('/product/').then((data: ApiListResponse<IProduct>) =>
            data.items.map((item) => ({
                ...item,
                image: this.cdn + item.image
            }))
        );
    }

    postProductOrder(order: IOrder): Promise<IOrderResult> {
		return this.post('/order', order).then((data: IOrderResult) => data);
	}

}