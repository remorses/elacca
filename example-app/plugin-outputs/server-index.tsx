'skip ssr';

import _default from "react";
import { Checkbox, Select } from '@chakra-ui/react';
import { ChakraProvider } from '@chakra-ui/react';
import React from 'react';
function HeavyComponent({
  hello
}) {
  return <div className='w-[600px]'>
            <div className=''>
                <Select placeholder='Select option'>
                    <option value='option1'>Option 1</option>
                    <option value='option2'>Option 2</option>
                    <option value='option3'>Option 3</option>
                </Select>
            </div>
            <div className=''>
                <Checkbox defaultChecked>Checkbox</Checkbox>
            </div>
            <h1>Heavy Component {hello}</h1>
        </div>;
}
export function getServerSideProps() {
  return {
    props: {
      hello: 'world'
    }
  };
}
function DefaultExportRenamedByElacca() {
  return null;
}
export default DefaultExportRenamedByElacca;