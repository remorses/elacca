'skip ssr';

import _default from "react";
import './styles.css';
import { someUtil } from '@/utils';
function MyApp({
  Component,
  pageProps
}) {
  someUtil();

  // some
  return <Component {...pageProps} />;
}
const __identityFunction = () => {};
function DefaultExportRenamedByElacca(props) {
  const isClient = _default.useSyncExternalStore(__identityFunction, () => true, () => false);
  return isClient ? _default.createElement(MyApp, props) : null;
}
Object.assign(DefaultExportRenamedByElacca, MyApp);
export default DefaultExportRenamedByElacca;