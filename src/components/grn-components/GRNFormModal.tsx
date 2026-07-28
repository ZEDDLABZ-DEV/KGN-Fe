/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react"
import { Modal } from "antd"
import type { GRN, GRNSummaryItem } from "../../hooks/useGRN"
import { GRNFormContent, type GRNFormContentHandle, type GRNFormPOContext } from "./GRNFormContent"

export type { GRNFormPOContext } from "./GRNFormContent"

interface GRNFormModalProps {
  open: boolean
  mode: "create" | "edit"
  po: GRNFormPOContext | null
  summary: GRNSummaryItem[] | null
  grn?: GRN | null
  onClose: () => void
  onSaved: () => void | Promise<void>
  createGRN: (payload: any) => Promise<any>
  updateGRN: (id: string, payload: any) => Promise<any>
}

/**
 * Modal wrapper around the shared `GRNFormContent`. Used by the standalone
 * GRN page; the Purchase Orders page renders `GRNFormContent` directly inside
 * its own two-mode "Record GRN" modal instead of nesting this one.
 */
export const GRNFormModal = ({ open, mode, po, summary, grn, onClose, onSaved, createGRN, updateGRN }: GRNFormModalProps) => {
  const contentRef = useRef<GRNFormContentHandle>(null)
  const [saving, setSaving] = useState(false)

  return (
    <Modal
      title={mode === "edit" ? `Edit ${grn?.grnNumber || "GRN"}` : "New GRN"}
      open={open}
      onCancel={onClose}
      onOk={() => contentRef.current?.submit()}
      confirmLoading={saving}
      okText={mode === "edit" ? "Save Changes" : "Create GRN"}
      width={900}
      destroyOnClose
    >
      <GRNFormContent
        ref={contentRef}
        mode={mode}
        po={po}
        summary={summary}
        grn={grn}
        createGRN={createGRN}
        updateGRN={updateGRN}
        onSaved={onSaved}
        onSavingChange={setSaving}
      />
    </Modal>
  )
}
