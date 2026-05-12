'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Cpu, ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createAgentSchema, type CreateAgentFormData } from '@/lib/schemas'
import { useCreateAgent, useUpdateAgent } from '@/hooks/useAgents'
import type { AgentConfig } from '@/types'

const OLLAMA_MODELS = [
  'llama3', 'llama3:8b', 'llama3:70b',
  'llama2', 'llama2:13b',
  'mistral', 'mistral:7b',
  'gemma:2b', 'gemma:7b',
  'phi3', 'phi3:mini',
  'codellama', 'codellama:13b',
  'deepseek-coder', 'deepseek-coder:6.7b',
  "qwen2.5-coder:7b",  // <-- ADD THIS
  "llama3.1"
]

interface Props {
  open:          boolean
  onClose:       () => void
  workspaceId:   number
  editingAgent?: AgentConfig | null
}

export function AddAgentModal({ open, onClose, workspaceId, editingAgent }: Props) {
  const { mutate: create, isPending: isCreating } = useCreateAgent()
  const { mutate: update, isPending: isUpdating } = useUpdateAgent()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateAgentFormData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      model_name:    'llama3',
      system_prompt: 'You are a helpful AI assistant.',
      temperature:   0.7,
    },
  })

  const temperature = watch('temperature')

  useEffect(() => {
    reset(editingAgent
      ? { model_name: editingAgent.model_name, system_prompt: editingAgent.system_prompt, temperature: editingAgent.temperature }
      : { model_name: 'llama3', system_prompt: 'You are a helpful AI assistant.', temperature: 0.7 }
    )
  }, [editingAgent, open, reset])

  function onSubmit(data: CreateAgentFormData) {
    const opts = { onSuccess: () => { onClose(); reset() } }
    if (editingAgent) {
      update({ id: editingAgent.id, payload: data }, opts)
    } else {
      create({ ...data, workspace_id: workspaceId }, opts)
    }
  }

  const tempColor =
    temperature < 0.4 ? 'text-blue-400' :
    temperature < 1.0 ? 'text-cyan-400' :
    temperature < 1.6 ? 'text-orange-400' : 'text-red-400'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingAgent ? 'Edit Agent Configuration' : 'Create New Agent'}
      description="Configure a local LLM agent to attach to your workspace."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Model selector */}
        <div className="space-y-1.5">
          <label className="block font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
            Ollama Model
          </label>
          <div className="relative">
            <Cpu className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500/60" />
            <select
              {...register('model_name')}
              className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.05] py-2.5 pl-10 pr-10 font-mono text-sm text-white backdrop-blur-xl focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
            >
              {OLLAMA_MODELS.map((m) => (
                <option key={m} value={m} className="bg-space-800">{m}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          </div>
          {errors.model_name && (
            <p className="text-xs text-red-400">{errors.model_name.message}</p>
          )}
        </div>

        {/* System prompt */}
        <div className="space-y-1.5">
          <label className="block font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
            System Prompt
          </label>
          <textarea
            {...register('system_prompt')}
            rows={4}
            placeholder="You are a helpful AI assistant specialized in…"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 font-mono text-sm text-white placeholder:text-white/20 backdrop-blur-xl focus:border-cyan-500/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/15"
          />
          {errors.system_prompt && (
            <p className="text-xs text-red-400">{errors.system_prompt.message}</p>
          )}
        </div>

        {/* Temperature slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-display text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3" />
              Temperature
            </label>
            <span className={`font-mono text-sm font-bold ${tempColor}`}>
              {Number(temperature).toFixed(1)}
            </span>
          </div>

          <Controller
            control={control}
            name="temperature"
            render={({ field }) => (
              <div className="relative">
                <input
                  type="range" min="0" max="2" step="0.1"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-400"
                />
                {/* Track fill overlay */}
                <div
                  className="pointer-events-none absolute left-0 top-0 h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all"
                  style={{ width: `${(Number(temperature) / 2) * 100}%`, marginTop: '0px' }}
                />
              </div>
            )}
          />

          <div className="flex justify-between font-display text-[9px] text-white/25 uppercase tracking-widest">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            loading={isCreating || isUpdating}
          >
            {editingAgent ? 'Save Changes' : 'Create Agent'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}