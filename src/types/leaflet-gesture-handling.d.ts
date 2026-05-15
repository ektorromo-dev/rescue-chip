declare module 'leaflet-gesture-handling' {
  export const GestureHandling: any;
}

import { MapContainerProps } from 'react-leaflet';
declare module 'react-leaflet' {
  interface MapContainerProps {
    gestureHandling?: boolean;
  }
}
