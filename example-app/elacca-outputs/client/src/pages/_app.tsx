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
function DefaultExportRenamedByElacca(props) {
  const [isMounted, setIsMounted] = _default.useState(false);
  _default.useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted ? _default.createElement(MyApp, props) : null;
}
Object.assign(DefaultExportRenamedByElacca, MyApp);
export default DefaultExportRenamedByElacca;