import ms from 'ms'
import {
	MessageEmbed,
	Message,
	MessageEmbedFooter,
	MessageEmbedAuthor,
	ColorResolvable,
	CommandInteraction,
	MessageActionRow,
	MessageButton,
	Client,
	MessageButtonStyle
} from 'discord.js'
import chalk from 'chalk'
import model from './model/gSys'

// ------------------------------
// ------- T Y P I N G S --------
// ------------------------------

/**
 * **URL** of the Type: *https://simplyd.js.org/docs/types/CustomizableEmbed*
 */

interface CustomizableEmbed {
	author?: MessageEmbedAuthor
	title?: string
	footer?: MessageEmbedFooter
	description?: string
	color?: ColorResolvable

	credit?: boolean
}

interface requirement {
	type: 'Role' | 'Guild' | 'None'
	id: string
}

interface btnTemplate {
	style?: MessageButtonStyle
	label?: string
	emoji?: string
}

/**
 * **URL** of the Type: *https://simplyd.js.org/docs/types/Buttons/giveawaySystem*
 */

interface gSysButtons {
	enter?: btnTemplate
	end?: btnTemplate
	reroll?: btnTemplate
}

export type giveawayOptions = {
	prize?: string
	winners?: string | number
	channel?: MessageChannel
	time?: string

	buttons?: gSysButtons

	req?: requirement
	ping?: string

	embed?: CustomizableEmbed

	disable?: 'Label' | 'Emoji'
}

interface returns {
	message: string
	winners: number
	prize: string
	endsAt: number
	req: string
}

// ------------------------------
// ------ F U N C T I O N -------
// ------------------------------

/**
 * A **Powerful** yet simple giveawaySystem | *Required: **manageBtn()***
 * @param client
 * @param message
 * @param options
 * @example simplydjs.giveawaySystem(client, message)
 */

