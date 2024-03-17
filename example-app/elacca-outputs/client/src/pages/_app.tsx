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
const identity = () => {};
function DefaultExportRenamedByElacca(props) {
  const isClient = _default.useSyncExternalStore(identity, () => true, () => false);
  return isClient ? _default.createElement(MyApp, props) : null;
}
Object.assign(DefaultExportRenamedByElacca, MyApp);
export default DefaultExportRenamedByElacca;