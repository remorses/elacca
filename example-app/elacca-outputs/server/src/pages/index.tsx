'skip ssr';

import { createContext } from 'react';
export function getServerSideProps() {
  return {
    props: {
      hello: 'world'
    }
  };
}
const context = createContext({});
function HeavyComponent() {
  return null;
}
export default HeavyComponent;