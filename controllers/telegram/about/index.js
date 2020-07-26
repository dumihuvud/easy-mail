const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')

const { backKeyboard, testKeyboard } = require('../../../util/keyboard')

const replies = {
    enter: 'A small SPA application to make emails and send them via SendGrid.',
    leave: `✋ Hey, what are you up to?`
}

const { leave } = Stage
const about = new Scene('aboutScene')

about.enter(async (ctx) => {
    await ctx.reply(replies.enter, backKeyboard)
})

about.leave(async (ctx) => {
    await ctx.reply(replies.leave, testKeyboard)
})

// command,hears,action
about.command('back', leave())
about.hears('◀️ BACK', leave())
about.action('saveme', leave())

module.exports = about