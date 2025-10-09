import { Routes } from '@angular/router';
import { WarehouseListComponent } from './almacenes/components/warehouse-list.component';
import { ClassificationListComponent } from './clasificaciones/components/classification-list.component';
import { SupplierListComponent } from './proveedores/components/supplier-list.component';
import { ProductListComponent } from './productos/components/product-list.component';

export const inventarioRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'almacenes',
                component: WarehouseListComponent
            },
            {
                path: 'clasificaciones',
                component: ClassificationListComponent
            },
            {
                path: 'proveedores',
                component: SupplierListComponent
            },
            {
                path: 'productos',
                component: ProductListComponent
            }
        ]
    }
];
