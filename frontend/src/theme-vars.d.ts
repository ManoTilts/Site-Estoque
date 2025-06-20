import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    vars?: {
      palette: any;
      shape: any;
      typography: any;
    };
  }
} 