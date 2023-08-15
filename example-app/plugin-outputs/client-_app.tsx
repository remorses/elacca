'skip ssr';

import _default from "react";
import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
function MyApp({
  Component,
  pageProps
}: AppProps) {
  return <Component {...pageProps} />;
}
function DefaultExportRenamedByElacca(props) {
  const [isMounted, setIsMounted] = _default.useState(false);
  _default.useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted ? _default.createElement(MyApp, props) : null;
}
export default DefaultExportRenamedByElacca;