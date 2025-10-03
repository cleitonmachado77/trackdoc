"use client"

import EntityInvitationAccept from "@/app/components/entity-invitation-accept"

export default function AcceptInvitationPage({ params }: { params: { token: string } }) {
  return <EntityInvitationAccept token={params.token} />
}
