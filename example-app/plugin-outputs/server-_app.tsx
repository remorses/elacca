'skip ssr';

import _default from "react";
import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
function MyApp({
  Component,
  pageProps
}: AppProps) {
  return <ChakraProvider>
            <Component {...pageProps} />
        </ChakraProvider>;
}
function DefaultExportRenamedByElacca() {
  return null;
}
export default DefaultExportRenamedByElacca;