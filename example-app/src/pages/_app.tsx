'skip ssr'
import { ChakraProvider } from '@chakra-ui/react'

import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider>
            <Component {...pageProps} />
        </ChakraProvider>
    )
}
