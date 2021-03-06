import Discord from 'discord.js'

import Rin, { log, standarize } from '../core/rin'

const client = new Discord.Client()
const rin = new Rin('discord', client)

rin.init()

client.on('ready', () => {
    log.info(`Logged in as ${client.user.tag}!`)

    client.user.setPresence({
        status: 'online',
        game: { name: 'Half Lie' }
    })
})

client.on('message', async ctx => {
    const message = ctx.content
    const username = ctx.author.username
    const args = message.split(' ')

    if (!(args[0] == client.user.username)) return

    ctx.channel.startTyping()

    log.info(`[DISCORD]${username}(${ctx.author.id}): ${standarize(message)}`)

    const subcmd = args.slice(1).join(' ')

    const response = await rin.handle(subcmd, { ctx })

    if (!response) return ctx.channel.stopTyping(true)

    const result = response.result || response

    ctx.channel.stopTyping(true)

    if (result.length > 2000) {
        ctx.reply("Sorry It's too big to send :disappointed:")
    } else ctx.reply(result)
})

client.login(process.env.DISCORD_TOKEN)
