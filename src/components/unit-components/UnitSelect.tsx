import { useEffect, useMemo, useState } from "react"
import { Select, Spin } from "antd"
import type { SelectProps } from "antd"
import { fetchActiveUnits } from "../../hooks/useUnits"

interface UnitSelectProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  size?: SelectProps["size"]
  className?: string
  disabled?: boolean
}

/**
 * Searchable unit-of-measurement select backed by the admin-curated Units
 * list. The backend stores `unit` as a plain string (not a foreign key) on
 * item rows, so users can also type a custom value that isn't in the list.
 */
export const UnitSelect = ({
  value,
  onChange,
  placeholder = "Select or type a unit",
  size,
  className,
  disabled,
}: UnitSelectProps) => {
  const [unitNames, setUnitNames] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState("")

  useEffect(() => {
    let mounted = true

    fetchActiveUnits()
      .then((units) => {
        if (mounted) setUnitNames(units.map((unit) => unit.name))
      })
      .catch(() => {
        // UnitSelect stays usable (free-text entry) even if the list fails to load
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const options = useMemo(() => {
    const base = unitNames.map((name) => ({ label: name, value: name }))
    const trimmed = searchText.trim()
    const alreadyPresent = base.some((opt) => opt.value.toLowerCase() === trimmed.toLowerCase())

    if (trimmed && !alreadyPresent) {
      base.push({ label: `Use "${trimmed}"`, value: trimmed })
    }

    return base
  }, [unitNames, searchText])

  return (
    <Select
      showSearch
      allowClear
      value={value || undefined}
      onChange={(val) => onChange?.(val as string)}
      onSearch={setSearchText}
      placeholder={placeholder}
      size={size}
      className={className}
      disabled={disabled}
      options={options}
      notFoundContent={loading ? <Spin size="small" /> : null}
      filterOption={(input, option) => (option?.label as string)?.toLowerCase().includes(input.toLowerCase())}
    />
  )
}
