import { Routes } from '@angular/router';
import { CustomerListComponent } from './clientes/components/customer-list.component';
import { QuotationListComponent } from './cotizaciones/components/quotation-list.component';
import { OrderListComponent } from './pedidos/components/order-list.component';
import { SaleListComponent } from './ventas/components/sale-list.component';

export const ventasRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'clientes',
                component: CustomerListComponent
            },
            {
                path: 'cotizaciones',
                component: QuotationListComponent
            },
            {
                path: 'pedidos',
                component: OrderListComponent
            },
            {
                path: 'ventas',
                component: SaleListComponent
            }
        ]
    }
];

