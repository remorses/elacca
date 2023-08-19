'skip ssr';

import React from 'react';
import { createContext } from 'react';
export function getServerSideProps() {
  return {
    props: {
      hello: 'world'
    }
  };
}
console.log(`index-page-xxx`);
const context = /*#__PURE__*/createContext({});
function DefaultExportRenamedByElacca() {
  return null;
}
export default DefaultExportRenamedByElacca;