import { Routes } from '@angular/router';
import { EmployeeListComponent } from './employee/components/employee-list.component';
import { ActivityListComponent } from './activity/components/activity-list.component';

export const rhRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'empleados',
                component: EmployeeListComponent
            },
            {
                path: 'actividades',
                component: ActivityListComponent
            }
        ]
    }
];
