import * as Helper from '../../src/core/helper'
import * as Commands from '../../src/commands'

import fs from 'fs'
import path from 'path'

describe('core.helper', () => {
    it('should correctly standarize a text', () => {
        const text = ' foo      bar BaZ bar    foo      '
        const standarized = Helper.standarize(text)

        expect(standarized).toBe('foo bar baz bar foo')
    })

    it('should correctly convert markdown to telegram html', () => {
        const expected = fs.readFileSync(
            __dirname + '/../__data__/rin_mdtohtml.txt',
            'utf8'
        )

        const markdown =
            '__foo__ _baz_ bar_foo baz*bar **bar** ```foo bar(){return baz}``` `$ foo bar baz`'

        const html = Helper.mdToHtml(markdown)

        expect(html).toBe(expected)
    })

    it('should correctly strip markdown', () => {
        const markdown =
            '__foo__ _baz_ bar_foo baz*bar **bar** ```foo bar(){return baz}``` `$ foo bar baz`'

        const text = Helper.removeMarkdown(markdown)

        expect(text).toBe(
            'foo baz bar_foo baz*bar bar foo bar(){return baz} $ foo bar baz'
        )
    })

    it('should return max allowed text length', () => {
        expect(Helper.getMaxAllowedLength()).toBe(2000)
    })

    it('should correctly return all available commands', () => {
        expect(Helper.getAvailableCommand()).toEqual(Object.keys(Commands))
    })

    it('should correctly return default reply', () => {
        const data = [
            {
                command: 'eat',
                description: 'eat food'
            },
            {
                command: 'drink',
                description: 'drink water'
            }
        ]

        expect(Helper.defaultReply(data)).toBe(
            `**Hello! I am Rin, you can use the following command:**` +
                `\n\n\`eat\` - eat food\n\`drink\` - drink water\n\n` +
                `https://github.com/indmind/rin feel free to contribute!`
        )

        expect(Helper.defaultReply(data, true)).toBe(
            `**Hello! I am Rin, you can use the following command:**` +
                `\n\n\`\`\`eat   - eat food\ndrink - drink water\`\`\`\n\n` +
                `https://github.com/indmind/rin feel free to contribute!`
        )
    })

    it('should correctly get temp path', () => {
        expect(Helper.getTempPath('something')).toBe(
            path.resolve(__dirname + '../../../temp/something')
        )

        expect(Helper.getTempPath()).toBe(
            path.resolve(__dirname + '../../../temp') + '/'
        )
    })

    it('should return is a string empty or not', () => {
        expect(Helper.isEmpty('')).toBe(true)
        expect(Helper.isEmpty('hello')).toBe(false)
        expect(Helper.notEmpty('')).toBe(false)
        expect(Helper.notEmpty('hello')).toBe(true)
    })

    it('should return is an object empty or not', () => {
        expect(Helper.isEmpty({})).toBe(true)
        expect(Helper.isEmpty({ foo: 'bar' })).toBe(false)
        expect(Helper.notEmpty({})).toBe(false)
        expect(Helper.notEmpty({ baz: 'foo' })).toBe(true)
    })

    it('should return is an array empty or not', () => {
        expect(Helper.isEmpty([])).toBe(true)
        expect(Helper.isEmpty([1, 2, 3])).toBe(false)
        expect(Helper.notEmpty([])).toBe(false)
        expect(Helper.notEmpty(['hello', 'world'])).toBe(true)
    })

    it('should return is a Map empty or not', () => {
        const map = new Map()

        expect(Helper.isEmpty(map)).toBe(true)

        map.set('foo', 'bar')
        expect(Helper.isEmpty(map)).toBe(false)

        map.delete('foo')
        expect(Helper.notEmpty(map)).toBe(false)

        map.set('baz', 1)
        expect(Helper.notEmpty(map)).toBe(true)
    })

    it('should return true if isEmpty get undefined argument', () => {
        expect(Helper.isEmpty(undefined)).toBe(true)
        expect(Helper.notEmpty(undefined)).toBe(false)
    })

    it('should correctly make markdown code block', () => {
        const code = 'console.log("hello world!")'

        expect(Helper.code('js', code)).toBe('```js\n' + code + '\n```')
    })

    it('should correctly handle XOR', () => {
        expect(Helper.XOR(false, false)).toBe(false)
        expect(Helper.XOR(false, true)).toBe(true)
        expect(Helper.XOR(true, false)).toBe(true)
        expect(Helper.XOR(true, true)).toBe(false)
    })

    it('should correctly return file size', () => {
        expect(Helper.getFileSize(__dirname + '/../__data__/dummy.txt')).toBe(
            '365.84 KB'
        )
    })

    it('should correctly return telegram chat info', () => {
        const data = {
            message: {
                from: {
                    first_name: 'foo',
                    last_name: 'bar',
                    id: 86
                },
                text: 'do the barrel roll'
            }
        }

        const username =
            data.message.from.first_name + data.message.from.last_name

        expect(Helper.getChatInfo('telegram', data)).toBe(
            `[TELEGRAM]${username}(${
                data.message.from.id
            }): ${Helper.standarize(data.message.text)}`
        )
    })

    it('should correctly return discord chat info', () => {
        const data = {
            content: 'make me cry',
            author: {
                username: 'baz',
                id: 87
            }
        }

        expect(Helper.getChatInfo('discord', data)).toBe(
            `[DISCORD]${data.author.username}(${
                data.author.id
            }): ${Helper.standarize(data.content)}`
        )
    })
})
