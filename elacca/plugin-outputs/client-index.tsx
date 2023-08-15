"skip ssr";

import _default from "react";
class Page extends React.Component {}
function DefaultExportRenamedByElacca(props) {
  const [isMounted, setIsMounted] = _default.useState(false);
  _default.useEffect(() => {
    setIsMounted(true);
  }, []);
  return isMounted ? _default.createElement(Page, props) : null;
}
export default DefaultExportRenamedByElacca;