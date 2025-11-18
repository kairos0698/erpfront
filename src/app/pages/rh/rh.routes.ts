import { Routes } from '@angular/router';
import { EmployeeListComponent } from './employee/components/employee-list.component';
import { PayrollListComponent } from './payroll/components/payroll-list.component';
import { JobPositionsComponent } from './job-positions/components/job-positions.component';

export const rhRoutes: Routes = [
    {
        path: '',
        children: [
            {
                path: 'empleados',
                component: EmployeeListComponent
            },
            {
                path: 'nomina',
                component: PayrollListComponent
            },
            {
                path: 'puestos-trabajo',
                component: JobPositionsComponent
            }
        ]
    }
];
