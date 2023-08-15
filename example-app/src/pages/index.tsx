export default function HeavyComponent({ hello }) {
    return (
        <div>
            <h1>Heavy Component {hello}</h1>
        </div>
    )
}

export function getServerSideProps() {
    return {
        props: {
            hello: 'world',
        },
    }
}
