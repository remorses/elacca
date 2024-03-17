'skip ssr'
import { ChakraProvider } from '@chakra-ui/react'
import './styles.css'
import type { AppProps } from 'next/app'
import { someUtil } from '@/utils'

export default function MyApp({ Component, pageProps }: AppProps) {
    someUtil()

    // some
    return <Component {...pageProps} />
}
