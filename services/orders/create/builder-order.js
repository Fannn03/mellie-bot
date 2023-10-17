import { ChannelType, EmbedBuilder, PermissionFlagsBits, channelMention } from 'discord.js'
import 'dotenv/config'
import createOrderMessage from '../../../helper/messages/create-order.js'
import { getService } from '../../../repositories/service.js'
import { countOrder, createOrder } from '../../../repositories/order.js'

export default async (interaction) => {
  const fullname = interaction.fields.getTextInputValue('fullname')
  const phone = interaction.fields.getTextInputValue('phone')
  const address = interaction.fields.getTextInputValue('address')
  const notes = interaction.fields.getTextInputValue('notes')

  try {
    const service = await getService('builder')

    // Check if user already has 3 pending or unfinished order
    const validateOrder = await countOrder(interaction.user.id)
    if(validateOrder.count > 3) throw new Error("You've already 3 pending or process order that hasn't complete")

    const channel = await interaction.guild.channels.create({
      name: `❗👷${fullname}`,
      type: ChannelType.GuildText,
    })

    const request = {
      serviceId: service.dataValues.id,
      channelId: channel.id,
      userId: interaction.user.id,
      fullname: fullname,
      phone: phone,
      address: address,
      notes: notes
    }

    await createOrder(request) // insert data to sql

    channel.setParent(process.env.CHANNEL_ORDER)
    // assign permission member after move channel into category
    await interaction.guild.channels.edit(channel.id, {
      permissionOverwrites: [
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles
          ]
        }
      ]
    })

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Green")
          .setTitle("Order Created")
          .setDescription(`Please check your order ticket ${channelMention(channel.id)}`)
      ],
      ephemeral: true
    })
  
    await createOrderMessage(interaction.user.id, interaction.fields, channel)

    return setTimeout(async () => {
      await interaction.deleteReply()
    }, 5000)
  } catch (err) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("Red")
          .setTitle("Order Failed")
          .setDescription(err.message)
      ],
      ephemeral: true
    })

    return setTimeout(async () => {
      await interaction.deleteReply()
    }, 5000)
  }
}