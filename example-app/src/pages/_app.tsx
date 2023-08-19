'skip ssr'
import { ChakraProvider } from '@chakra-ui/react'
import './styles.css'
import type { AppProps } from 'next/app'

export default function MyApp({ Component, pageProps }: AppProps) {
    return <Component {...pageProps} />
}
