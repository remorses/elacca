'skip ssr'
import {
    Checkbox,
    FormControl,
    FormLabel,
    HStack,
    PinInput,
    PinInputField,
    Select,
    Slider,
    SliderFilledTrack,
    SliderThumb,
    SliderTrack,
    Switch,
    Textarea,
} from '@chakra-ui/react'
import { ChakraProvider } from '@chakra-ui/react'
import React from 'react'
import { createContext } from 'react'

export default function HeavyComponent({ hello }) {
    return (
        <ChakraProvider>
            <div className='w-[600px]'>
                hello
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
                <Textarea placeholder='Here is a sample placeholder' />
                <HStack>
                    <PinInput>
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                        <PinInputField />
                    </PinInput>
                </HStack>
                <Slider aria-label='slider-ex-1' defaultValue={30}>
                    <SliderTrack>
                        <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb />
                </Slider>
                <FormControl display='flex' alignItems='center'>
                    <FormLabel htmlFor='email-alerts' mb='0'>
                        Enable email alerts?
                    </FormLabel>
                    <Switch id='email-alerts' />
                </FormControl>
                <h1>Heavy Component {hello}</h1>
            </div>
        </ChakraProvider>
    )
}

export function getServerSideProps() {
    return {
        props: {
            hello: 'world',
        },
    }
}



const context = createContext({})
