import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { ROUTES } from '../../../core/routing/route-paths';
import { ArqueoService } from '../../caja/services/arqueo.service';

export const arqueoActivoGuard: CanActivateFn = () => {
  const arqueoService = inject(ArqueoService);
  const router = inject(Router);

  return arqueoService.getArqueoActivo().pipe(
    map((arqueo) => {
      if (arqueoService.isAbierto(arqueo)) return true;
      router.navigate([ROUTES.CAJERO_TURNO]);
      return false;
    }),
    catchError(() => {
      router.navigate([ROUTES.CAJERO_TURNO]);
      return of(false);
    })
  );
};
