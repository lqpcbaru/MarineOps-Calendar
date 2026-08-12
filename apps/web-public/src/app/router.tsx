import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { Layout } from '../shared/components/Layout';
import { HomePage } from '../features/home/HomePage';
import { PasangSurutPage } from '../features/pasang-surut/PasangSurutPage';
import { CuacaPage } from '../features/cuaca/CuacaPage';
import { AnginOmbakPage } from '../features/angin-ombak/AnginOmbakPage';
import { FasaBulanPage } from '../features/fasa-bulan/FasaBulanPage';
import { MatahariPage } from '../features/matahari/MatahariPage';
import { KalendarOperasiPage } from '../features/kalendar-operasi/KalendarOperasiPage';
import { StesenPage } from '../features/stesen/StesenPage';
import { AmaranMarinPage } from '../features/amaran-marin/AmaranMarinPage';
import { MengenaiPage } from '../features/mengenai/MengenaiPage';
import { VesselsPage } from '../features/vessels/VesselsPage';

const rootRoute = createRootRoute({
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

const pasangSurutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/pasang-surut',
  component: PasangSurutPage,
});

const cuacaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cuaca',
  component: CuacaPage,
});

const anginOmbakRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/angin-ombak',
  component: AnginOmbakPage,
});

const fasaBulanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/fasa-bulan',
  component: FasaBulanPage,
});

const matahariRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/matahari',
  component: MatahariPage,
});

const kalendarOperasiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/kalendar-operasi',
  component: KalendarOperasiPage,
});

const stesenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stesen',
  component: StesenPage,
});

const amaranMarinRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/amaran-marin',
  component: AmaranMarinPage,
});

const mengenaiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/mengenai',
  component: MengenaiPage,
});

const vesselsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/perisikan-kapal',
  component: VesselsPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  pasangSurutRoute,
  cuacaRoute,
  anginOmbakRoute,
  fasaBulanRoute,
  matahariRoute,
  kalendarOperasiRoute,
  stesenRoute,
  amaranMarinRoute,
  mengenaiRoute,
  vesselsRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
