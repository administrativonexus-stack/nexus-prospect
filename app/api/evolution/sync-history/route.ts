import { NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { getSetting } from "@/lib/settings"
import { getChats, getChatMessages } from "@/lib/evolution/client"

export const maxDuration = 60

export async function POST() {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = await createServiceClient()

  const instanceName = (await getSetting("evolution_instance", user.id)) ?? "nexus"

  let totalMessages = 0
  let totalChats = 0
  let leadsCreated = 0

  try {
    // Clear conversations only for this user's leads
    const { data: userLeads } = await supabase
      .from("leads")
      .select("id")
      .eq("imported_by", user.id)

    if (userLeads && userLeads.length > 0) {
      const leadIds = userLeads.map((l) => l.id)
      await (supabase as any)
        .from("conversations")
        .delete()
        .in("lead_id", leadIds)
    }

    const chats = await getChats(instanceName, user.id)

    const chatCount = chats.length
    const sampleChat = chats[0] ? { keys: Object.keys(chats[0]), remoteJid: chats[0].remoteJid } : null

    for (const chat of chats) {
      if (!chat.remoteJid || chat.remoteJid.includes("@g.us")) continue

      const phone = chat.remoteJid.replace("@s.whatsapp.net", "")
      if (!phone) continue

      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("phone", phone)
        .eq("imported_by", user.id)
        .maybeSingle()

      let leadId: string

      if (existingLead) {
        leadId = existingLead.id
      } else {
        const { data: newLead, error: createErr } = await supabase
          .from("leads")
          .insert({
            company_name: `Contato Desconhecido (${phone})`,
            phone,
            status: "replied",
            imported_by: user.id,
          })
          .select("id")
          .single()

        if (createErr || !newLead) continue
        leadId = newLead.id
        leadsCreated++
      }

      const messages = await getChatMessages(instanceName, chat.remoteJid, user.id, 50)

      const rows = messages
        .map((msg) => {
          const text =
            msg.message?.conversation ??
            msg.message?.extendedTextMessage?.text ??
            null
          if (!text) return null

          return {
            lead_id: leadId,
            message: text,
            sender: (msg.key.fromMe ? "agent" : "lead") as "agent" | "lead",
            whatsapp_message_id: msg.key.id,
            read: true,
            created_at: new Date(msg.messageTimestamp * 1000).toISOString(),
          }
        })
        .filter(Boolean)

      if (rows.length === 0) continue

      await (supabase as any)
        .from("conversations")
        .upsert(rows, { onConflict: "whatsapp_message_id", ignoreDuplicates: true })

      totalMessages += rows.length
      totalChats++
    }

    return NextResponse.json({
      chats: totalChats,
      messages: totalMessages,
      leads_created: leadsCreated,
      _debug: { total_chats_found: chatCount, sample_chat: sampleChat },
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Sync failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