export async function giveawaySystem(
	client: Client,
	message: Message | CommandInteraction,
	options: giveawayOptions = {}
): Promise<returns> {
	return new Promise(async (resolve) => {
		try {
			let interaction
			// @ts-ignore
			if (message.commandId) {
				interaction = message
			}
			let timeStart: number = Date.now()
			let int = message as CommandInteraction
			let mes = message as Message

			/*
			if (message.member.permissions.has('MANAGE_GUILD')) {
				if (interaction) {
					return await int.followUp({
						content: 'You are not a admin to start a giveaway',
						ephemeral: true
					})
				} else if (!interaction) {
					return await message.reply({
						content: 'You are not a admin to start a giveaway'
					})
				}
			}
			*/

			options.winners ??= 1

			options.buttons = {
				enter: {
					style: options.buttons?.enter?.style || 'SUCCESS',
					label: options.buttons?.enter?.label || 'Enter',
					emoji: options.buttons?.enter?.emoji || '🎁'
				},
				end: {
					style: options.buttons?.end?.style || 'DANGER',
					label: options.buttons?.end?.label || 'End',
					emoji: options.buttons?.end?.emoji || '⛔'
				},
				reroll: {
					style: options.buttons?.end?.style || 'PRIMARY',
					label: options.buttons?.end?.label || 'Reroll',
					emoji: options.buttons?.end?.emoji || '🔁'
				}
			}

			if (!options.embed) {
				options.embed = {
					footer: {
						text: '©️ Simply Develop. npm i simply-djs',
						iconURL: 'https://i.imgur.com/u8VlLom.png'
					},
					color: '#075FFF',
					title: 'Giveaways',
					credit: true
				}
			}

			let ch
			let time: any
			let winners: any
			let prize: any
			let req = 'None'
			let gid: string

			let content = '** **'

			if (options.ping) {
				content = message.guild.roles
					.fetch(options.ping, { force: true })
					.toString()
			}
			let val: any

			if (options.req?.type === 'Role') {
				val = await message.guild.roles.fetch(options.req?.id, {
					force: true
				})

				req = 'Role'
			} else if (options.req?.type === 'Guild') {
				val = client.guilds.cache.get(options.req?.id)

				if (!val)
					return message.channel.send({
						content:
							'Please add me to that server so i can set the requirement.'
					})
				gid = val.id

				await val.invites.fetch().then((a: any) => {
					val = `[${val.name}](https://discord.gg/${a.first()})`
				})
				req = 'Guild'
			}

			if (interaction) {
				ch =
					int.options.getChannel('channel') ||
					options.channel ||
					interaction.channel
				time = int.options.getString('time') || options.time || '1h'
				winners = int.options.getInteger('winners') || options.winners
				prize = int.options.getString('prize') || options.prize
			} else if (!interaction) {
				const [...args] = mes.content.split(/ +/g)
				// @ts-ignore
				ch = options.channel || message.mentions.channels.first()
				time = options.time || args[1]
				winners = args[2] || options.winners
				prize = options.prize || args.slice(3).join(' ')
			}

			let enter = new MessageButton()
				.setCustomId('enter_giveaway')
				.setStyle(options.buttons.enter.style || 'SUCCESS')

			if (options.disable === 'Label')
				enter.setEmoji(options.buttons.enter.emoji || '🎁')
			else if (options.disable === 'Emoji')
				enter.setLabel(options.buttons.enter.label || 'Enter')

			let end = new MessageButton()
				.setCustomId('end_giveaway')
				.setStyle(options.buttons.end.style || 'DANGER')

			if (options.disable === 'Label')
				end.setEmoji(options.buttons.end.emoji || '⛔')
			else if (options.disable === 'Emoji')
				end.setLabel(options.buttons.end.label || 'End')

			let reroll = new MessageButton()
				.setCustomId('reroll_giveaway')
				.setStyle(options.buttons.reroll.style || 'SUCCESS')
				.setDisabled(true)

			if (options.disable === 'Label')
				reroll.setEmoji(options.buttons.reroll.emoji || '🔁')
			else if (options.disable === 'Emoji')
				reroll.setLabel(options.buttons.reroll.label || 'Reroll')

			let row = new MessageActionRow().addComponents([enter, reroll, end])

			let endtime = Number((Date.now() + ms(time)).toString().slice(0, -3))

			let embed = new MessageEmbed()
				.setTitle(options.embed?.title || 'Giveaways')
				.setColor(options.embed?.color || '#075FFF')
				.setTimestamp(Number(Date.now() + ms(time)))
				.setFooter(
					options.embed?.credit
						? options.embed?.footer
						: {
								text: '©️ Simply Develop. npm i simply-djs',
								iconURL: 'https://i.imgur.com/u8VlLom.png'
						  }
				)
				.setDescription(
					options.embed?.description
						? options.embed?.description
								.replaceAll('{prize}', prize)
								.replaceAll('{endsAt}', `<t:${endtime}:R>`)
								.replaceAll(
									'{requirements}',
									req === 'None'
										? 'None'
										: req + ' | ' + (req === 'Role' ? `${val}` : val)
								)
								.replaceAll('{winCount}', winners)
								.replaceAll('{entered}', '0')
						: `Interact with the giveaway using the buttons. \n\n**🎁 Prize**: *${prize}*\n\n**⏰ Ends:** <t:${endtime}:R>`
				)
				.addFields(
					{
						name: '🤔 Requirements:',
						value: `${
							req === 'None'
								? 'None'
								: req + ' | ' + (req === 'Role' ? `${val}` : val)
						}`
					},
					{ name: '🏆 Winner(s):', value: `\`${winners}\`` },
					{ name: '🎫 Entered', value: `***0***` }
				)

			await ch
				.send({ content: content, embeds: [embed], components: [row] })
				.then(async (msg: any) => {
					resolve({
						message: msg.id,
						winners: winners,
						prize: prize,
						endsAt: endtime,
						req:
							req === 'None'
								? 'None'
								: req + ' | ' + (req === 'Role' ? val : gid)
					})

					const link = new MessageButton()
						.setLabel('View Giveaway.')
						.setStyle('LINK')
						.setURL(msg.url)

					let rowew = new MessageActionRow().addComponents([link])

					await message.channel.send({
						content: 'Giveaway has started.',
						components: [rowew]
					})

					let tim = Number(Date.now() + ms(time))

					let crete = new model({
						message: msg.id,
						entered: 0,
						winCount: winners,
						desc: options.embed?.description || null,
						requirements: {
							type: req === 'None' ? 'none' : req.toLowerCase(),
							id: req === 'Role' ? val : gid
						},
						started: timeStart,
						prize: prize,
						entry: [],
						endTime: tim
					})

					await crete.save()

					let timer = setInterval(async () => {
						if (!msg) return

						let dt = await model.findOne({ message: msg.id })

						if (dt.endTime && Number(dt.endTime) < Date.now()) {
							const embeded = new MessageEmbed()
								.setTitle('Processing Data...')
								.setColor(0xcc0000)
								.setDescription(
									`Please wait.. We are Processing the winner with some magiks`
								)
								.setFooter({
									text: 'Ending the Giveaway, Scraping the ticket..'
								})

							clearInterval(timer)

							await msg
								.edit({ embeds: [embeded], components: [] })
								.catch(() => {})

							let dispWin: string[] = []

							let winArr: any[] = []

							let winCt = dt.winCount

							let entries = dt.entry

							for (let i = 0; i < winCt; i++) {
								let winno = Math.floor(Math.random() * dt.entered)

								winArr.push(entries[winno])
							}

							setTimeout(() => {
								winArr.forEach(async (name) => {
									await message.guild.members
										.fetch(name?.userID)
										.then((user) => {
											dispWin.push(`<@${user.user.id}>`)

											let embod = new MessageEmbed()
												.setTitle('You.. Won the Giveaway !')
												.setDescription(
													`You just won \`${dt.prize}\` in the Giveaway at \`${user.guild.name}\` Go claim it fast !`
												)
												.setColor(0x075fff)
												.setFooter(
													options.embed?.credit
														? options.embed?.footer
														: {
																text: '©️ Simply Develop. npm i simply-djs',
																iconURL: 'https://i.imgur.com/u8VlLom.png'
														  }
												)

											let gothe = new MessageButton()
												.setLabel('View Giveaway')
												.setStyle('LINK')
												.setURL(msg.url)

											let entrow = new MessageActionRow().addComponents([gothe])

											return user
												.send({ embeds: [embod], components: [entrow] })
												.catch(() => {})
										})
										.catch(() => {})
								})
							}, 2000)

							setTimeout(async () => {
								if (!dt) return await msg.delete()
								if (dt) {
									if (dt.entered <= 0 || !winArr[0]) {
										let emed = new MessageEmbed()
											.setTitle('No one entered')
											.setDescription(
												`Oops.. No one entered the giveaway.\n\n` +
													(options.embed?.description
														? options.embed?.description
																.replaceAll('{prize}', prize)
																.replaceAll('{endsAt}', `<t:${endtime}:R>`)
																.replaceAll(
																	'{requirements}',
																	req === 'None'
																		? 'None'
																		: req +
																				' | ' +
																				(req === 'Role' ? `${val}` : val)
																)
																.replaceAll('{winCount}', winners)
																.replaceAll('{entered}', '0')
														: `**🎁 Prize**: *${dt.prize}*\n\n**⏰ Ends:** <t:${endtime}:R>\n`)
											)
											.addFields(
												{
													name: '🤔 Requirements:',
													value: `${
														req === 'None'
															? 'None'
															: req + ' | ' + (req === 'Role' ? `${val}` : val)
													}`
												},
												{ name: '🏆 Winner(s):', value: `\`${dt.winCount}\`` },
												{ name: '🎫 Entered', value: `***${dt.entered}***` }
											)
											.setColor('RED')
											.setFooter(
												options.embed?.credit
													? options.embed?.footer
													: {
															text: '©️ Simply Develop. npm i simply-djs',
															iconURL: 'https://i.imgur.com/u8VlLom.png'
													  }
											)

										let rowwee = new MessageActionRow().addComponents([
											enter.setDisabled(true),
											reroll.setDisabled(true),
											end.setDisabled(true)
										])

										return await msg.edit({
											embeds: [emed],
											components: [rowwee]
										})
									}

									let em = new MessageEmbed()
										.setTitle('We got the winner !')
										.setDescription(
											`${dispWin.join(', ')} got the prize !\n\n` +
												(options.embed?.description
													? options.embed?.description
															.replaceAll('{prize}', prize)
															.replaceAll('{endsAt}', `<t:${endtime}:R>`)
															.replaceAll(
																'{requirements}',
																req === 'None'
																	? 'None'
																	: req +
																			' | ' +
																			(req === 'Role' ? `${val}` : val)
															)
															.replaceAll('{winCount}', winners)
															.replaceAll('{entered}', '0')
													: `Reroll the giveaway using the button. \n\n**🎁 Prize**: *${dt.prize}*\n\n**⏰ Ends:** <t:${endtime}:R>`)
										)
										.addFields(
											{
												name: '🤔 Requirements:',
												value: `${
													req === 'None'
														? 'None'
														: req + ' | ' + (req === 'Role' ? `${val}` : val)
												}`
											},
											{ name: '🏆 Winner(s):', value: `\`${dt.winCount}\`` },
											{ name: '🎫 Entered', value: `***${dt.entered}***` }
										)
										.setColor(0x3bb143)
										.setFooter(
											options.embed?.credit
												? options.embed?.footer
												: {
														text: '©️ Simply Develop. npm i simply-djs',
														iconURL: 'https://i.imgur.com/u8VlLom.png'
												  }
										)

									let rowwe = new MessageActionRow().addComponents([
										enter.setDisabled(true),
										reroll.setDisabled(false),
										end.setDisabled(true)
									])

									await msg.edit({ embeds: [em], components: [rowwe] })
								}
							}, 5200)
						}
					}, 5000)
				})
		} catch (err: any) {
			console.log(
				`${chalk.red('Error Occured.')} | ${chalk.magenta(
					'giveaway'
				)} | Error: ${err.stack}`
			)
		}
	})
}