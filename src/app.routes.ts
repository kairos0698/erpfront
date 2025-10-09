import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { EmpresaListComponent } from './app/features/empresas/components/empresa-list/empresa-list';
import { LoginComponent } from './app/pages/auth/login.component';
import { RegisterComponent } from './app/pages/auth/register.component';
import { authGuard } from './app/guards/auth.guard';
import { guestGuard } from './app/guards/guest.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            { path: 'empresas', component: EmpresaListComponent },
                    { path: 'rh', loadChildren: () => import('./app/pages/rh/rh.routes').then(m => m.rhRoutes) },
                    { path: 'inventario', loadChildren: () => import('./app/pages/inventario/inventario.routes').then(m => m.inventarioRoutes) },
                    { path: 'produccion', loadChildren: () => import('./app/pages/produccion/produccion.routes').then(m => m.produccionRoutes) },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
    { path: '**', redirectTo: '/login' }
];
