<script setup lang="ts">
import { DataTableRow } from '@/components/DataTable'
import { type UpdateScheme, useWorkspace } from '@/store/store'
import { authorizeOpenIdConnect } from '@/views/Request/libs/openid-connect'
import { ScalarButton, useLoadingState } from '@scalar/components'
import type { Workspace } from '@scalar/oas-utils/entities'
import type {
  SecuritySchemaOpenId,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { useToasts } from '@scalar/use-toasts'

import RequestAuthDataTableInput from './RequestAuthDataTableInput.vue'

const { scheme, server, workspace } = defineProps<{
  scheme: SecuritySchemaOpenId
  server: Server | undefined
  workspace?: Workspace
}>()

const loadingState = useLoadingState()
const { toast } = useToasts()
const { securitySchemeMutators } = useWorkspace()

const updateScheme: UpdateScheme = (path, value) =>
  securitySchemeMutators.edit(scheme.uid, path, value)

/** Authorize the user using specified flow */
const handleAuthorize = async () => {
  if (loadingState.isLoading) return
  loadingState.startLoading()

  if (!server) {
    toast('No server selected', 'error')
    return
  }

  const [error, accessToken] = await authorizeOpenIdConnect(
    scheme,
    server,
    workspace?.proxyUrl,
  ).finally(() => loadingState.stopLoading())

  if (accessToken) updateScheme('token', accessToken)
  else {
    console.error(error)
    toast(error?.message ?? 'Failed to authorize', 'error')
  }
}
</script>

<template>
  <DataTableRow>
    <RequestAuthDataTableInput
      :modelValue="scheme.openIdConnectUrl"
      placeholder="https://galaxy.scalar.com/.well-known/openid-configuration"
      @update:modelValue="(v) => updateScheme('openIdConnectUrl', v)">
      OpenID Connect URL
    </RequestAuthDataTableInput>
  </DataTableRow>

  <DataTableRow class="min-w-full">
    <div class="h-8 flex items-center justify-end border-t-1/2 w-full">
      <ScalarButton
        class="p-0 py-0.5 px-2 mr-1"
        :loading="loadingState"
        size="sm"
        variant="outlined"
        @click="handleAuthorize">
        Authorize
      </ScalarButton>
    </div>
  </DataTableRow>
</template>
