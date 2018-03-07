import simpleMarkdown from 'simple-markdown'
import logger from 'winston'
import fs from 'fs'

import * as Commands from '../commands'

const env = process.env.NODE_ENV || 'development'

logger.remove(logger.transports.Console)
logger.add(logger.transports.Console, {
    colorize: true
})
logger.level = env === 'development' ? 'debug' : 'info'

export default class Rin {
    constructor(vendor, client) {
        this.vendor = vendor
        this.client = client

        this.commands = Object.keys(Commands)
            .map(cmd => new Commands[cmd]())
            .filter(this.checkFor.bind(this))
            .filter(this.checkRequired)

        this.commandLists = this.commands.map(cmd => ({
            command: cmd.INFO.command,
            description: cmd.INFO.description
        }))
    }

    async init() {
        for (let cmd of this.commands) {
            'ready' in cmd ? await cmd.ready() : null
        }
    }

    checkFor(cmd) {
        const forVendor = cmd.INFO.for

        if (!forVendor) return true

        if (typeof forVendor === 'string') {
            return this.vendor === forVendor
        }

        return forVendor.includes(this.vendor)
    }

    checkRequired(cmd) {
        const required = cmd.INFO.required

        const check = required => {
            if (!required) return true
            if (!required.length) return true

            const completed = required.filter(req => {
                if (typeof req.toBe == 'function') {
                    return !req.toBe(req.value)
                }

                return !(req.value == req.toBe)
            })

            if (completed.length) return false

            return true
        }

        const checkResult = check(required)

        if (!checkResult) {
            Rin.log.warn(
                `${
                    cmd.INFO.command
                } command require something, and not passed, skip`
            )

            return false
        }

        return true
    }

    get defaultReply() {
        return Rin.defaultReply(this.commandLists)
    }

    async handle(message, data = {}) {
        const argument = message.split(' ')
        const usrCmd = argument[0].toLowerCase()

        switch (usrCmd) {
            case 'chain':
                return await this.chainCommands(argument.slice(1))
            case 'help':
                return await this.defaultReply
        }

        const command = this.commands.find(
            cmd => usrCmd == cmd.INFO.command.toLowerCase()
        )

        if (!command) return await this.defaultReply

        if (!('handle' in command)) {
            return `${usrCmd} doesn't have handle method!`
        }

        Object.assign(data, { vendor: this.vendor, client: this.client })

        const input = argument.slice(1).join(' ')

        message = command.INFO.standarize ? Rin.standarize(input) : input

        return await command.handle(message.split(' '), data)
    }

    async chainCommands(message) {
        const input =
            message.indexOf('>') > 0
                ? message.slice(message.indexOf('>') + 1).join(' ')
                : ''

        const expressions = message
            .join(' ')
            .split('>')[0]
            .split(/\s*,\s*/)

        const availableCommand = this.commandLists.map(cmd =>
            cmd.command.toLowerCase()
        )

        if (Rin.isEmpty(expressions[0]) && Rin.isEmpty(input)) {
            const usage = 'usage: `chain cmd1, cmd2, cmd3`'
            const example =
                'example: `chain wiki, translate en id > search javascript`'

            return `${usage}\nfor long argument: \`chain cmd1, cmd2 > argument\`\n\n${example}`
        }

        for (let cmd of expressions) {
            const pureCommand = cmd.split(' ')[0]

            if (!availableCommand.includes(pureCommand)) {
                return `unknown command: ${pureCommand}`
            }
        }

        let error

        const result = await expressions.reduce(async (acc, cur) => {
            let res

            try {
                const accum = await acc
                const cmd = `${cur} ${Rin.removeMarkdown(
                    accum.result || accum
                )}`

                res = await this.handle(cmd)
            } catch (err) {
                error = err
            }

            return res || acc
        }, Promise.resolve(input))

        if (error) return error.message || JSON.stringify(error)

        return result
    }

    static get availableCommand() {
        return Object.keys(Commands)
    }

    static extractText(node) {
        let text = node.content

        if (node.content instanceof Array) {
            text = node.content.map(Rin.extractText).join('')
        }

        return text
    }

