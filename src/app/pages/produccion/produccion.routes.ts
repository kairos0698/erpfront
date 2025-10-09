import { Routes } from '@angular/router';
import { RegionLotListComponent } from './regiones-lotes/components/region-lot-list.component';
import { ExtraCostListComponent } from './costos-extra/components/extra-cost-list.component';
import { BiologicalProductListComponent } from './productos-biologicos/components/biological-product-list.component';

export const produccionRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'regiones-lotes',
                component: RegionLotListComponent
            },
            {
                path: 'costos-extra',
                component: ExtraCostListComponent
            },
            {
                path: 'productos-biologicos',
                component: BiologicalProductListComponent
            }
        ]
    }
];
