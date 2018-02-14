import Telegraf from 'telegraf'
import logger from 'winston'

import Udict from '../command/udict'
import Calc from '../command/calc'
import Wiki from '../command/wiki'

const env = process.env.NODE_ENV || 'development'

logger.remove(logger.transports.Console)
logger.add(logger.transports.Console, {
    colorize: true
})
logger.level = env === 'development' ? 'debug' : 'info'

const app = new Telegraf(process.env.TOKEN)

const command = {
    udict: new Udict(),
    calc: new Calc(),
    wiki: new Wiki()
}

const cmdLists = Object.keys(command)
const cmdListString = cmdLists.map(cmd => `\`${cmd}\``).join('\n')
const defaultReply = `Hello! I am Rin an open source multi-purpose bot https://github.com/indmind/rin \n you can use the following command:\n${cmdListString}`

app.telegram.getMe().then(botInfo => {
    app.options.username = botInfo.username
})

app.command('start', async ctx => {
    const userName = ctx.message.from.first_name + ctx.message.from.last_name

    logger.info(`${userName}(${ctx.message.from.id}): /start`)

    ctx.reply(defaultReply)
})

app.on('text', async ctx => {
    const userName = ctx.message.from.first_name + ctx.message.from.last_name
    const message = ctx.message.text

    const args = message.split(' ')

    logger.info(`${userName}(${ctx.message.from.id}): ${message}`)

    const cmd = args[0]

    let result = ''

    if (cmdLists.includes(cmd)) {
        const response = await command[cmd].handle(args)
        result = response
            .replace(/\s*:.*?:\s*/g, '')
            .replace(/\*\*+/g, '*')
            .replace(/__+/g, '_')
    } else {
        result = defaultReply
    }

    if (result.length > 4000) {
        ctx.reply("Sorry It's too big to send")
    } else ctx.replyWithMarkdown(result)
})

app.catch(err => {
    logger.error('Ooops ')
    logger.error(err)
})

app.startPolling()