    static mdToHtml(text) {
        const mdParse = simpleMarkdown.defaultBlockParse
        const newlineNode = { content: '\n', type: 'text' }

        const tagMap = new Proxy(
            {
                u: 'b',
                strong: 'b',
                em: 'em',
                inlineCode: 'code',
                codeBlock: 'pre'
            },
            {
                get(target, prop) {
                    const tags = {
                        start: '',
                        end: ''
                    }

                    if (prop in target) {
                        tags.start = `<${target[prop]}>`
                        tags.end = `</${target[prop]}>`
                    }

                    return tags
                }
            }
        )

        const processedText = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')

        return mdParse(processedText)
            .map(rootNode => {
                let content = rootNode.content

                if (rootNode.type !== 'paragraph') {
                    content = rootNode
                }

                return content
            })
            .reduce(
                (flattened, nodes) =>
                    flattened.concat([newlineNode, newlineNode], nodes),
                []
            )
            .slice(2)
            .reduce((html, node) => {
                const tags = tagMap[node.type]

                return (
                    html +
                    `${tags.start}${Rin.extractText(node) || ''}${tags.end}`
                )
            }, '')
    }

    static removeMarkdown(markdown) {
        const mdParse = simpleMarkdown.defaultBlockParse
        const newlineNode = { content: '\n', type: 'text' }

        return mdParse(markdown)
            .map(rootNode => {
                let content = rootNode.content

                if (rootNode.type !== 'paragraph') {
                    content = rootNode
                }

                return content
            })
            .reduce(
                (flattened, nodes) =>
                    flattened.concat([newlineNode, newlineNode], nodes),
                []
            )
            .slice(2)
            .reduce((acc, node) => {
                return acc + `${Rin.extractText(node) || ''}`
            }, '')
    }

    static defaultReply(commandLists) {
        const cmdListString = commandLists
            .map(cmd => `\`${cmd.command}\` - ${cmd.description}`)
            .join('\n')

        const header = '**Hello! I am Rin, you can use the following command:**'
        const footer = 'https://github.com/indmind/rin feel free to contribute!'

        return `${header}\n\n${cmdListString}\n\n${footer}`
    }

    static get log() {
        return logger
    }

    static standarize(text) {
        return text
            .replace(/\s\s+/g, ' ')
            .trim()
            .toLowerCase()
    }

    static notEmpty(text) {
        return (
            typeof text != 'undefined' &&
            typeof text.valueOf() == 'string' &&
            text.length > 0
        )
    }

    static isEmpty(text) {
        return !Rin.notEmpty(text)
    }

    static code(type, text) {
        return '```' + type + '\n' + text + '\n```'
    }

    static XOR(a, b) {
        return (a && !b) || (!a && b)
    }

    static getFileSize(filePath) {
        const stats = fs.statSync(filePath)
        const size = stats.size
        const i = Math.floor(Math.log(size) / Math.log(1024))

        return (
            (size / Math.pow(1024, i)).toFixed(2) * 1 +
            ' ' +
            ['B', 'KB', 'MB', 'GB', 'TB'][i]
        )
    }

    // telegram only
    static sendLogError(app, err, chatInfo = '') {
        Rin.log.error(err)

        if (Rin.isEmpty(process.env.TELE_ERR_CHAT_ID)) return

        app.telegram.sendMessage(
            process.env.TELE_ERR_CHAT_ID,
            `Error:\n${chatInfo}\n\n${err.message || JSON.stringify(err)}`
        )
    }

    static getChatInfo(vendor, ctx) {
        if (vendor == 'telegram') {
            const userName =
                ctx.message.from.first_name + ctx.message.from.last_name
            const message = ctx.message.text.split(' ')

            return `[TELEGRAM]${userName}(${
                ctx.message.from.id
            }): ${Rin.standarize(message.join(' '))}`
        } else if (vendor == 'discord') {
            const message = ctx.content
            const username = ctx.author.username

            return `[DISCORD]${username}(${ctx.author.id}): ${Rin.standarize(
                message
            )}`
        }
    }
}
