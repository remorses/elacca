'skip ssr';

import { Checkbox, FormControl, FormLabel, HStack, PinInput, PinInputField, Select, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Switch, Textarea } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
import { createContext } from 'react';
export function getServerSideProps() {
  return {
    props: {
      hello: 'world'
    }
  };
}
const context = createContext({});
function DefaultExportRenamedByElacca() {
  return null;
}
export default DefaultExportRenamedByElacca;