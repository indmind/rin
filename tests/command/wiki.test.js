import Wiki from '../../src/commands/wiki'

jest.setTimeout(30000)

describe('command.wiki', () => {
    const wiki = new Wiki()

    it('should return correct data from search command', async () => {
        const result = await wiki.handle(['search', 'javascript'])

        expect(result).toBeTruthy()
    })

    it('should return correct data from id command', async () => {
        const result = await wiki.handle(['wiki', 'id', '18630637'])

        expect(result).toBeTruthy()
    })

    it('should return correct data from geo command', async () => {
        const result = await wiki.handle([
            'wiki',
            'geo',
            '32.329',
            '-96.136',
            '10000'
        ])

        expect(result).toBeTruthy()
    })

    it('should return random data from random command', async () => {
        const result = await wiki.handle(['wiki', 'random'])

        expect(result).toBeTruthy()
    })
})
